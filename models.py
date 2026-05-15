from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


# ─── USER ─────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(String)


# ─── EXPENSE ──────────────────────────────────────────
class Expense(Base):
    __tablename__ = "expenses"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    title    = Column(String, nullable=False)
    amount   = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date     = Column(String, nullable=False)
    notes    = Column(String, nullable=True)
    splits   = relationship("Split", back_populates="expense")


# ─── USER PROFILE ─────────────────────────────────────
class UserProfile(Base):
    __tablename__ = "user_profile"

    id                  = Column(Integer, primary_key=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_earning          = Column(Boolean, default=False)
    salary              = Column(Float, nullable=True)
    reset_day           = Column(Integer, default=1)
    rollover_preference = Column(String, default="split")
    split_percentage    = Column(Integer, default=50)


# ─── SALARY HISTORY ───────────────────────────────────
class SalaryHistory(Base):
    __tablename__ = "salary_history"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_salary  = Column(Float)
    new_salary  = Column(Float)
    changed_on  = Column(String)
    reason      = Column(String, nullable=True)
    effective   = Column(String)


# ─── INCOME ───────────────────────────────────────────
class Income(Base):
    __tablename__ = "income"

    id      = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount  = Column(Float)
    source  = Column(String)
    type    = Column(String)
    month   = Column(String)
    date    = Column(String)
    notes   = Column(String, nullable=True)


# ─── BUDGET GOAL ──────────────────────────────────────
class BudgetGoal(Base):
    __tablename__ = "budget_goals"

    id       = Column(Integer, primary_key=True)
    user_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String)
    limit    = Column(Float)
    month    = Column(String)


# ─── SAVINGS GOAL ─────────────────────────────────────
class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    name           = Column(String)
    target_amount  = Column(Float)
    saved_amount   = Column(Float, default=0)
    monthly_saving = Column(Float)
    created_date   = Column(String)
    is_completed   = Column(Boolean, default=False)


# ─── SPLIT ────────────────────────────────────────────
class Split(Base):
    __tablename__ = "splits"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    expense_id   = Column(Integer, ForeignKey("expenses.id"))
    friend_name  = Column(String)
    amount_owed  = Column(Float)
    is_settled   = Column(Boolean, default=False)
    settled_date = Column(String, nullable=True)
    expense      = relationship("Expense", back_populates="splits")


# ─── MONTH ROLLOVER ───────────────────────────────────
class MonthRollover(Base):
    __tablename__ = "month_rollovers"

    id              = Column(Integer, primary_key=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    month           = Column(String)
    leftover        = Column(Float)
    to_savings      = Column(Float)
    carried_forward = Column(Float)
    processed_on    = Column(String)


# ─── BILL ─────────────────────────────────────────────
class Bill(Base):
    __tablename__ = "bills"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    name         = Column(String)
    type         = Column(String)
    amount       = Column(Float)
    due_day      = Column(Integer)
    is_recurring = Column(Boolean, default=True)
    is_active    = Column(Boolean, default=True)
    notes        = Column(String, nullable=True)
    payments     = relationship("BillPayment", back_populates="bill")


# ─── BILL PAYMENT ─────────────────────────────────────
class BillPayment(Base):
    __tablename__ = "bill_payments"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    bill_id     = Column(Integer, ForeignKey("bills.id"))
    month       = Column(String)
    amount_due  = Column(Float)
    amount_paid = Column(Float, nullable=True)
    paid_date   = Column(String, nullable=True)
    is_paid     = Column(Boolean, default=False)
    expense_id  = Column(Integer, nullable=True)
    bill        = relationship("Bill", back_populates="payments")


# ─── RECURRING EXPENSE ────────────────────────────────
class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    title        = Column(String)
    amount       = Column(Float)
    category     = Column(String)
    day_of_month = Column(Integer)
    is_active    = Column(Boolean, default=True)
    notes        = Column(String, nullable=True)


# ─── ALERT ────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    bill_id      = Column(Integer, ForeignKey("bills.id"))
    type         = Column(String)
    message      = Column(String)
    is_dismissed = Column(Boolean, default=False)
    created_on   = Column(String)