export type TaskStatus =
  | "inbox"
  | "todo"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type OAUrgency = "expired" | "critical" | "high" | "upcoming" | "normal";

export type ApplicationStatus =
  | "discovered"
  | "planning_to_apply"
  | "applied"
  | "OA"
  | "interview"
  | "final_round"
  | "offer"
  | "rejected"
  | "withdrawn";

export type RecurrencePattern =
  | "daily"
  | "weekdays"
  | "weekly"
  | "specific_days"
  | "monthly"
  | "custom_interval";

export const SEED_CATEGORIES = [
  "internship",
  "OA",
  "interview",
  "LeetCode",
  "school",
  "project",
  "personal",
  "errands",
] as const;

export interface RecruitingDetail {
  id: string;
  task_id: string;
  company: string | null;
  position: string | null;
  application_url: string | null;
  application_status: ApplicationStatus;
  applied_date: string | null;
  recruiter: string | null;
  oa_received_date: string | null;
  oa_deadline: string | null;
  interview_date: string | null;
  interview_stage: string | null;
  prep_notes: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  estimated_duration: number | null;
  source: string;
  external_reference: string | null;
  notes: string | null;
  planned_for_date: string | null;
  recurrence_rule_id: string | null;
  occurrence_date: string | null;

  is_overdue: boolean;
  priority_score: number;
  priority_reasons: string[];
  oa_urgency: OAUrgency | null;
  oa_days_remaining: number | null;
  recruiting: RecruitingDetail | null;
}

export interface TaskListResponse {
  tasks: Task[];
  count: number;
}

export interface TodayView {
  date: string;
  scheduled: Task[];
  due_today: Task[];
  overdue: Task[];
  recurring_today: Task[];
  suggested_high_priority: Task[];
}

export interface OADeadlineItem {
  task: Task;
  company: string | null;
  oa_name: string;
  received_date: string | null;
  deadline: string | null;
  days_remaining: number | null;
  urgency: OAUrgency;
  completed: boolean;
}

export interface RecruitingPipelineStage {
  status: ApplicationStatus;
  count: number;
  tasks: Task[];
}

export interface WeekSummary {
  start_date: string;
  end_date: string;
  completed_count: number;
  completed_by_category: Record<string, number>;
  created_count: number;
  overdue_count: number;
  completed_tasks: Task[];
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  tags?: string[];
  due_date?: string | null;
  due_time?: string | null;
  estimated_duration?: number | null;
  notes?: string | null;
  planned_for_date?: string | null;
}

export type TaskUpdatePayload = Partial<TaskCreatePayload>;
