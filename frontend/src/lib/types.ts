export type TaskStatus =
  | "inbox"
  | "todo"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type RecurrencePattern =
  | "daily"
  | "weekdays"
  | "weekly"
  | "specific_days"
  | "monthly"
  | "custom_interval";

export const SEED_CATEGORIES = ["LeetCode", "school", "project", "personal", "errands"] as const;

export function isTaskDone(task: { status: TaskStatus }): boolean {
  return task.status === "completed" || task.status === "cancelled";
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
