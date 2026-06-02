from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.database import supabase
from app.services.face_service import find_matching_student
from datetime import date

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/scan", status_code=200)
async def scan_face(
    course_id: str = Form(...),
    frame: UploadFile = File(...),
):
    """
    Receives a webcam frame and a course_id.
    1. Fetches all student encodings from Supabase.
    2. Runs face matching against the frame.
    3. If matched, logs attendance (with duplicate guard for the same day).
    4. If not matched, returns a clear 'unregistered face' error.
    """

    # --- Validate course exists ---
    course_result = (
        supabase.table("courses")
        .select("id, name, code")
        .eq("id", course_id)
        .single()
        .execute()
    )
    if not course_result.data:
        raise HTTPException(
            status_code=404,
            detail=f"Course with id '{course_id}' not found.",
        )
    course = course_result.data

    # --- Load all students with their encodings ---
    students_result = (
        supabase.table("students")
        .select("id, name, roll_number, face_encodings")
        .execute()
    )
    all_students = students_result.data

    if not all_students:
        raise HTTPException(
            status_code=404,
            detail="No registered students found. Please register students first.",
        )

    # --- Decode the frame and attempt face match ---
    frame_bytes = await frame.read()

    try:
        matched_student = find_matching_student(frame_bytes, all_students, tolerance=0.5)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # --- No face detected at all ---
    if matched_student is None:
        # Distinguish: did we detect a face but find no match, vs no face at all?
        # find_matching_student returns None for both; we return 422 for demo clarity.
        raise HTTPException(
            status_code=422,
            detail={
                "error": "UNREGISTERED_FACE",
                "message": (
                    "Face detected but not recognised, or no face found. "
                    "Please register this student first."
                ),
            },
        )

    student_id = matched_student["id"]
    today = date.today().isoformat()

    # --- Duplicate attendance guard (same student, same course, same day) ---
    already_marked = (
        supabase.table("attendance")
        .select("id, time")
        .eq("student_id", student_id)
        .eq("course_id", course_id)
        .eq("date", today)
        .execute()
    )

    if already_marked.data:
        marked_time = already_marked.data[0]["time"]
        raise HTTPException(
            status_code=409,
            detail={
                "error": "ALREADY_MARKED",
                "message": (
                    f"{matched_student['name']} is already marked present for "
                    f"{course['name']} today (at {marked_time})."
                ),
                "student": {
                    "id": student_id,
                    "name": matched_student["name"],
                    "roll_number": matched_student["roll_number"],
                },
            },
        )

    # --- Insert attendance record ---
    attendance_result = (
        supabase.table("attendance")
        .insert({
            "student_id": student_id,
            "course_id": course_id,
            "date": today,
        })
        .execute()
    )

    if not attendance_result.data:
        raise HTTPException(
            status_code=500,
            detail="Match found but failed to save attendance record.",
        )

    return {
        "message": "Attendance marked successfully.",
        "student": {
            "id": student_id,
            "name": matched_student["name"],
            "roll_number": matched_student["roll_number"],
        },
        "course": {
            "id": course["id"],
            "name": course["name"],
            "code": course["code"],
        },
        "date": today,
        "match_confidence": matched_student.get("match_confidence"),
    }


@router.get("/report", status_code=200)
async def get_attendance_report(course_id: str = None, report_date: str = None):
    """
    Returns an attendance report, optionally filtered by course and/or date.
    Date format: YYYY-MM-DD. Defaults to today.
    """
    target_date = report_date or date.today().isoformat()

    query = (
        supabase.table("attendance")
        .select(
            "id, date, time, "
            "students(name, roll_number), "
            "courses(name, code)"
        )
        .eq("date", target_date)
    )

    if course_id:
        query = query.eq("course_id", course_id)

    result = query.order("time").execute()

    return {
        "date": target_date,
        "total": len(result.data),
        "records": result.data,
    }