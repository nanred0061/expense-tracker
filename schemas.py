from pydantic import BaseModel
from typing import Optional, List

class SignUpRequest(BaseModel):
    name:     str
    email:    str
    password: str

class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    name:         str

class UserOut(BaseModel):
    id:         int
    name:       str
    email:      str
    created_at: str

# ─── EXISTING SCHEMAS ─────────────────────────────────

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    date: str
    notes: Optional[str] = None

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        extra = "ignore"

class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    date: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── USER PROFILE SCHEMAS ─────────────────────────────

# Used when setting up profile for first time
class UserProfileCreate(BaseModel):
    is_earning: bool
    salary: Optional[float] = None
    rollover_preference: str = "split"   # default is split
    split_percentage: int = 50           # default 50/50

# Used when updating settings later
class UserProfileUpdate(BaseModel):
    is_earning: Optional[bool] = None
    salary: Optional[float] = None
    rollover_preference: Optional[str] = None
    split_percentage: Optional[int] = None

# What gets sent back to frontend
class UserProfileOut(BaseModel):
    id: int
    is_earning: bool
    salary: Optional[float] = None
    reset_day: int
    rollover_preference: str
    split_percentage: int

    class Config:
        from_attributes = True


# ─── SALARY HISTORY SCHEMAS ───────────────────────────

# Used when updating salary
class SalaryUpdate(BaseModel):
    new_salary: float
    reason: Optional[str] = None
    effective: str          # "2025-04" which month it starts

# What gets sent back to frontend
class SalaryHistoryOut(BaseModel):
    id: int
    old_salary: float
    new_salary: float
    changed_on: str
    reason: Optional[str] = None
    effective: str

    class Config:
        from_attributes = True


# ─── INCOME SCHEMAS ───────────────────────────────────

# Used when adding one-time income
class IncomeCreate(BaseModel):
    amount: float
    source: str             # "freelance", "bonus", "gift", "refund", "other"
    type: str = "one_time"  # always one_time from frontend
    month: str              # "2025-04"
    date: str               # "2025-04-15"
    notes: Optional[str] = None

# What gets sent back to frontend
class IncomeOut(BaseModel):
    id: int
    amount: float
    source: str
    type: str
    month: str
    date: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ─── BUDGET GOAL SCHEMAS ──────────────────────────────

# Used when creating or updating a budget goal
class BudgetGoalCreate(BaseModel):
    category: str
    limit: float
    month: str              # "2025-04"

# What gets sent back — includes how much spent vs limit
class BudgetGoalOut(BaseModel):
    id: int
    category: str
    limit: float
    month: str
    spent: float = 0        # calculated in API, not stored in DB
    remaining: float = 0    # calculated in API, not stored in DB
    percentage: float = 0   # how much of limit used (0-100)

    class Config:
        from_attributes = True


# ─── SAVINGS GOAL SCHEMAS ─────────────────────────────

# Used when creating a new savings goal
class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    monthly_saving: float
    created_date: str       # "2025-04-18"

# Used when updating a savings goal
class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    monthly_saving: Optional[float] = None
    saved_amount: Optional[float] = None
    is_completed: Optional[bool] = None

# What gets sent back — includes calculated fields
class SavingsGoalOut(BaseModel):
    id: int
    name: str
    target_amount: float
    saved_amount: float
    monthly_saving: float
    created_date: str
    is_completed: bool
    months_remaining: float = 0     # calculated in API
    percentage: float = 0           # how close to goal (0-100)

    class Config:
        from_attributes = True


# ─── SPLIT SCHEMAS ────────────────────────────────────

# One friend's share when splitting a bill
class SplitCreate(BaseModel):
    friend_name: str
    amount_owed: float

# Used when marking a friend as settled
class SplitSettle(BaseModel):
    settled_date: str       # "2025-04-20"

# What gets sent back for one split
class SplitOut(BaseModel):
    id: int
    expense_id: int
    friend_name: str
    amount_owed: float
    is_settled: bool
    settled_date: Optional[str] = None

    class Config:
        from_attributes = True


# ─── BUDGET SUMMARY SCHEMA ────────────────────────────
# Returned by the budget remaining API
# Gives a complete picture of this month's finances

class BudgetSummary(BaseModel):
    month: str
    salary: float
    extra_income: float         # total one-time income this month
    total_budget: float         # salary + extra_income
    total_spent: float          # all expenses this month
    remaining: float            # total_budget - total_spent
    remaining_percentage: float # how much budget is left (0-100)
    is_over_budget: bool        # true if remaining < 0
    warning: bool               # true if remaining < 20% of budget


# ─── ROLLOVER SCHEMA ──────────────────────────────────
# Returned when month rollover happens

class RolloverOut(BaseModel):
    month: str
    leftover: float
    to_savings: float
    carried_forward: float
    processed_on: str
    # ─── BILL SCHEMAS ─────────────────────────────────────

class BillCreate(BaseModel):
    name:         str
    type:         str           # "credit_card", "utility", "subscription", "emi", "other"
    amount:       float
    due_day:      int           # day of month 1-31
    is_recurring: bool = True
    notes:        Optional[str] = None

class BillUpdate(BaseModel):
    name:         Optional[str]   = None
    amount:       Optional[float] = None
    due_day:      Optional[int]   = None
    is_recurring: Optional[bool]  = None
    is_active:    Optional[bool]  = None
    notes:        Optional[str]   = None

class BillOut(BaseModel):
    id:           int
    name:         str
    type:         str
    amount:       float
    due_day:      int
    is_recurring: bool
    is_active:    bool
    notes:        Optional[str] = None
    is_paid:      bool = False      # calculated — paid this month?
    amount_paid:  Optional[float] = None  # how much paid this month
    days_until_due: int = 0         # calculated
    is_overdue:   bool = False      # calculated

    class Config:
        from_attributes = True


# ─── BILL PAYMENT SCHEMAS ─────────────────────────────

class BillPaymentCreate(BaseModel):
    amount_paid:  float
    paid_date:    str

class BillPaymentOut(BaseModel):
    id:           int
    bill_id:      int
    month:        str
    amount_due:   float
    amount_paid:  Optional[float] = None
    paid_date:    Optional[str]   = None
    is_paid:      bool
    expense_id:   Optional[int]   = None

    class Config:
        from_attributes = True


# ─── RECURRING EXPENSE SCHEMAS ────────────────────────

class RecurringExpenseCreate(BaseModel):
    title:        str
    amount:       float
    category:     str
    day_of_month: int
    notes:        Optional[str] = None

class RecurringExpenseOut(BaseModel):
    id:           int
    title:        str
    amount:       float
    category:     str
    day_of_month: int
    is_active:    bool
    notes:        Optional[str] = None

    class Config:
        from_attributes = True


# ─── SAFE TO SPEND SCHEMA ─────────────────────────────

class SafeToSpend(BaseModel):
    budget_remaining:   float
    upcoming_bills:     float
    safe_to_spend:      float
    is_safe:            bool      # true if safe_to_spend > 0
    bills_this_month:   list      # list of upcoming unpaid bills


# ─── ALERT SCHEMA ─────────────────────────────────────

class AlertOut(BaseModel):
    id:           int
    bill_id:      int
    type:         str
    message:      str
    is_dismissed: bool
    created_on:   str

    

    class Config:
        from_attributes = True