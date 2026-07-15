from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from passlib.context import CryptContext
import re

from app.database import supabase

router = APIRouter(prefix="/professors", tags=["Professors"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def slugify_name(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z]", "", name.lower())
    return slug or "professor"


class ProfessorRegisterRequest(BaseModel):
    name: str
    subject: str
    password: str


class ProfessorLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register", status_code=201)
async def register_professor(payload: ProfessorRegisterRequest):
    base_slug = slugify_name(payload.name)
    email = f"{base_slug}@college.edu"

    existing = supabase.table("professors").select("id").eq("email", email).execute()
    if existing.data:
        suffix = 1
        while True:
            candidate = f"{base_slug}{suffix}@college.edu"
            check = supabase.table("professors").select("id").eq("email", candidate).execute()
            if not check.data:
                email = candidate
                break
            suffix += 1

    hashed_password = pwd_context.hash(payload.password)

    result = supabase.table("professors").insert({
        "name": payload.name,
        "email": email,
        "subject": payload.subject,
        "password": hashed_password,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create professor account.")

    professor = result.data[0]
    return {
        "message": f"Professor '{payload.name}' created successfully.",
        "professor": {
            "id": professor["id"],
            "name": professor["name"],
            "email": professor["email"],
            "subject": professor["subject"],
        },
    }


@router.post("/login")
async def login_professor(credentials: ProfessorLoginRequest):
    response = (
        supabase.table("professors")
        .select("id, name, email, subject, password")
        .eq("email", credentials.email)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    professor = response.data[0]

    if not pwd_context.verify(credentials.password, professor["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return {
        "status": "success",
        "professor": {
            "id": professor["id"],
            "name": professor["name"],
            "email": professor["email"],
            "subject": professor["subject"],
        },
    }

@router.get("/")
async def list_professors():
    """
    Returns all professors (name + subject only) for lookups like
    displaying 'which professor teaches this subject' in reports.
    """
    result = (
        supabase.table("professors")
        .select("id, name, subject")
        .execute()
    )
    return {"professors": result.data}