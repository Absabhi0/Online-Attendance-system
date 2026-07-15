from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.database import supabase
from app.services.face_service import extract_encoding_from_image
from fastapi import HTTPException

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("/register", status_code=201)
async def register_student(
    name: str = Form(...),
    roll_number: str = Form(...),
    email: str = Form(None),
    photos: list[UploadFile] = File(...),
):
    """S
    Register a new student by uploading 3-5 photos.
    Extracts a face encoding from each photo and stores them all
    in the students table as a JSONB array.
    """
    # --- Validation ---
    if not (3 <= len(photos) <= 5):
        raise HTTPException(
            status_code=422,
            detail=f"Please upload between 3 and 5 photos. You uploaded {len(photos)}.",
        )

    for photo in photos:
        if photo.content_type not in ("image/jpeg", "image/png", "image/webp"):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {photo.content_type}. Use JPEG or PNG.",
            )

    # --- Check for duplicate roll number ---
    existing = (
        supabase.table("students")
        .select("id")
        .eq("roll_number", roll_number)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail=f"A student with roll number '{roll_number}' is already registered.",
        )

    # --- Extract face encodings from every uploaded photo ---
    encodings = []
    failed_photos = []

    for idx, photo in enumerate(photos, start=1):
        image_bytes = await photo.read()
        try:
            encoding = extract_encoding_from_image(image_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if encoding is None:
            # No face detected in this specific photo — collect and report
            failed_photos.append(f"Photo {idx} ({photo.filename})")
        else:
            encodings.append(encoding)

    if not encodings:
        raise HTTPException(
            status_code=422,
            detail=(
                "No faces were detected in any of the uploaded photos. "
                "Please use clear, well-lit frontal face photos."
            ),
        )

    # --- Save to Supabase ---
    payload = {
        "name": name,
        "roll_number": roll_number,
        "face_encodings": encodings,
    }
    if email:
        payload["email"] = email

    result = supabase.table("students").insert(payload).execute()

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to save student to the database.",
        )

    student = result.data[0]

    response = {
        "message": f"Student '{name}' registered successfully.",
        "student_id": student["id"],
        "encodings_saved": len(encodings),
    }

    if failed_photos:
        response["warnings"] = (
            f"No face detected in: {', '.join(failed_photos)}. "
            f"Remaining {len(encodings)} photo(s) were used."
        )

    return response


@router.get("/", status_code=200)
async def list_students():
    """
    Returns all registered students (without their encoding data).
    Useful for populating dropdowns or an admin view.
    """
    result = (
        supabase.table("students")
        .select("id, name, roll_number, email, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return {"students": result.data}

    
from pydantic import BaseModel


# Define the login request schema
class StudentLoginRequest(BaseModel):
    roll_number: str
    passcode: str

@router.post("/login")
def student_login(credentials: StudentLoginRequest):
    # Search for the student matching the roll number
    response = supabase.table("students").select("id", "name", "roll_number", "passcode").eq("roll_number", credentials.roll_number).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Roll Number or Student Profile not found."
        )
        
    student = response.data[0]
    
    # Check if the passcode matches
    if student["passcode"] != credentials.passcode:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect passcode."
        )
        
    # Return profile data (excluding passcode for security)
    return {
        "status": "success",
        "student": {
            "id": student["id"],
            "name": student["name"],
            "roll_number": student["roll_number"]
        }
    }

@router.delete("/{student_id}")
async def delete_student(student_id: str):  # <--- Changed 'int' to 'str' here!
    """
    Deletes a student from the Supabase database by their ID.
    """
    # 1. Attempt to delete the student where the ID matches
    result = supabase.table("students").delete().eq("id", student_id).execute()
    
    # 2. If result.data is empty, it means no student was found with that ID
    if not result.data:
        raise HTTPException(status_code=404, detail="Student not found or already deleted.")
        
    deleted_student = result.data[0]
    
    return {"message": f"Student '{deleted_student['name']}' deleted successfully"}