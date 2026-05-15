from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SavingsGoal, User
from schemas import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalOut
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/savings", tags=["Savings"])


def build_goal_response(goal: SavingsGoal) -> SavingsGoalOut:
    remaining_amount = goal.target_amount - goal.saved_amount
    if goal.is_completed:
        months_remaining = 0
    elif goal.monthly_saving > 0:
        months_remaining = round(remaining_amount / goal.monthly_saving, 1)
    else:
        months_remaining = 0
    percentage = round(
        goal.saved_amount / goal.target_amount * 100, 1
    ) if goal.target_amount > 0 else 0
    return SavingsGoalOut(
        id               = goal.id,
        name             = goal.name,
        target_amount    = goal.target_amount,
        saved_amount     = goal.saved_amount,
        monthly_saving   = goal.monthly_saving,
        created_date     = goal.created_date,
        is_completed     = goal.is_completed,
        months_remaining = months_remaining,
        percentage       = percentage
    )


@router.post("", response_model=SavingsGoalOut)
def create_savings_goal(
    data:         SavingsGoalCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = SavingsGoal(
        user_id        = current_user.id,
        name           = data.name,
        target_amount  = data.target_amount,
        saved_amount   = 0,
        monthly_saving = data.monthly_saving,
        created_date   = data.created_date,
        is_completed   = False
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return build_goal_response(goal)


@router.get("", response_model=List[SavingsGoalOut])
def get_savings_goals(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.id
    ).order_by(SavingsGoal.is_completed, SavingsGoal.id).all()
    return [build_goal_response(g) for g in goals]


@router.get("/{id}", response_model=SavingsGoalOut)
def get_savings_goal(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id      == id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return build_goal_response(goal)


@router.put("/{id}", response_model=SavingsGoalOut)
def update_savings_goal(
    id:           int,
    updates:      SavingsGoalUpdate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id      == id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(goal, key, value)
    if goal.saved_amount >= goal.target_amount:
        goal.is_completed = True
        goal.saved_amount = goal.target_amount
    db.commit()
    db.refresh(goal)
    return build_goal_response(goal)


@router.post("/{id}/add", response_model=SavingsGoalOut)
def add_to_savings_goal(
    id:           int,
    amount:       float,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id      == id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    if goal.is_completed:
        raise HTTPException(status_code=400, detail="Goal already completed")
    goal.saved_amount += amount
    if goal.saved_amount >= goal.target_amount:
        goal.is_completed = True
        goal.saved_amount = goal.target_amount
    db.commit()
    db.refresh(goal)
    return build_goal_response(goal)


@router.delete("/{id}")
def delete_savings_goal(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id      == id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Savings goal deleted"}