import asyncio
from datetime import datetime, timedelta, timezone

from app.db.client import db


MEAL_DEFINITIONS = [
    {"key": "BREAKFAST", "name": "Breakfast", "entry_limit": 3},
    {"key": "LUNCH", "name": "Lunch", "entry_limit": 5},
    {"key": "DINNER", "name": "Dinner", "entry_limit": 2},
    {"key": "SNACK", "name": "Snack", "entry_limit": 2},
]

SAMPLE_USERS = [
    {
        "name": "Admin User",
        "email": "admin@caltrack.dev",
        "password": "admin123",
        "token": "ADMIN_TOKEN",
        "role": "ADMIN",
        "daily_calorie_limit": 2400,
    },
    {
        "name": "Alice Carter",
        "email": "alice@caltrack.dev",
        "password": "alice123",
        "token": "USER1_TOKEN",
        "role": "USER",
        "daily_calorie_limit": 2100,
    },
    {
        "name": "Bob Lee",
        "email": "bob@caltrack.dev",
        "password": "bob123",
        "token": "USER2_TOKEN",
        "role": "USER",
        "daily_calorie_limit": 1900,
    },
    {
        "name": "Carla Diaz",
        "email": "carla@caltrack.dev",
        "password": "carla123",
        "token": "USER3_TOKEN",
        "role": "USER",
        "daily_calorie_limit": 2200,
    },
]


async def seed() -> None:
    existing_users = await db.user.count()
    if existing_users > 0:
        return

    created_users = []
    for user_data in SAMPLE_USERS:
        user = await db.user.create(
            data={
                "name": user_data["name"],
                "email": user_data["email"],
                "password": user_data["password"],
                "token": user_data["token"],
                "role": user_data["role"],
                "dailyCalorieLimit": user_data["daily_calorie_limit"],
            }
        )
        created_users.append(user)

        for meal in MEAL_DEFINITIONS:
            await db.meal.create(
                data={
                    "key": meal["key"],
                    "name": meal["name"],
                    "entryLimit": meal["entry_limit"],
                    "userId": user.id,
                }
            )

    now = datetime.now(timezone.utc)
    alice = created_users[1]
    bob = created_users[2]
    admin = created_users[0]

    alice_meals = {meal.key: meal for meal in await db.meal.find_many(where={"userId": alice.id})}
    bob_meals = {meal.key: meal for meal in await db.meal.find_many(where={"userId": bob.id})}
    admin_meals = {meal.key: meal for meal in await db.meal.find_many(where={"userId": admin.id})}

    sample_entries = [
        (alice.id, alice_meals["BREAKFAST"].id, "Greek Yogurt", 320, now - timedelta(days=1, hours=4)),
        (alice.id, alice_meals["LUNCH"].id, "Chicken Salad", 540, now - timedelta(days=1, hours=1)),
        (alice.id, alice_meals["DINNER"].id, "Salmon Bowl", 760, now - timedelta(days=1)),
        (bob.id, bob_meals["BREAKFAST"].id, "Oatmeal", 410, now - timedelta(days=2, hours=5)),
        (bob.id, bob_meals["SNACK"].id, "Protein Bar", 220, now - timedelta(days=2, hours=2)),
        (admin.id, admin_meals["LUNCH"].id, "Turkey Sandwich", 600, now - timedelta(hours=3)),
    ]

    for user_id, meal_id, food_name, calories, taken_at in sample_entries:
        await db.foodentry.create(
            data={
                "userId": user_id,
                "mealId": meal_id,
                "foodName": food_name,
                "calories": calories,
                "takenAt": taken_at,
            }
        )

if __name__ == "__main__":
    async def _main():
        await db.connect()
        try:
            await seed()
        finally:
            await db.disconnect()

    asyncio.run(_main())
