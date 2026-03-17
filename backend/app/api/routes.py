import asyncio
import secrets
import string
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sse_starlette import EventSourceResponse

from app.api.schemas import (
    AuthResponse,
    AverageCaloriesItem,
    EntriesComparisonResponse,
    FoodEntryCreate,
    FoodEntryResponse,
    FoodEntryUpdate,
    InviteFriendRequest,
    InviteFriendResponse,
    MealRenameRequest,
    MealResponse,
    SignInRequest,
    UserListItem,
    UserSummary,
)
from app.core.events import event_bus
from app.db.client import db
from app.services.auth import get_current_user, require_admin
from app.services.entries import ensure_entry_access, get_meal_for_user, validate_meal_entry_limit

router = APIRouter(prefix="/api")


def _serialize_entry(entry) -> FoodEntryResponse:
    return FoodEntryResponse(
        id=entry.id,
        takenAt=entry.takenAt,
        foodName=entry.foodName,
        calories=entry.calories,
        createdAt=entry.createdAt,
        updatedAt=entry.updatedAt,
        userId=entry.user.id,
        mealId=entry.meal.id,
        mealName=entry.meal.name,
        mealKey=entry.meal.key,
        userName=entry.user.name,
        userEmail=entry.user.email,
    )


def _generate_secret(length: int = 12) -> str:
    alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/signin", response_model=AuthResponse)
async def sign_in(payload: SignInRequest) -> AuthResponse:
    user = await db.user.find_unique(where={"token": payload.token})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    event_bus.publish("auth.signin", {"userId": user.id, "email": user.email})
    return AuthResponse(user=UserSummary.model_validate(user))


@router.post("/auth/signout")
async def sign_out(current_user=Depends(get_current_user)) -> dict[str, str]:
    event_bus.publish("auth.signout", {"userId": current_user.id, "email": current_user.email})
    return {"message": "Signed out."}


@router.get("/me", response_model=UserSummary)
async def get_me(current_user=Depends(get_current_user)) -> UserSummary:
    return UserSummary.model_validate(current_user)


@router.get("/users", response_model=list[UserListItem])
async def list_users(current_user=Depends(get_current_user)) -> list[UserListItem]:
    require_admin(current_user)
    users = await db.user.find_many(order={"name": "asc"})
    return [UserListItem.model_validate(user) for user in users]


@router.get("/meals", response_model=list[MealResponse])
async def get_meals(
    current_user=Depends(get_current_user),
    user_id: int | None = Query(default=None),
) -> list[MealResponse]:
    target_user_id = current_user.id
    if user_id is not None:
        require_admin(current_user)
        target_user_id = user_id

    meals = await db.meal.find_many(where={"userId": target_user_id}, order={"id": "asc"})
    return [MealResponse.model_validate(meal) for meal in meals]


@router.put("/meals/{meal_id}", response_model=MealResponse)
async def rename_meal(
    meal_id: int,
    payload: MealRenameRequest,
    current_user=Depends(get_current_user),
) -> MealResponse:
    meal = await db.meal.find_first(where={"id": meal_id, "userId": current_user.id})
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found.")

    updated = await db.meal.update(where={"id": meal_id}, data={"name": payload.name.strip()})
    event_bus.publish("meal.renamed", {"userId": current_user.id, "mealId": meal_id, "name": updated.name})
    return MealResponse.model_validate(updated)


@router.get("/entries", response_model=list[FoodEntryResponse])
async def list_entries(
    current_user=Depends(get_current_user),
    user_id: int | None = Query(default=None),
) -> list[FoodEntryResponse]:
    where = {"userId": current_user.id}
    if user_id is not None:
        require_admin(current_user)
        where = {"userId": user_id}
    elif current_user.role == "ADMIN":
        where = {}

    entries = await db.foodentry.find_many(
        where=where,
        include={"meal": True, "user": True},
        order=[{"takenAt": "desc"}, {"id": "desc"}],
    )
    return [_serialize_entry(entry) for entry in entries]


@router.post("/entries", response_model=FoodEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    payload: FoodEntryCreate,
    current_user=Depends(get_current_user),
) -> FoodEntryResponse:
    target_user_id = current_user.id
    if payload.userId is not None:
        require_admin(current_user)
        target_user_id = payload.userId

    meal = await get_meal_for_user(payload.mealId, target_user_id)
    await validate_meal_entry_limit(user_id=target_user_id, meal=meal, taken_at=payload.takenAt)

    entry = await db.foodentry.create(
        data={
            "takenAt": payload.takenAt,
            "foodName": payload.foodName.strip(),
            "calories": payload.calories,
            "userId": target_user_id,
            "mealId": meal.id,
        },
        include={"meal": True, "user": True},
    )
    event_bus.publish("entry.created", {"entryId": entry.id, "userId": target_user_id, "calories": entry.calories})
    return _serialize_entry(entry)


