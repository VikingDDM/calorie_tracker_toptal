import asyncio

from app.db.client import db
from app.db.seed import seed


async def main() -> None:
    await db.connect()
    try:
        await seed()
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
