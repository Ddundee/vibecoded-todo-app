"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useTaskListState } from "@/lib/useTasks";
import { SEED_CATEGORIES, type Task, type TaskPriority, type TaskStatus } from "@/lib/types";
import { BUTTON_PRIMARY, CARD_LIST, FAINT, FIELD } from "@/lib/ui";
import TaskRow from "@/components/TaskRow";
import TaskEditModal from "@/components/TaskEditModal";

const STATUSES: TaskStatus[] = ["inbox", "todo", "in_progress", "blocked", "completed", "cancelled"];
const PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];

export default function AllTasksPage() {
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const { tasks, handleUpdated, handleDeleted, loading } = useTaskListState(
    () =>
      api
        .listTasks({
          status: status || undefined,
          category: category || undefined,
          priority: priority || undefined,
          q: search || undefined,
          include_completed: true,
        })
        .then((r) => r.tasks),
    [status, category, priority, search]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">All Tasks</h1>
        <button onClick={() => setCreating(true)} className={BUTTON_PRIMARY}>
          + New task
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, notes…"
          className={`min-w-[200px] flex-1 py-1.5 ${FIELD}`}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`py-1.5 ${FIELD}`}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={`py-1.5 ${FIELD}`}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`py-1.5 ${FIELD}`}
        >
          <option value="">All categories</option>
          {SEED_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className={`text-sm ${FAINT}`}>Loading…</p>}
      {!loading && tasks.length === 0 && (
        <p className={`text-sm ${FAINT}`}>No tasks match these filters.</p>
      )}

      <ul className={CARD_LIST}>
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onEdit={setEditing}
          />
        ))}
      </ul>

      {creating && (
        <TaskEditModal
          task={null}
          onClose={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}
      {editing && (
        <TaskEditModal task={editing} onClose={() => setEditing(null)} onSaved={handleUpdated} />
      )}
    </div>
  );
}
