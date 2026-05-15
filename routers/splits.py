from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Split, Expense, User
from schemas import SplitCreate, SplitSettle, SplitOut
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/splits", tags=["Splits"])


@router.post("/{expense_id}", response_model=List[SplitOut])
def add_splits(
    expense_id:   int,
    splits:       List[SplitCreate],
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id      == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.query(Split).filter(Split.expense_id == expense_id).delete()
    db.commit()

    created = []
    for s in splits:
        split = Split(
            user_id     = current_user.id,
            expense_id  = expense_id,
            friend_name = s.friend_name,
            amount_owed = s.amount_owed,
            is_settled  = False
        )
        db.add(split)
        created.append(split)

    db.commit()
    for s in created:
        db.refresh(s)
    return created


@router.get("/{expense_id}", response_model=List[SplitOut])
def get_splits(
    expense_id:   int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(Split).filter(
        Split.expense_id == expense_id,
        Split.user_id    == current_user.id
    ).all()


@router.get("", response_model=List[SplitOut])
def get_all_pending(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    return db.query(Split).filter(
        Split.user_id    == current_user.id,
        Split.is_settled == False
    ).all()


@router.put("/{split_id}/settle", response_model=SplitOut)
def settle_split(
    split_id:     int,
    data:         SplitSettle,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    split = db.query(Split).filter(
        Split.id      == split_id,
        Split.user_id == current_user.id
    ).first()
    if not split:
        raise HTTPException(status_code=404, detail="Split not found")
    if split.is_settled:
        raise HTTPException(status_code=400, detail="Already settled")
    split.is_settled   = True
    split.settled_date = data.settled_date
    db.commit()
    db.refresh(split)
    return split


@router.get("/summary/pending")
def get_pending_summary(
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    pending = db.query(Split).filter(
        Split.user_id    == current_user.id,
        Split.is_settled == False
    ).all()
    total     = sum(s.amount_owed for s in pending)
    by_friend: dict = {}
    for s in pending:
        by_friend[s.friend_name] = by_friend.get(s.friend_name, 0) + s.amount_owed
    return {
        "total_pending": total,
        "pending_count": len(pending),
        "by_friend":     by_friend
    }


@router.delete("/{expense_id}")
def delete_splits(
    expense_id:   int,
    current_user: User    = Depends(get_current_user),
    db:           Session = Depends(get_db)
):
    db.query(Split).filter(
        Split.expense_id == expense_id,
        Split.user_id    == current_user.id
    ).delete()
    db.commit()
    return {"message": "Splits deleted"}