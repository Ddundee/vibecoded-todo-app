"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { notifyTasksChanged } from "@/lib/events";
import { relativeDueLabel } from "@/lib/format";
import type { Task } from "@/lib/types";
import { BUTTON_GHOST_SM } from "@/lib/ui";
import { CategoryBadge, PriorityBadge, StatusBadge, UrgencyBadge } from "./Badges";

interface Props {
  task: Task;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export default function TaskRow({ task, onUpdated, onDeleted, onEdit }: Props) {
  const [busy, setBusy] = useState(false);
  const isDone = task.status === "completed" || task.status === "cancelled";

  async function toggleComplete() {
    setBusy(true);
    try {
      const updated = isDone
        ? await api.updateTask(task.id, { status: "todo" })
        : await api.completeTask(task.id);
      onUpdated(updated);
      notifyTasksChanged();
    } finally {
      setBusy(false);
    }
  }

  async function togglePlanToday() {
    setBusy(true);
    try {
      const updated = task.planned_for_date
        ? await api.unplanFromToday(task.id)
        : await api.planForToday(task.id);
      onUpdated(updated);
      notifyTasksChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteTask(task.id);
      onDeleted(task.id);
      notifyTasksChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-2.5 px-3 rounded-lg group hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
      <button
        onClick={toggleComplete}
        disabled={busy}
        aria-label={isDone ? "Mark as not done" : "Mark as done"}
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          isDone
            ? "bg-green-500 border-green-500 text-white"
            : "border-neutral-300 hover:border-green-500 dark:border-neutral-600"
        }`}
      >
        {isDone && (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.6 3.6 6.7-6.7a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-sm font-medium ${
              isDone
                ? "line-through text-neutral-400 dark:text-neutral-600"
                : "text-neutral-900 dark:text-neutral-100"
            }`}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
          <CategoryBadge category={task.category} />
          {task.status !== "todo" && task.status !== "completed" && (
            <StatusBadge status={task.status} />
          )}
          {task.oa_urgency && task.oa_urgency !== "normal" && (
            <UrgencyBadge urgency={task.oa_urgency} />
          )}
          {task.recurrence_rule_id && (
            <span className="text-xs text-neutral-400 dark:text-neutral-600" title="Recurring task">
              ↻
            </span>
          )}
        </div>
        {task.recruiting?.company && (
          <div className="text-xs text-neutral-500 mt-0.5 dark:text-neutral-400">
            {task.recruiting.company}
            {task.recruiting.position ? ` · ${task.recruiting.position}` : ""}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {task.due_date && (
            <span className={task.is_overdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
              {relativeDueLabel(task.due_date)}
              {task.due_time ? ` at ${task.due_time.slice(0, 5)}` : ""}
            </span>
          )}
          {task.estimated_duration ? <span>· {task.estimated_duration}m</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={togglePlanToday}
          disabled={busy}
          className={BUTTON_GHOST_SM}
          title={task.planned_for_date ? "Remove from today" : "Plan for today"}
        >
          {task.planned_for_date ? "− Today" : "+ Today"}
        </button>
        {onEdit && (
          <button onClick={() => onEdit(task)} className={BUTTON_GHOST_SM}>
            Edit
          </button>
        )}
        <button
          onClick={remove}
          disabled={busy}
          className="text-xs px-2 py-1 rounded-md text-neutral-400 hover:bg-red-500/10 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
