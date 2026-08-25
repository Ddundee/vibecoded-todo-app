from enum import Enum


class TaskStatus(str, Enum):
    inbox = "inbox"
    todo = "todo"
    in_progress = "in_progress"
    blocked = "blocked"
    completed = "completed"
    cancelled = "cancelled"


class TaskPriority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


# Seed categories. The `category` field on Task is a free-form string so new
# categories can be added later without a migration, but the app ships with
# these and the frontend/MCP tools treat them specially where useful.
class TaskCategory(str, Enum):
    internship = "internship"
    oa = "OA"
    interview = "interview"
    leetcode = "LeetCode"
    school = "school"
    project = "project"
    personal = "personal"
    errands = "errands"


class RecurrencePattern(str, Enum):
    daily = "daily"
    weekdays = "weekdays"
    weekly = "weekly"
    specific_days = "specific_days"
    monthly = "monthly"
    custom_interval = "custom_interval"


class ApplicationStatus(str, Enum):
    discovered = "discovered"
    planning_to_apply = "planning_to_apply"
    applied = "applied"
    oa = "OA"
    interview = "interview"
    final_round = "final_round"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"


class OAUrgency(str, Enum):
    expired = "expired"
    critical = "critical"  # due within 24 hours
    high = "high"  # due within 3 days
    upcoming = "upcoming"  # due within 7 days
    normal = "normal"
