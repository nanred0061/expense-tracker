from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import UserProfile, Income, Expense, SavingsGoal, MonthRollover, User
from schemas import RolloverOut
from auth import get_current_user
from typing import Optional
from datetime import date

router = APIRouter(prefix="/rollover", tags=["Rollover"])


def get_last_month() -> str:
    today = date.today()
    if today.month == 1:
        return f"{today.year - 1}-12"
    return f"{today.year}-{str(today.month - 1).zfill(2)}"


def calculate_leftover(month: str, user_id: int, db: Session) -> float:
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()
    if not profile or not profile.is_earning:
        return 0
    salary       = profile.salary or 0
    income_list  = db.query(Income).filter(
        Income.user_id == user_id,
        Income.month   == month,
        Income.type    == "one_time"
    ).all()
    extra        = sum(i.amount for i in income_list)
    expenses     = db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.date.startswith(month)
    ).all()
    spent        = sum(e.amount for e in expenses)
    return max((salary + extra) - spent, 0)


@router.post("/process")
def process_rollover(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    today      = date.today()
    last_month = get_last_month()

    existing = db.query(MonthRollover).filter(
        MonthRollover.user_id == current_user.id,
        MonthRollover.month   == last_month
    ).first()
    if existing:
        return existing

    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    if not profile or not profile.is_earning:
        return None

    leftover = calculate_leftover(last_month, current_user.id, db)

    if leftover <= 0:
        record = MonthRollover(
            user_id         = current_user.id,
            month           = last_month,
            leftover        = 0,
            to_savings      = 0,
            carried_forward = 0,
            processed_on    = str(today)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    if profile.rollover_preference == "savings":
        to_savings      = leftover
        carried_forward = 0
    elif profile.rollover_preference == "carry_forward":
        to_savings      = 0
        carried_forward = leftover
    else:
        pct             = profile.split_percentage / 100
        to_savings      = round(leftover * pct, 2)
        carried_forward = round(leftover - to_savings, 2)

    if to_savings > 0:
        goal = db.query(SavingsGoal).filter(
            SavingsGoal.user_id      == current_user.id,
            SavingsGoal.is_completed == False
        ).first()
        if goal:
            goal.saved_amount += to_savings
            if goal.saved_amount >= goal.target_amount:
                goal.is_completed = True
                goal.saved_amount = goal.target_amount
            db.commit()

    if carried_forward > 0:
        current_month = today.strftime("%Y-%m")
        carry = Income(
            user_id = current_user.id,
            amount  = carried_forward,
            source  = "carried_forward",
            type    = "one_time",
            month   = current_month,
            date    = str(today),
            notes   = f"Carried forward from {last_month}"
        )
        db.add(carry)
        db.commit()

    record = MonthRollover(
        user_id         = current_user.id,
        month           = last_month,
        leftover        = leftover,
        to_savings      = to_savings,
        carried_forward = carried_forward,
        processed_on    = str(today)
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/history")
def get_rollover_history(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(MonthRollover)\
             .filter(MonthRollover.user_id == current_user.id)\
             .order_by(MonthRollover.id.desc())\
             .all()


@router.get("/status/{month}")
def get_rollover_status(
    month:        str,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    rollover = db.query(MonthRollover).filter(
        MonthRollover.user_id == current_user.id,
        MonthRollover.month   == month
    ).first()
    if not rollover:
        return {"processed": False, "month": month}
    return {
        "processed":        True,
        "month":            rollover.month,
        "leftover":         rollover.leftover,
        "to_savings":       rollover.to_savings,
        "carried_forward":  rollover.carried_forward,
        "processed_on":     rollover.processed_on
    }