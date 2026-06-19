from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
from database import engine, get_db
from firebase_config import verify_firebase_token, create_firebase_user

# Create database tables automatically if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="S-TECH Attendance Management System API",
    version="1.0.0"
)

@app.post("/admin/create-teacher", status_code=status.HTTP_201_CREATED)
def admin_create_teacher(
    name: str,
    email: str,
    department: str,
    mobile: str,
    password: str,
    current_user: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
):
    # Security: Verify that the executing user is explicitly an Administrator
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Requires administrator credentials."
        )

    # 1. Register security identity in Firebase Auth
    uid = create_firebase_user(email=email, password=password, role="teacher")

    # 2. Record transactional operational metadata in your relational database
    db_teacher = models.Teacher(
        teacher_id=uid, # Link Firebase UID with Database Primary Key
        name=name,
        department=department,
        email=email,
        mobile=mobile
    )
    
    try:
        db.add(db_teacher)
        db.commit()
        db.refresh(db_teacher)
        return {"status": "Success", "message": f"Teacher account {uid} created successfully."}
    except Exception as db_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database sync failed: {str(db_err)}"
        )