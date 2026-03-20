from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings
from app.db.client import db
from app.db.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    await seed()
    yield
    await db.disconnect()


app = FastAPI(title="Calorie Tracker API", version="1.0.0", lifespan=lifespan)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_context(request: Request, call_next):
    authorization = request.headers.get("authorization")
    token = request.query_params.get("token")
    raw_token = token
    if authorization:
        parts = authorization.split()
        raw_token = parts[-1] if parts else None

    request.state.user = None
    if raw_token:
        user = await db.user.find_unique(where={"token": raw_token})
        if user:
            request.state.user = user

    return await call_next(request)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    start = perf_counter()
    response = await call_next(request)
    duration_ms = round((perf_counter() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


app.include_router(router)
