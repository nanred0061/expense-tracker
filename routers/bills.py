from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Bill, BillPayment, Expense, User
from schemas import BillCreate, BillUpdate, BillOut, BillPaymentCreate, BillPaymentOut
from auth import get_current_user
from typing import List
from datetime import date
import calendar

router = APIRouter(prefix="/bills", tags=["Bills"])


def days_until_due(due_day: int) -> int:
    today     = date.today()
    last_day  = calendar.monthrange(today.year, today.month)[1]
    actual    = min(due_day, last_day)
    due_date  = today.replace(day=actual)
    if due_date < today:
        if today.month == 12:
            due_date = due_date.replace(year=today.year + 1, month=1)
        else:
            due_date = due_date.replace(month=today.month + 1)
    return (due_date - today).days


def build_bill_response(bill: Bill, user_id: int, db: Session) -> BillOut:
    current_month = date.today().strftime("%Y-%m")
    payment = db.query(BillPayment).filter(
        BillPayment.bill_id == bill.id,
        BillPayment.user_id == user_id,
        BillPayment.month   == current_month
    ).first()
    is_paid     = payment.is_paid if payment else False
    amount_paid = payment.amount_paid if payment else None
    days_left   = days_until_due(bill.due_day)
    is_overdue  = days_left < 0 and not is_paid
    return BillOut(
        id             = bill.id,
        name           = bill.name,
        type           = bill.type,
        amount         = bill.amount,
        due_day        = bill.due_day,
        is_recurring   = bill.is_recurring,
        is_active      = bill.is_active,
        notes          = bill.notes,
        is_paid        = is_paid,
        amount_paid    = amount_paid,
        days_until_due = days_left,
        is_overdue     = is_overdue
    )


@router.post("", response_model=BillOut)
def create_bill(
    data:         BillCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    bill = Bill(
        user_id      = current_user.id,
        name         = data.name,
        type         = data.type,
        amount       = data.amount,
        due_day      = data.due_day,
        is_recurring = data.is_recurring,
        notes        = data.notes
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return build_bill_response(bill, current_user.id, db)


@router.get("", response_model=List[BillOut])
def get_bills(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    bills  = db.query(Bill).filter(
        Bill.user_id   == current_user.id,
        Bill.is_active == True
    ).all()
    result = [build_bill_response(b, current_user.id, db) for b in bills]
    result.sort(key=lambda x: x.days_until_due)
    return result


@router.get("/alerts/active")
def get_alerts(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    bills  = db.query(Bill).filter(
        Bill.user_id   == current_user.id,
        Bill.is_active == True
    ).all()
    alerts = []
    for bill in bills:
        b = build_bill_response(bill, current_user.id, db)
        if b.is_paid:
            continue
        days = b.days_until_due
        if b.is_overdue:
            alerts.append({"bill_id": bill.id, "name": bill.name, "amount": bill.amount, "type": "overdue", "days": abs(days), "message": f"⚠️ {bill.name} is overdue by {abs(days)} days!", "color": "red"})
        elif days == 0:
            alerts.append({"bill_id": bill.id, "name": bill.name, "amount": bill.amount, "type": "due_today", "days": 0, "message": f"🔴 {bill.name} is due TODAY!", "color": "red"})
        elif days <= 3:
            alerts.append({"bill_id": bill.id, "name": bill.name, "amount": bill.amount, "type": "due_soon", "days": days, "message": f"🟠 {bill.name} due in {days} days", "color": "orange"})
        elif days <= 7:
            alerts.append({"bill_id": bill.id, "name": bill.name, "amount": bill.amount, "type": "due_week", "days": days, "message": f"🟡 {bill.name} due in {days} days", "color": "yellow"})
    alerts.sort(key=lambda x: x["days"])
    return alerts


@router.get("/summary/safe-to-spend")
def safe_to_spend(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    from models import Income as IncomeModel, UserProfile
    today         = date.today()
    current_month = today.strftime("%Y-%m")
    profile       = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    salary        = profile.salary if profile and profile.is_earning else 0
    income_list   = db.query(IncomeModel).filter(IncomeModel.user_id == current_user.id, IncomeModel.month == current_month, IncomeModel.type == "one_time").all()
    extra_income  = sum(i.amount for i in income_list)
    total_budget  = (salary or 0) + extra_income
    expenses      = db.query(Expense).filter(Expense.user_id == current_user.id, Expense.date.startswith(current_month)).all()
    total_spent   = sum(e.amount for e in expenses)
    remaining     = total_budget - total_spent
    bills         = db.query(Bill).filter(Bill.user_id == current_user.id, Bill.is_active == True).all()
    upcoming      = []
    upcoming_total = 0
    for bill in bills:
        b = build_bill_response(bill, current_user.id, db)
        if not b.is_paid:
            upcoming.append({"name": bill.name, "amount": bill.amount, "due_day": bill.due_day, "type": bill.type})
            upcoming_total += bill.amount
    safe = remaining - upcoming_total
    return {"budget_remaining": remaining, "upcoming_bills": upcoming_total, "safe_to_spend": safe, "is_safe": safe > 0, "bills_this_month": upcoming}


@router.post("/{id}/pay", response_model=BillPaymentOut)
def pay_bill(
    id:           int,
    data:         BillPaymentCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.id == id, Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    current_month = date.today().strftime("%Y-%m")
    existing = db.query(BillPayment).filter(BillPayment.bill_id == id, BillPayment.user_id == current_user.id, BillPayment.month == current_month).first()
    if existing and existing.is_paid:
        raise HTTPException(status_code=400, detail="Bill already paid this month")
    expense = Expense(
        user_id  = current_user.id,
        title    = f"{bill.name} payment",
        amount   = data.amount_paid,
        category = "other",
        date     = data.paid_date,
        notes    = f"Bill payment - {bill.name}"
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    if existing:
        existing.amount_paid = data.amount_paid
        existing.paid_date   = data.paid_date
        existing.is_paid     = True
        existing.expense_id  = expense.id
        db.commit()
        db.refresh(existing)
        return existing
    payment = BillPayment(
        user_id     = current_user.id,
        bill_id     = id,
        month       = current_month,
        amount_due  = bill.amount,
        amount_paid = data.amount_paid,
        paid_date   = data.paid_date,
        is_paid     = True,
        expense_id  = expense.id
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.put("/{id}", response_model=BillOut)
def update_bill(
    id:           int,
    data:         BillUpdate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.id == id, Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(bill, key, value)
    db.commit()
    db.refresh(bill)
    return build_bill_response(bill, current_user.id, db)


@router.delete("/{id}")
def delete_bill(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    bill = db.query(Bill).filter(Bill.id == id, Bill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill.is_active = False
    db.commit()
    return {"message": "Bill deleted"}


@router.get("/{id}/history", response_model=List[BillPaymentOut])
def get_payment_history(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(BillPayment).filter(
        BillPayment.bill_id == id,
        BillPayment.user_id == current_user.id
    ).order_by(BillPayment.id.desc()).all()