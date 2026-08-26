"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged } from "@/lib/events";
import { relativeDueLabel } from "@/lib/format";
import type { Task } from "@/lib/types";
import { CARD_LIST, FAINT, SECTION_HEADING } from "@/lib/ui";
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
      {loading && <p className={`text-sm ${FAINT}`}>Loading…</p>}

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-1 px-3 text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
            Overdue ({overdue.length})
          </h2>
          <ul className="divide-y divide-neutral-100 rounded-xl border border-red-200 bg-white dark:divide-neutral-800 dark:border-red-900/50 dark:bg-neutral-900">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} {...overdueHandlers} />
            ))}
          </ul>
        </section>
      )}

      {sortedKeys.map((key) => (
        <section key={key}>
          <h2 className={SECTION_HEADING}>{relativeDueLabel(key)}</h2>
          <ul className={CARD_LIST}>
            {groups.get(key)!.map((t) => (
              <TaskRow key={t.id} task={t} {...upcomingHandlers} />
            ))}
          </ul>
        </section>
      ))}

      {!loading && overdue.length === 0 && upcoming.length === 0 && (
        <p className={`text-sm ${FAINT}`}>Nothing due in the next 14 days.</p>
      )}
    </div>
  );
}
