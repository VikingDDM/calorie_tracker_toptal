from fastapi import Header, HTTPException, Query, Request, status
from prisma.models import User

from app.db.client import db


async def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None),
    token: str | None = Query(default=None),
) -> User:
    request_user = getattr(request.state, "user", None)
    if request_user:
        return request_user

    raw_token = token
    if authorization:
        parts = authorization.split()
        raw_token = parts[-1] if parts else ""

    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header.")

    user = await db.user.find_unique(where={"token": raw_token})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    return user


def require_admin(user: User) -> None:
    if user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
