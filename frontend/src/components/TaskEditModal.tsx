"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { notifyTasksChanged } from "@/lib/events";
import { SEED_CATEGORIES, type Task, type TaskPriority, type TaskStatus } from "@/lib/types";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD as FIELD_BASE, MUTED } from "@/lib/ui";

interface Props {
  task: Task | null; // null = create mode
  onClose: () => void;
  onSaved: (task: Task) => void;
}

const STATUSES: TaskStatus[] = ["inbox", "todo", "in_progress", "blocked", "completed", "cancelled"];
const PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];

const FIELD = `mt-1 w-full py-2 ${FIELD_BASE}`;
const LABEL = `text-xs ${MUTED}`;

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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center dark:bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-lg space-y-3 rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {task ? "Edit task" : "New task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
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
          className={FIELD.replace("mt-1 ", "")}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className={FIELD.replace("mt-1 ", "")}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className={LABEL}>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={FIELD}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={FIELD}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className={LABEL}>
            Category
            <input
              list="categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={FIELD}
            />
            <datalist id="categories">
              {SEED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={LABEL}>
            Tags (comma separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={FIELD} />
          </label>
          <label className={LABEL}>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={FIELD}
            />
          </label>
          <label className={LABEL}>
            Due time
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className={FIELD}
            />
          </label>
          <label className={`${LABEL} col-span-2`}>
            Estimated duration (minutes)
            <input
              type="number"
              min={0}
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className={FIELD}
            />
          </label>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          className={FIELD.replace("mt-1 ", "")}
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={BUTTON_PRIMARY}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
