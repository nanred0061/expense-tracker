from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import RecurringExpense, Expense, User
from schemas import RecurringExpenseCreate, RecurringExpenseOut
from auth import get_current_user
from typing import List
from datetime import date

router = APIRouter(prefix="/recurring", tags=["Recurring"])


@router.post("", response_model=RecurringExpenseOut)
def create_recurring(
    data:         RecurringExpenseCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    r = RecurringExpense(
        user_id      = current_user.id,
        title        = data.title,
        amount       = data.amount,
        category     = data.category,
        day_of_month = data.day_of_month,
        notes        = data.notes
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.get("", response_model=List[RecurringExpenseOut])
def get_recurring(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(RecurringExpense).filter(
        RecurringExpense.user_id   == current_user.id,
        RecurringExpense.is_active == True
    ).all()


@router.delete("/{id}")
def delete_recurring(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    r = db.query(RecurringExpense).filter(
        RecurringExpense.id      == id,
        RecurringExpense.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    r.is_active = False
    db.commit()
    return {"message": "Deleted"}


@router.post("/process")
def process_recurring(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    today         = date.today()
    current_month = today.strftime("%Y-%m")
    added         = []
    recurring_list = db.query(RecurringExpense).filter(
        RecurringExpense.user_id   == current_user.id,
        RecurringExpense.is_active == True
    ).all()
    for r in recurring_list:
        if today.day != r.day_of_month:
            continue
        already = db.query(Expense).filter(
            Expense.user_id == current_user.id,
            Expense.title   == r.title,
            Expense.amount  == r.amount,
            Expense.date.startswith(current_month)
        ).first()
        if already:
            continue
        expense = Expense(
            user_id  = current_user.id,
            title    = r.title,
            amount   = r.amount,
            category = r.category,
            date     = str(today),
            notes    = r.notes or "Auto added - recurring expense"
        )
        db.add(expense)
        added.append(r.title)
    db.commit()
    return {"processed": len(added), "added": added}