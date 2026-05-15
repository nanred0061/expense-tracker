from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User

# ── Security settings ──────────────────────────────────
# SECRET_KEY is used to sign JWT tokens
# In production this should be a long random string
# stored in .env file
import os
SECRET_KEY = os.getenv("SECRET_KEY", "expense_tracker_secret_key_change_in_production")
ALGORITHM       = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7   # token valid for 7 days

# ── Password hashing ───────────────────────────────────
# bcrypt automatically salts and hashes passwords
# never stores plain text
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 scheme ──────────────────────────────────────
# Tells FastAPI where to look for the token
# Frontend sends token in Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Hash a password ────────────────────────────────────
def hash_password(password: str) -> str:
    # bcrypt has a 72 byte limit — truncate to be safe
    return pwd_context.hash(password[:72])


# ── Verify a password ──────────────────────────────────
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)


# ── Create JWT token ───────────────────────────────────
def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub":  str(user_id),   # subject = user id
        "exp":  expire           # expiry time
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Get current user from token ────────────────────────
# This is used as a dependency in all protected routes
# FastAPI automatically extracts and validates the token
def get_current_user(
    token: str           = Depends(oauth2_scheme),
    db:    Session       = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail      = "Invalid or expired token. Please log in again.",
        headers     = {"WWW-Authenticate": "Bearer"}
    )

    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user