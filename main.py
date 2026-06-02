from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, get_db, Base
from models import Expense, User
from schemas import ExpenseCreate, ExpenseUpdate, ExpenseOut
from auth import get_current_user
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://expense-tracker-lilac-theta-70.vercel.app",
        "https://expense-tracker-61jv.onrender.com",
        "https://expense-tracker-git-main-nandini-s-projects2.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Import routers
from routers.auth      import router as auth_router
from routers.profile   import router as profile_router
from routers.income    import router as income_router
from routers.budget    import router as budget_router
from routers.rollover  import router as rollover_router
from routers.savings   import router as savings_router
from routers.splits    import router as splits_router
from routers.ai        import router as ai_router
from routers.bills     import router as bills_router
from routers.recurring import router as recurring_router

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(income_router)
app.include_router(budget_router)
app.include_router(rollover_router)
app.include_router(savings_router)
app.include_router(splits_router)
app.include_router(ai_router)
app.include_router(bills_router)
app.include_router(recurring_router)


# ─── EXPENSE ROUTES ───────────────────────────────────
@app.post("/expenses", response_model=ExpenseOut)
def create_expense(
    expense:      ExpenseCreate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    db_expense = Expense(
        user_id  = current_user.id,
        **expense.dict()
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.get("/expenses", response_model=List[ExpenseOut])
def get_expenses(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).all()


@app.get("/expenses/{id}", response_model=ExpenseOut)
def get_expense(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id      == id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@app.put("/expenses/{id}", response_model=ExpenseOut)
def update_expense(
    id:           int,
    updates:      ExpenseUpdate,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id      == id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/expenses/{id}")
def delete_expense(
    id:           int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id      == id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


@app.get("/health")
def health_check():
    return {"status": "ok"}