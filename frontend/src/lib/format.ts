import type { OAUrgency, TaskPriority, TaskStatus } from "./types";

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeDueLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const today = todayIso();
  if (iso === today) return "Today";
  if (iso === addDaysIso(today, 1)) return "Tomorrow";
  if (iso === addDaysIso(today, -1)) return "Yesterday";
  return formatDate(iso);
}

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export const STATUS_STYLES: Record<TaskStatus, string> = {
  inbox: "bg-purple-100 text-purple-800 border-purple-200",
  todo: "bg-neutral-100 text-neutral-700 border-neutral-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  blocked: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-neutral-100 text-neutral-400 border-neutral-200 line-through",
};

export const URGENCY_STYLES: Record<OAUrgency, string> = {
  expired: "bg-neutral-200 text-neutral-500 border-neutral-300",
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  upcoming: "bg-yellow-100 text-yellow-800 border-yellow-200",
  normal: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export function categoryColor(category: string): string {
  const palette: Record<string, string> = {
    internship: "bg-indigo-100 text-indigo-800",
    OA: "bg-pink-100 text-pink-800",
    interview: "bg-teal-100 text-teal-800",
    LeetCode: "bg-amber-100 text-amber-800",
    school: "bg-cyan-100 text-cyan-800",
    project: "bg-violet-100 text-violet-800",
    personal: "bg-neutral-100 text-neutral-700",
    errands: "bg-lime-100 text-lime-800",
  };
  return palette[category] || "bg-neutral-100 text-neutral-700";
}
