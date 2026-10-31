from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.audit import AuditLog
from backend.app.services.auth_service import get_password_hash
from backend.app.api.auth import require_admin

router = APIRouter(prefix="/users", tags=["User Management"])

class UserCreateAdmin(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: str = "inspector"
    department: Optional[str] = "Legal Metrology Department"
    badge_number: Optional[str] = None

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    badge_number: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "department": u.department,
            "badge_number": u.badge_number,
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else ""
        }
        for u in users
    ]

@router.post("")
def create_user_by_admin(user_in: UserCreateAdmin, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        department=user_in.department,
        badge_number=user_in.badge_number,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit = AuditLog(
        user_id=admin.id,
        user_name=admin.username,
        action="USER_CREATED",
        entity_type="user",
        entity_id=str(new_user.id),
        details=f"Admin created user {new_user.username} with role {new_user.role}"
    )
    db.add(audit)
    db.commit()

    return {"message": "User created successfully", "user_id": new_user.id}

@router.put("/{user_id}")
def update_user_by_admin(
    user_id: int,
    user_up: UserUpdateAdmin,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if user_up.full_name:
        target.full_name = user_up.full_name
    if user_up.role:
        target.role = user_up.role
    if user_up.department:
        target.department = user_up.department
    if user_up.badge_number:
        target.badge_number = user_up.badge_number
    if user_up.is_active is not None:
        target.is_active = user_up.is_active

    db.commit()
    return {"message": "User updated successfully"}

@router.get("/audit-logs")
def get_audit_logs(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_name": l.user_name,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.strftime("%Y-%m-%d %H:%M:%S") if l.created_at else ""
        }
        for l in logs
    ]

