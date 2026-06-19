from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(String(50), primary_key=True, index=True) # Matches Firebase UID
    name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    mobile = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    classes = relationship("ClassRoom", back_populates="teacher")
    attendance_records = relationship("Attendance", back_populates="teacher")


class ClassRoom(Base):
    __tablename__ = "classes"

    class_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    class_name = Column(String(50), nullable=False)
    section = Column(String(10), nullable=False)
    teacher_id = Column(String(50), ForeignKey("teachers.teacher_id", ondelete="SET NULL"), nullable=True)

    # Relationships
    teacher = relationship("Teacher", back_populates="classes")
    students = relationship("Student", back_populates="classroom")


class Student(Base):
    __tablename__ = "students"

    student_id = Column(String(50), primary_key=True, index=True) # Matches Firebase UID
    name = Column(String(100), nullable=False)
    dob = Column(Date, nullable=False)
    gender = Column(String(20), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id", ondelete="RESTRICT"), nullable=False)
    section = Column(String(10), nullable=False)
    roll_number = Column(String(50), nullable=False)
    parent_name = Column(String(100), nullable=False)
    parent_mobile = Column(String(20), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    classroom = relationship("ClassRoom", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendance"

    attendance_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(String(50), ForeignKey("teachers.teacher_id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum("Present", "Absent", "Late", "Leave", name="attendance_status"), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    teacher = relationship("Teacher", back_populates="attendance_records")