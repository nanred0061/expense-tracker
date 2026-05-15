from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import SignUpRequest, LoginRequest, TokenResponse, UserOut
from auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import date

router = APIRouter(prefix="/auth", tags=["Auth"])


# ─── SIGN UP ──────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered. Please log in."
        )

    # Validate password length
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    # Create user with hashed password
    user = User(
        name          = data.name.strip(),
        email         = data.email.lower().strip(),
        password_hash = hash_password(data.password),
        created_at    = str(date.today())
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Return token immediately — user is logged in
    token = create_access_token(user.id)
    return TokenResponse(
        access_token = token,
        token_type   = "bearer",
        user_id      = user.id,
        name         = user.name
    )


# ─── LOGIN ────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(
        User.email == data.email.lower().strip()
    ).first()

    # Check if user exists and password is correct
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    # Create and return token
    token = create_access_token(user.id)
    return TokenResponse(
        access_token = token,
        token_type   = "bearer",
        user_id      = user.id,
        name         = user.name
    )


# ─── GET CURRENT USER ─────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── LOGOUT ───────────────────────────────────────────
# JWT tokens are stateless — logout just means
# deleting the token on the frontend
# No server action needed
@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}