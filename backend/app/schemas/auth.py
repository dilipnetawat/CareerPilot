from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr = Field(description="Unique email address for user account")
    password: str = Field(min_length=8, max_length=128, description="User password (min 8 characters)")
    full_name: str = Field(min_length=1, max_length=255, description="Full candidate name")


class LoginRequest(BaseModel):
    email: EmailStr = Field(description="Account email address")
    password: str = Field(description="Account password")


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
