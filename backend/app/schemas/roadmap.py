from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.analysis import RoadmapWeek


class TaskProgressItem(BaseModel):
    id: str
    week_number: int
    task_index: int
    task_text: str
    is_completed: bool
    completed_at: Optional[str] = None


class WeeklyProgressBreakdown(BaseModel):
    week_number: int
    title: str
    focus: str
    total_tasks: int
    completed_tasks: int
    percentage: int
    expected_deliverable: str
    tasks: List[TaskProgressItem]


class RoadmapProgressResponse(BaseModel):
    analysis_id: str
    overall_percentage: int
    total_tasks: int
    completed_tasks: int
    weekly_progress: List[WeeklyProgressBreakdown]
    revisions_count: int


class ToggleTaskRequest(BaseModel):
    week_number: int = Field(ge=1, le=4, description="Target week 1-4")
    task_index: int = Field(ge=0, description="Index of the task within that week")
    is_completed: bool = Field(description="New completion state")


class AdaptivePlanRequest(BaseModel):
    analysis_id: str = Field(description="ID of the career analysis report to adapt")


class AdaptivePlanResponse(BaseModel):
    adjusted: bool
    reason_for_change: str
    revision_number: int
    four_week_roadmap: List[RoadmapWeek]


class RoadmapRevisionListItem(BaseModel):
    id: str
    analysis_id: str
    revision_number: int
    reason_for_change: str
    created_at: str
