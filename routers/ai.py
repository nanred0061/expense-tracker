from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Expense, UserProfile, Income, SavingsGoal, BudgetGoal, User
from auth import get_current_user
from datetime import date
import os

router = APIRouter(prefix="/ai", tags=["AI"])


# ─── AI CLIENT ────────────────────────────────────────
# Uses Groq in production, Ollama locally
def call_ai(messages: list) -> str:
    groq_key = os.getenv("GROQ_API_KEY")

    if groq_key:
        # Production — use Groq API (free, fast)
        from groq import Groq
        client = Groq(api_key=groq_key)
        response = client.chat.completions.create(
            model      = "llama3-8b-8192",
            messages   = messages,
            max_tokens = 1024
        )
        return response.choices[0].message.content
    else:
        # Local development — use Ollama
        import ollama
        response = ollama.chat(
            model    = "llama3.2",
            messages = messages
        )
        return response["message"]["content"]


# ─── BUILD CONTEXT ────────────────────────────────────
def build_context(user_id: int, db: Session) -> str:
    today         = date.today()
    current_month = today.strftime("%Y-%m")
    profile       = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    expenses      = db.query(Expense).filter(Expense.user_id == user_id).order_by(Expense.date.desc()).all()
    this_month    = [e for e in expenses if e.date.startswith(current_month)]
    income_list   = db.query(Income).filter(Income.user_id == user_id, Income.month == current_month).all()
    extra_income  = sum(i.amount for i in income_list)
    goals         = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id, SavingsGoal.is_completed == False).all()
    budget_goals  = db.query(BudgetGoal).filter(BudgetGoal.user_id == user_id, BudgetGoal.month == current_month).all()
    salary        = profile.salary if profile and profile.is_earning else 0
    total_budget  = (salary or 0) + extra_income
    this_spent    = sum(e.amount for e in this_month)
    remaining     = total_budget - this_spent
    cat_totals: dict = {}
    for e in this_month:
        cat_totals[e.category] = cat_totals.get(e.category, 0) + e.amount
    recent_str   = "\n".join([f"  - {e.title}: ₹{e.amount} ({e.category}) on {e.date}" for e in expenses[:10]])
    category_str = "\n".join([f"  - {c}: ₹{t}" for c, t in cat_totals.items()])
    goals_str    = "\n".join([f"  - {g.name}: ₹{g.saved_amount} of ₹{g.target_amount}" for g in goals]) if goals else "  No active goals"
    budget_str   = "\n".join([f"  - {g.category}: ₹{g.limit} limit" for g in budget_goals]) if budget_goals else "  No limits set"

    return f"""
You are a helpful personal finance assistant for an Indian user.
Always respond in a friendly, concise way. Use ₹ symbol. Keep responses short and actionable.

USER FINANCIAL DATA:
Today: {today} | Month: {current_month}
Salary: ₹{salary} | Extra income: ₹{extra_income} | Budget: ₹{total_budget}
Spent this month: ₹{this_spent} | Remaining: ₹{remaining}

THIS MONTH BY CATEGORY:
{category_str if category_str else "  No expenses"}

BUDGET LIMITS:
{budget_str}

SAVINGS GOALS:
{goals_str}

RECENT EXPENSES:
{recent_str if recent_str else "  No expenses yet"}

ALL TIME TOTAL: ₹{sum(e.amount for e in expenses)}
"""


# ─── CHAT ─────────────────────────────────────────────
@router.post("/chat")
async def chat(
    message:      dict,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    user_message = message.get("message", "")
    history      = message.get("history", [])
    context      = build_context(current_user.id, db)
    messages     = [{"role": "user", "content": context + f"\n\nQuestion: {user_message}"}]
    if history:
        messages = [{"role": "user", "content": context}] + history + [{"role": "user", "content": user_message}]
    reply = call_ai(messages)
    return {"reply": reply, "role": "assistant"}


# ─── INSIGHTS ─────────────────────────────────────────
@router.get("/insights")
async def get_insights(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    context = build_context(current_user.id, db)
    reply   = call_ai([{
        "role":    "user",
        "content": context + "\n\nProvide exactly 3 short insights:\n1. [emoji] [insight]\n2. [emoji] [insight]\n3. [emoji] [insight]"
    }])
    return {"insights": reply}


# ─── PREDICT ──────────────────────────────────────────
@router.get("/predict")
async def predict_spending(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    context = build_context(current_user.id, db)
    reply   = call_ai([{
        "role":    "user",
        "content": context + "\n\nPredict next month spending by category with one warning and one tip."
    }])
    return {"prediction": reply}


# ─── TIP ──────────────────────────────────────────────
@router.get("/tip")
async def get_weekly_tip(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    context = build_context(current_user.id, db)
    reply   = call_ai([{
        "role":    "user",
        "content": context + "\n\nGive ONE specific money saving tip in 2-3 sentences with an emoji."
    }])
    return {"tip": reply}