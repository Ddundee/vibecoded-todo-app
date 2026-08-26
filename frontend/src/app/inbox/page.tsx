"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useTaskListState } from "@/lib/useTasks";
import type { Task } from "@/lib/types";
import { CARD_LIST, FAINT, MUTED } from "@/lib/ui";
import TaskRow from "@/components/TaskRow";
import TaskEditModal from "@/components/TaskEditModal";

export default function InboxPage() {
  const { tasks, loading, handleUpdated, handleDeleted } = useTaskListState(() =>
    api.listTasks({ status: "inbox" }).then((r) => r.tasks)
  );
  const [editing, setEditing] = useState<Task | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Inbox</h1>
        <p className={`text-sm ${MUTED}`}>
          Captured but not yet organized. Click Edit to give it a category, priority, or due
          date.
        </p>
      </div>

      {loading && <p className={`text-sm ${FAINT}`}>Loading…</p>}
      {!loading && tasks.length === 0 && (
        <p className={`text-sm ${FAINT}`}>Inbox is empty. Nice.</p>
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

      {editing && (
        <TaskEditModal task={editing} onClose={() => setEditing(null)} onSaved={handleUpdated} />
      )}
    </div>
  );
}
