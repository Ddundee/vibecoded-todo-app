"use client";

import { useEffect, useState } from "react";
import { onTasksChanged } from "./events";
import type { Task } from "./types";

export function useTaskListState(fetcher: () => Promise<Task[]>, deps: unknown[] = []) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetcher()
        .then((data) => {
          if (cancelled) return;
          setTasks(data);
          setError(null);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to load tasks");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    const unsubscribe = onTasksChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  function handleUpdated(updated: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === updated.id);
      return exists ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev;
    });
  }

  function handleDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return { tasks, setTasks, loading, error, handleUpdated, handleDeleted };
}
