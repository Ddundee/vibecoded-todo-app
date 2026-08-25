"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { notifyTasksChanged } from "@/lib/events";
import { SEED_CATEGORIES, type Task, type TaskPriority, type TaskStatus } from "@/lib/types";

interface Props {
  task: Task | null; // null = create mode
  onClose: () => void;
  onSaved: (task: Task) => void;
}

const STATUSES: TaskStatus[] = ["inbox", "todo", "in_progress", "blocked", "completed", "cancelled"];
const PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];

export default function TaskEditModal({ task, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "inbox");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [category, setCategory] = useState(task?.category ?? "personal");
  const [tags, setTags] = useState(task?.tags?.join(", ") ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [dueTime, setDueTime] = useState(task?.due_time?.slice(0, 5) ?? "");
  const [estimatedDuration, setEstimatedDuration] = useState(
    task?.estimated_duration?.toString() ?? ""
  );
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      due_date: dueDate || null,
      due_time: dueTime || null,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration, 10) : null,
      notes: notes.trim() || null,
    };
    try {
      const saved = task ? await api.updateTask(task.id, payload) : await api.createTask(payload);
      onSaved(saved);
      notifyTasksChanged();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/30 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 space-y-3 my-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{task ? "Edit task" : "New task"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-sm"
          >
            ✕
          </button>
        </div>

        <input
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500">
            Category
            <input
              list="categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            />
            <datalist id="categories">
              {SEED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="text-xs text-neutral-500">
            Tags (comma separated)
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-500">
            Due time
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-neutral-500 col-span-2">
            Estimated duration (minutes)
            <input
              type="number"
              min={0}
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
