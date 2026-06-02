from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import students, attendance

app = FastAPI(
    title="Facial Recognition Attendance System",
    description="API for registering students and marking attendance via face recognition.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the React dev server (Vite default: 5173) to talk to us.
# For a production deployment, replace the origins list with your real domain.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # fallback CRA / other dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(students.router)
app.include_router(attendance.router)


# ---------------------------------------------------------------------------
# Root health-check — useful for verifying the server is running
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "message": "Attendance API is running.",
        "docs": "/docs",
    }


# ---------------------------------------------------------------------------
# Run directly with: python main.py
# Or use:           uvicorn main:app --reload
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)