from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field

RoleCategoryType = Literal["Python", "Backend", "Frontend", "AI/ML", "Full Stack", "Other"]
ApplicationStatusType = Literal["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected"]


class CreateApplicationRequest(BaseModel):
    company_name: str = Field(min_length=1, max_length=255, description="Name of the hiring company")
    job_title: str = Field(min_length=1, max_length=255, description="Target job title")
    role_category: RoleCategoryType = Field(description="Role track / technology category")
    job_description_or_url: Optional[str] = Field(default=None, description="Job posting URL or full text")
    application_date: Optional[str] = Field(default=None, description="ISO date of submission")
    status: ApplicationStatusType = Field(default="Applied", description="Current status in the application pipeline")
    response_date: Optional[str] = Field(default=None, description="Date first response was received")
    notes: Optional[str] = Field(default=None, description="Candidate notes, recruiter contacts, or referral details")


class UpdateApplicationRequest(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    job_title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    role_category: Optional[RoleCategoryType] = None
    job_description_or_url: Optional[str] = None
    application_date: Optional[str] = None
    status: Optional[ApplicationStatusType] = None
    response_date: Optional[str] = None
    notes: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: ApplicationStatusType = Field(description="New status in the application pipeline")
    response_date: Optional[str] = Field(default=None, description="Optional response timestamp")


class JobApplicationResponse(BaseModel):
    id: str
    company_name: str
    job_title: str
    role_category: str
    job_description_or_url: Optional[str]
    application_date: str
    status: str
    response_date: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str


class RoleCategoryAnalytics(BaseModel):
    role_category: str
    total_applications: int
    responses: int
    response_rate: float
    interviews: int
    offers: int


class ApplicationAnalyticsResponse(BaseModel):
    total_applications: int
    response_count: int
    response_rate: float
    interview_conversion_rate: float
    offer_count: int
    status_distribution: Dict[str, int]
    category_analytics: List[RoleCategoryAnalytics]
    has_sufficient_data: bool
    insight_summary: str
