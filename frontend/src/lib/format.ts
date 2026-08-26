import type { TaskPriority, TaskStatus } from "./types";

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

// Soft, low-opacity tinted badges: one token per color reads correctly on
// both light and dark surfaces without needing separate light/dark
// background colors, which keeps the palette small and consistent.
//
// Classes are spelled out in full below (not built from a `${color}`
// template) because Tailwind statically scans source text for complete
// utility names — an interpolated class name never matches anything and
// silently produces no CSS.
const NEUTRAL_TINT =
  "bg-neutral-500/10 text-neutral-600 ring-1 ring-inset ring-neutral-500/20 dark:text-neutral-400";
const RED_TINT =
  "bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-400";
const ORANGE_TINT =
  "bg-orange-500/10 text-orange-700 ring-1 ring-inset ring-orange-500/20 dark:text-orange-400";
const BLUE_TINT =
  "bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400";
const PURPLE_TINT =
  "bg-purple-500/10 text-purple-700 ring-1 ring-inset ring-purple-500/20 dark:text-purple-400";
const YELLOW_TINT =
  "bg-yellow-500/10 text-yellow-700 ring-1 ring-inset ring-yellow-500/20 dark:text-yellow-400";
const GREEN_TINT =
  "bg-green-500/10 text-green-700 ring-1 ring-inset ring-green-500/20 dark:text-green-400";

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  critical: RED_TINT,
  high: ORANGE_TINT,
  medium: BLUE_TINT,
  low: NEUTRAL_TINT,
};

export const STATUS_STYLES: Record<TaskStatus, string> = {
  inbox: PURPLE_TINT,
  todo: NEUTRAL_TINT,
  in_progress: BLUE_TINT,
  blocked: YELLOW_TINT,
  completed: GREEN_TINT,
  cancelled: `${NEUTRAL_TINT} line-through opacity-70`,
};

const CATEGORY_STYLES: Record<string, string> = {
  LeetCode:
    "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400",
  school: "bg-cyan-500/10 text-cyan-700 ring-1 ring-inset ring-cyan-500/20 dark:text-cyan-400",
  project:
    "bg-violet-500/10 text-violet-700 ring-1 ring-inset ring-violet-500/20 dark:text-violet-400",
  personal: NEUTRAL_TINT,
  errands: "bg-lime-500/10 text-lime-700 ring-1 ring-inset ring-lime-500/20 dark:text-lime-400",
};

export function categoryColor(category: string): string {
  return CATEGORY_STYLES[category] || NEUTRAL_TINT;
}
