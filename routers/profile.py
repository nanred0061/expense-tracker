from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import UserProfile, SalaryHistory, User
from schemas import (
    UserProfileCreate, UserProfileUpdate, UserProfileOut,
    SalaryUpdate, SalaryHistoryOut
)
from auth import get_current_user
from datetime import date
from typing import List

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserProfileOut)
def get_profile(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("", response_model=UserProfileOut)
def create_profile(
    data:         UserProfileCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    existing = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile = UserProfile(
        user_id             = current_user.id,
        is_earning          = data.is_earning,
        salary              = data.salary if data.is_earning else None,
        rollover_preference = data.rollover_preference,
        split_percentage    = data.split_percentage,
        reset_day           = 1
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("", response_model=UserProfileOut)
def update_profile(
    data:         UserProfileUpdate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/salary", response_model=UserProfileOut)
def update_salary(
    data:         SalaryUpdate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    history = SalaryHistory(
        user_id    = current_user.id,
        old_salary = profile.salary or 0,
        new_salary = data.new_salary,
        changed_on = str(date.today()),
        reason     = data.reason,
        effective  = data.effective
    )
    db.add(history)
    profile.salary     = data.new_salary
    profile.is_earning = True
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/salary/history", response_model=List[SalaryHistoryOut])
def get_salary_history(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(SalaryHistory)\
             .filter(SalaryHistory.user_id == current_user.id)\
             .order_by(SalaryHistory.id.desc())\
             .all()