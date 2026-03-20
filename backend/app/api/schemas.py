from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignInRequest(BaseModel):
    token: str = Field(min_length=3, max_length=128)


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    dailyCalorieLimit: int
    token: str


class UserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    dailyCalorieLimit: int


class SignInTokenItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    email: EmailStr
    role: str
    token: str


class AuthResponse(BaseModel):
    user: UserSummary


class MealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    name: str
    entryLimit: int
    userId: int


class MealRenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class FoodEntryBase(BaseModel):
    takenAt: datetime
    foodName: str = Field(min_length=1, max_length=120)
    calories: int = Field(gt=0, le=10000)
    mealId: int

    @field_validator("foodName")
    @classmethod
    def normalize_food_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Food name is required.")
        return stripped


class FoodEntryCreate(FoodEntryBase):
    userId: int | None = None


class FoodEntryUpdate(FoodEntryBase):
    userId: int | None = None


class FoodEntryResponse(BaseModel):
    id: int
    takenAt: datetime
    foodName: str
    calories: int
    createdAt: datetime
    updatedAt: datetime
    userId: int
    mealId: int
    mealName: str
    mealKey: str
    userName: str
    userEmail: EmailStr


class InviteFriendRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr


class InviteFriendResponse(BaseModel):
    generatedPassword: str
    generatedToken: str
    user: UserSummary


class EntriesComparisonResponse(BaseModel):
    currentPeriodCount: int
    previousPeriodCount: int
    currentPeriodStart: datetime
    previousPeriodStart: datetime


class AverageCaloriesItem(BaseModel):
    userId: int
    userName: str
    averageCalories: float


class EventMessage(BaseModel):
    type: str
    payload: dict
    timestamp: datetime
