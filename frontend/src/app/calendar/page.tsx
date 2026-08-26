"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged } from "@/lib/events";
import { todayIso } from "@/lib/format";
import type { Task } from "@/lib/types";
import { BUTTON_GHOST_SM, FAINT } from "@/lib/ui";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month is 0-indexed
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const rangeStart = `${cursor.year}-${pad(cursor.month + 1)}-01`;
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const rangeEnd = `${cursor.year}-${pad(cursor.month + 1)}-${pad(daysInMonth)}`;

  function load() {
    api
      .listTasks({ due_after: rangeStart, due_before: rangeEnd })
      .then((r) => setTasks(r.tasks))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    return onTasksChanged(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor.year, cursor.month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      if (!map.has(t.due_date)) map.set(t.due_date, []);
      map.get(t.due_date)!.push(t);
    }
    return map;
  }, [tasks]);

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay(); // 0=Sun
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Calendar</h1>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => shiftMonth(-1)} className={BUTTON_GHOST_SM}>
            ←
          </button>
          <span className="w-36 text-center font-medium">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className={BUTTON_GHOST_SM}>
            →
          </button>
        </div>
      </div>

      {loading && <p className={`text-sm ${FAINT}`}>Loading…</p>}

      <div className="grid grid-cols-7 gap-1.5 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className={`pb-1 text-center font-medium ${FAINT}`}>
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          const iso = day ? `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}` : null;
          const dayTasks = iso ? byDay.get(iso) ?? [] : [];
          const isToday = iso === todayIso();
          return (
            <div
              key={idx}
              className={`min-h-[86px] rounded-lg border p-1.5 ${
                day
                  ? "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  : "border-transparent bg-transparent"
              } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
            >
              {day && (
                <>
                  <div className={`mb-1 text-xs ${FAINT}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center gap-1 truncate text-[11px]">
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            t.status === "completed"
                              ? "bg-green-400"
                              : "bg-neutral-400 dark:bg-neutral-600"
                          }`}
                        />
                        <span
                          className={
                            t.status === "completed"
                              ? `line-through ${FAINT}`
                              : "text-neutral-700 dark:text-neutral-300"
                          }
                        >
                          {t.title}
                        </span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className={`text-[11px] ${FAINT}`}>+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