@router.put("/entries/{entry_id}", response_model=FoodEntryResponse)
async def update_entry(
    entry_id: int,
    payload: FoodEntryUpdate,
    current_user=Depends(get_current_user),
) -> FoodEntryResponse:
    require_admin(current_user)
    existing = await ensure_entry_access(entry_id, current_user)
    target_user_id = payload.userId if payload.userId is not None else existing.userId
    meal = await get_meal_for_user(payload.mealId, target_user_id)
    await validate_meal_entry_limit(
        user_id=target_user_id,
        meal=meal,
        taken_at=payload.takenAt,
        entry_id_to_exclude=entry_id,
    )

    entry = await db.foodentry.update(
        where={"id": entry_id},
        data={
            "takenAt": payload.takenAt,
            "foodName": payload.foodName.strip(),
            "calories": payload.calories,
            "userId": target_user_id,
            "mealId": meal.id,
        },
        include={"meal": True, "user": True},
    )
    event_bus.publish("entry.updated", {"entryId": entry.id, "userId": target_user_id})
    return _serialize_entry(entry)


@router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: int, current_user=Depends(get_current_user)) -> dict[str, str]:
    require_admin(current_user)
    entry = await ensure_entry_access(entry_id, current_user)
    await db.foodentry.delete(where={"id": entry_id})
    event_bus.publish("entry.deleted", {"entryId": entry_id, "userId": entry.userId})
    return {"message": "Entry deleted."}


@router.post("/users/invite", response_model=InviteFriendResponse, status_code=status.HTTP_201_CREATED)
async def invite_friend(
    payload: InviteFriendRequest,
    current_user=Depends(get_current_user),
) -> InviteFriendResponse:
    existing = await db.user.find_unique(where={"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use.")

    password = _generate_secret(10)
    token = f"USER_{_generate_secret(16)}"

    user = await db.user.create(
        data={
            "name": payload.name.strip(),
            "email": payload.email,
            "password": password,
            "token": token,
            "role": "USER",
            "dailyCalorieLimit": 2100,
            "invitedById": current_user.id,
        }
    )

    meal_rows = await db.meal.find_many(where={"userId": current_user.id}, order={"id": "asc"})
    for meal in meal_rows:
        await db.meal.create(
            data={
                "key": meal.key,
                "name": meal.name,
                "entryLimit": meal.entryLimit,
                "userId": user.id,
            }
        )

    event_bus.publish("user.invited", {"inviterId": current_user.id, "userId": user.id, "email": user.email})
    return InviteFriendResponse(
        generatedPassword=password,
        generatedToken=token,
        user=UserSummary.model_validate(user),
    )


@router.get("/reports/entries-comparison", response_model=EntriesComparisonResponse)
async def entries_comparison(current_user=Depends(get_current_user)) -> EntriesComparisonResponse:
    require_admin(current_user)
    now = datetime.now(timezone.utc)
    current_start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    previous_start = current_start - timedelta(days=7)

    current_count = await db.foodentry.count(where={"takenAt": {"gte": current_start, "lte": now}})
    previous_count = await db.foodentry.count(where={"takenAt": {"gte": previous_start, "lt": current_start}})

    return EntriesComparisonResponse(
        currentPeriodCount=current_count,
        previousPeriodCount=previous_count,
        currentPeriodStart=current_start,
        previousPeriodStart=previous_start,
    )


@router.get("/reports/average-calories", response_model=list[AverageCaloriesItem])
async def average_calories(current_user=Depends(get_current_user)) -> list[AverageCaloriesItem]:
    require_admin(current_user)
    start = (datetime.now(timezone.utc) - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    entries = await db.foodentry.find_many(where={"takenAt": {"gte": start}}, include={"user": True})

    grouped: dict[int, list[int]] = defaultdict(list)
    users: dict[int, str] = {}
    for entry in entries:
        grouped[entry.userId].append(entry.calories)
        users[entry.userId] = entry.user.name

    result = [
        AverageCaloriesItem(
            userId=user_id,
            userName=users[user_id],
            averageCalories=round(sum(calories) / len(calories), 2),
        )
        for user_id, calories in grouped.items()
    ]
    return sorted(result, key=lambda item: item.userName.lower())


@router.get("/observability/stream")
async def observability_stream(request: Request, current_user=Depends(get_current_user)) -> EventSourceResponse:
    require_admin(current_user)
    queue = event_bus.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=15)
                    yield {"event": "message", "data": message}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": "{}"}
        finally:
            event_bus.unsubscribe(queue)

    return EventSourceResponse(event_generator())
