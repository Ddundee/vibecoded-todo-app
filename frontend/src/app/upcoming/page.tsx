"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged } from "@/lib/events";
import { relativeDueLabel } from "@/lib/format";
import type { Task } from "@/lib/types";
import TaskRow from "@/components/TaskRow";

export default function UpcomingPage() {
  const [overdue, setOverdue] = useState<Task[]>([]);
  const [upcoming, setUpcoming] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      Promise.all([api.getOverdue(), api.getUpcoming(14)])
        .then(([o, u]) => {
          setOverdue(o.tasks);
          setUpcoming(u.tasks);
        })
        .finally(() => setLoading(false));
    }
    load();
    return onTasksChanged(load);
  }, []);

  const groups = new Map<string, Task[]>();
  for (const t of upcoming) {
    const key = t.due_date ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const sortedKeys = Array.from(groups.keys()).sort();

  function patchIn(setter: typeof setOverdue) {
    return {
      onUpdated: (updated: Task) =>
        setter((prev) => prev.map((t) => (t.id === updated.id ? updated : t))),
      onDeleted: (id: string) => setter((prev) => prev.filter((t) => t.id !== id)),
    };
  }
  const overdueHandlers = patchIn(setOverdue);
  const upcomingHandlers = patchIn(setUpcoming);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Upcoming</h1>
      {loading && <p className="text-sm text-neutral-400">Loading…</p>}

      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-1 px-3">
            Overdue ({overdue.length})
          </h2>
          <ul className="divide-y divide-neutral-100 bg-white rounded-xl border border-red-200">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} {...overdueHandlers} />
            ))}
          </ul>
        </section>
      )}

      {sortedKeys.map((key) => (
        <section key={key}>
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-1 px-3">
            {relativeDueLabel(key)}
          </h2>
          <ul className="divide-y divide-neutral-100 bg-white rounded-xl border border-neutral-200">
            {groups.get(key)!.map((t) => (
              <TaskRow key={t.id} task={t} {...upcomingHandlers} />
            ))}
          </ul>
        </section>
      ))}

      {!loading && overdue.length === 0 && upcoming.length === 0 && (
        <p className="text-sm text-neutral-400">Nothing due in the next 14 days.</p>
      )}
    </div>
  );
}
