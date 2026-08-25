"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged } from "@/lib/events";
import { formatDateLong } from "@/lib/format";
import type { Task, TodayView } from "@/lib/types";
import TaskRow from "@/components/TaskRow";

function Section({
  title,
  tasks,
  onUpdated,
  onDeleted,
}: {
  title: string;
  tasks: Task[];
  onUpdated: (t: Task) => void;
  onDeleted: (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-1 px-3">
        {title} <span className="text-neutral-300 font-normal">({tasks.length})</span>
      </h2>
      <ul className="divide-y divide-neutral-100 bg-white rounded-xl border border-neutral-200">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onUpdated={onUpdated} onDeleted={onDeleted} />
        ))}
      </ul>
    </section>
  );
}

export default function TodayPage() {
  const [view, setView] = useState<TodayView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      api
        .getToday()
        .then(setView)
        .finally(() => setLoading(false));
    }
    load();
    return onTasksChanged(load);
  }, []);

  function patch(section: keyof TodayView, updater: (tasks: Task[]) => Task[]) {
    setView((prev) => (prev ? { ...prev, [section]: updater(prev[section] as Task[]) } : prev));
  }

  function onUpdatedIn(section: keyof TodayView) {
    return (updated: Task) => patch(section, (tasks) => tasks.map((t) => (t.id === updated.id ? updated : t)));
  }
  function onDeletedIn(section: keyof TodayView) {
    return (id: string) => patch(section, (tasks) => tasks.filter((t) => t.id !== id));
  }

  if (loading && !view) return <p className="text-sm text-neutral-400">Loading…</p>;
  if (!view) return null;

  const nothingToShow =
    view.scheduled.length === 0 &&
    view.due_today.length === 0 &&
    view.overdue.length === 0 &&
    view.suggested_high_priority.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Today</h1>
        <p className="text-sm text-neutral-500">{formatDateLong(view.date)}</p>
      </div>

      {nothingToShow && (
        <p className="text-sm text-neutral-400">
          Nothing planned yet — use quick add above, or plan a task for today from Inbox / All
          Tasks.
        </p>
      )}

      <Section
        title="Overdue"
        tasks={view.overdue}
        onUpdated={onUpdatedIn("overdue")}
        onDeleted={onDeletedIn("overdue")}
      />
      <Section
        title="Planned for today"
        tasks={view.scheduled}
        onUpdated={onUpdatedIn("scheduled")}
        onDeleted={onDeletedIn("scheduled")}
      />
      <Section
        title="Due today"
        tasks={view.due_today.filter((t) => !view.scheduled.some((s) => s.id === t.id))}
        onUpdated={onUpdatedIn("due_today")}
        onDeleted={onDeletedIn("due_today")}
      />
      <Section
        title="Suggested (high priority, unscheduled)"
        tasks={view.suggested_high_priority}
        onUpdated={onUpdatedIn("suggested_high_priority")}
        onDeleted={onDeletedIn("suggested_high_priority")}
      />
    </div>
  );
}
