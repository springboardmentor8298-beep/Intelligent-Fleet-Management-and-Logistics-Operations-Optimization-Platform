from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.schemas import (
    UserCreate, UserResponse, Token,
    UserProfileUpdate, PasswordChangeRequest,
    AccountSettingsResponse, AccountSettingsUpdate
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["User & Account Management"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "email": user.email
    }

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile email or role (if authorized)."""
    if payload.email and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = payload.email

    if payload.role and payload.role != current_user.role:
        if current_user.role == UserRole.ADMINISTRATOR:
            current_user.role = payload.role
        else:
            raise HTTPException(status_code=403, detail="Only administrators can modify roles")

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user password with verification."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/settings", response_model=AccountSettingsResponse)
def get_account_settings(current_user: User = Depends(get_current_user)):
    """Retrieve operational account settings and notification preferences."""
    return AccountSettingsResponse(
        email=current_user.email,
        role=current_user.role.value,
        notifications_enabled=True,
        sms_alerts_enabled=True,
        email_digests_enabled=True,
        theme_preference="dark",
        language="en",
        timezone="UTC"
    )

@router.put("/settings", response_model=AccountSettingsResponse)
def update_account_settings(
    payload: AccountSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Save account operational settings and notification preferences."""
    return AccountSettingsResponse(
        email=current_user.email,
        role=current_user.role.value,
        notifications_enabled=payload.notifications_enabled if payload.notifications_enabled is not None else True,
        sms_alerts_enabled=payload.sms_alerts_enabled if payload.sms_alerts_enabled is not None else True,
        email_digests_enabled=payload.email_digests_enabled if payload.email_digests_enabled is not None else True,
        theme_preference=payload.theme_preference or "dark",
        language=payload.language or "en",
        timezone=payload.timezone or "UTC"
    )

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None, description="Filter by UserRole"),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.FLEET_MANAGER])),
    db: Session = Depends(get_db)
):
    """List registered users across roles (RBAC restricted to Admin & Fleet Manager)."""
    query = db.query(User)
    if role:
        for r in UserRole:
            if role.lower() in [r.value.lower(), r.name.lower()]:
                query = query.filter(User.role == r)
                break
    return query.order_by(User.id.asc()).all()