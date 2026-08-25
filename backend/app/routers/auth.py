from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.deps import get_db, require_auth
from app.schemas import LoginRequest
from app.security import SESSION_COOKIE_NAME, create_session_token
from app.services.auth import authenticate_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginRequest, response: Response, session: Session = Depends(get_db)):
    user = authenticate_user(session, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_session_token(user.username)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )
    return {"username": user.username}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"ok": True}


@router.get("/me")
def me(principal: str = Depends(require_auth)):
    return {"principal": principal}
