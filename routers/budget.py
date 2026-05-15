from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import UserProfile, Income, Expense, BudgetGoal, User
from schemas import BudgetGoalCreate, BudgetGoalOut, BudgetSummary
from auth import get_current_user
from typing import List
from datetime import date

router = APIRouter(prefix="/budget", tags=["Budget"])


def calculate_budget(month: str, user_id: int, db: Session) -> dict:
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()

    if not profile or not profile.is_earning:
        return {
            "month": month, "salary": 0, "extra_income": 0,
            "total_budget": 0, "total_spent": 0, "remaining": 0,
            "remaining_percentage": 0, "is_over_budget": False, "warning": False
        }

    salary       = profile.salary or 0
    income_list  = db.query(Income).filter(
        Income.user_id == user_id,
        Income.month   == month,
        Income.type    == "one_time"
    ).all()
    extra_income = sum(i.amount for i in income_list)
    total_budget = salary + extra_income

    expenses     = db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.date.startswith(month)
    ).all()
    total_spent  = sum(e.amount for e in expenses)
    remaining    = total_budget - total_spent
    remaining_pct = (remaining / total_budget * 100) if total_budget > 0 else 0

    return {
        "month":                month,
        "salary":               salary,
        "extra_income":         extra_income,
        "total_budget":         total_budget,
        "total_spent":          total_spent,
        "remaining":            remaining,
        "remaining_percentage": round(remaining_pct, 1),
        "is_over_budget":       remaining < 0,
        "warning":              remaining_pct < 20 and remaining > 0
    }


@router.get("/summary/{month}", response_model=BudgetSummary)
def get_budget_summary(
    month:        str,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return calculate_budget(month, current_user.id, db)


@router.get("/summary", response_model=BudgetSummary)
def get_current_budget_summary(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    current_month = date.today().strftime("%Y-%m")
    return calculate_budget(current_month, current_user.id, db)


@router.post("/goals", response_model=BudgetGoalOut)
def set_budget_goal(
    data:         BudgetGoalCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    existing = db.query(BudgetGoal).filter(
        BudgetGoal.user_id  == current_user.id,
        BudgetGoal.category == data.category,
        BudgetGoal.month    == data.month
    ).first()

    if existing:
        existing.limit = data.limit
        db.commit()
        db.refresh(existing)
        goal = existing
    else:
        goal = BudgetGoal(
            user_id  = current_user.id,
            category = data.category,
            limit    = data.limit,
            month    = data.month
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)

    expenses = db.query(Expense).filter(
        Expense.user_id  == current_user.id,
        Expense.category == goal.category,
        Expense.date.startswith(goal.month)
    ).all()
    spent = sum(e.amount for e in expenses)

    return BudgetGoalOut(
        id         = goal.id,
        category   = goal.category,
        limit      = goal.limit,
        month      = goal.month,
        spent      = spent,
        remaining  = max(goal.limit - spent, 0),
        percentage = round(spent / goal.limit * 100, 1) if goal.limit > 0 else 0
    )


@router.get("/goals/{month}", response_model=List[BudgetGoalOut])
def get_budget_goals(
    month:        str,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goals  = db.query(BudgetGoal).filter(
        BudgetGoal.user_id == current_user.id,
        BudgetGoal.month   == month
    ).all()
    result = []
    for goal in goals:
        expenses = db.query(Expense).filter(
            Expense.user_id  == current_user.id,
            Expense.category == goal.category,
            Expense.date.startswith(month)
        ).all()
        spent = sum(e.amount for e in expenses)
        result.append(BudgetGoalOut(
            id         = goal.id,
            category   = goal.category,
            limit      = goal.limit,
            month      = goal.month,
            spent      = spent,
            remaining  = max(goal.limit - spent, 0),
            percentage = round(spent / goal.limit * 100, 1) if goal.limit > 0 else 0
        ))
    return result


@router.delete("/goals/{id}")
def delete_budget_goal(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(BudgetGoal).filter(
        BudgetGoal.id      == id,
        BudgetGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Budget goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Budget goal deleted"}