"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged } from "@/lib/events";
import { formatDate } from "@/lib/format";
import type { Task, WeekSummary } from "@/lib/types";
import { CARD, CARD_LIST, FAINT, MUTED } from "@/lib/ui";
import TaskRow from "@/components/TaskRow";

export default function CompletedPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([
      api.listTasks({ status: "completed" }).then((r) => r.tasks),
      api.getWeekSummary(),
    ])
      .then(([t, s]) => {
        setTasks(
          [...t].sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))
        );
        setSummary(s);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    return onTasksChanged(load);
  }, []);

  function onUpdated(updated: Task) {
    if (updated.status !== "completed") {
      setTasks((prev) => prev.filter((t) => t.id !== updated.id));
    } else {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  }
  function onDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Completed</h1>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 text-center ${CARD}`}>
            <div className="text-2xl font-semibold">{summary.completed_count}</div>
            <div className={`text-xs ${MUTED}`}>Completed this week</div>
          </div>
          <div className={`p-3 text-center ${CARD}`}>
            <div className="text-2xl font-semibold">{summary.created_count}</div>
            <div className={`text-xs ${MUTED}`}>Created this week</div>
          </div>
          <div className={`p-3 text-center ${CARD}`}>
            <div className="text-2xl font-semibold">{summary.overdue_count}</div>
            <div className={`text-xs ${MUTED}`}>Still overdue</div>
          </div>
        </div>
      )}

      {summary && Object.keys(summary.completed_by_category).length > 0 && (
        <div className={`text-sm ${MUTED}`}>
          {formatDate(summary.start_date)} – {formatDate(summary.end_date)} by category:{" "}
          {Object.entries(summary.completed_by_category)
            .map(([cat, count]) => `${cat} (${count})`)
            .join(", ")}
        </div>
      )}

      {loading && <p className={`text-sm ${FAINT}`}>Loading…</p>}
      {!loading && tasks.length === 0 && (
        <p className={`text-sm ${FAINT}`}>Nothing completed yet.</p>
      )}

      <ul className={CARD_LIST}>
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onUpdated={onUpdated} onDeleted={onDeleted} />
        ))}
      </ul>
    </div>
  );
}
