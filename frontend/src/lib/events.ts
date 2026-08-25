"use client";

// Minimal pub/sub so a task created from the always-visible QuickAddBar
// (which lives outside any single page's state) can prompt whichever page
// is currently mounted to refetch, without pulling in a data-fetching
// library for a single-user local app.
type Listener = () => void;

const listeners = new Set<Listener>();

export function onTasksChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyTasksChanged(): void {
  listeners.forEach((l) => l());
}
