from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Income, User
from schemas import IncomeCreate, IncomeOut
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/income", tags=["Income"])


@router.post("", response_model=IncomeOut)
def add_income(
    data:         IncomeCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    income = Income(
        user_id = current_user.id,
        amount  = data.amount,
        source  = data.source,
        type    = data.type,
        month   = data.month,
        date    = data.date,
        notes   = data.notes
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("/{month}", response_model=List[IncomeOut])
def get_income_by_month(
    month:        str,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(Income)\
             .filter(Income.user_id == current_user.id)\
             .filter(Income.month == month)\
             .all()


@router.get("", response_model=List[IncomeOut])
def get_all_income(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(Income)\
             .filter(Income.user_id == current_user.id)\
             .order_by(Income.id.desc())\
             .all()


@router.delete("/{id}")
def delete_income(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    income = db.query(Income).filter(
        Income.id      == id,
        Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(income)
    db.commit()
    return {"message": "Income deleted"}