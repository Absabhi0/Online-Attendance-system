from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.database import supabase
from app.services.face_service import find_matching_student
from datetime import date

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/scan", status_code=200)
async def scan_face(
    subject: str = Form(...),
    frame: UploadFile = File(...),
):
    """
    Receives a webcam frame and a subject (from the logged-in professor).
    1. Fetches all student encodings from Supabase.
    2. Runs face matching against the frame.
    3. If matched, logs attendance (with duplicate guard for the same day + subject).
    4. If not matched, returns a clear 'unregistered face' error.
    """

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

    if matched_student is None:
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

    # --- Duplicate attendance guard (same student, same subject, same day) ---
    already_marked = (
        supabase.table("attendance")
        .select("id, time")
        .eq("student_id", student_id)
        .eq("subject", subject)
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
                    f"{subject} today (at {marked_time})."
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
            "subject": subject,
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
        "subject": subject,
        "date": today,
        "match_confidence": matched_student.get("match_confidence"),
    }


@router.get("/report", status_code=200)
async def get_attendance_report(subject: str = None, report_date: str = None):
    """
    Returns an attendance report, optionally filtered by subject and/or date.
    Date format: YYYY-MM-DD. Defaults to today.
    """
    target_date = report_date or date.today().isoformat()

    query = (
        supabase.table("attendance")
        .select(
            "id, date, time, subject, "
            "students(name, roll_number)"
        )
        .eq("date", target_date)
    )

    if subject:
        query = query.eq("subject", subject)

    result = query.order("time").execute()

    return {
        "date": target_date,
        "total": len(result.data),
        "records": result.data,
    }