from datetime import datetime, timedelta

from fastapi import HTTPException, status
from prisma.models import FoodEntry, Meal, User

from app.db.client import db


def _day_bounds(timestamp: datetime) -> tuple[datetime, datetime]:
    start = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


async def get_meal_for_user(meal_id: int, user_id: int) -> Meal:
    meal = await db.meal.find_first(where={"id": meal_id, "userId": user_id})
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found for user.")
    return meal


async def validate_meal_entry_limit(
    *,
    user_id: int,
    meal: Meal,
    taken_at: datetime,
    entry_id_to_exclude: int | None = None,
) -> None:
    start, end = _day_bounds(taken_at)
    where = {
        "userId": user_id,
        "mealId": meal.id,
        "takenAt": {"gte": start, "lt": end},
    }
    if entry_id_to_exclude is not None:
        where["NOT"] = {"id": entry_id_to_exclude}

    count = await db.foodentry.count(where=where)
    if count >= meal.entryLimit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Meal entry limit reached for {meal.name.lower()} on this day.",
        )


async def ensure_entry_access(entry_id: int, actor: User) -> FoodEntry:
    entry = await db.foodentry.find_unique(where={"id": entry_id}, include={"meal": True, "user": True})
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food entry not found.")

    if actor.role != "ADMIN" and entry.userId != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this entry.")

    return entry
