"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { parseQuickAdd } from "@/lib/quickAdd";
import type { Task } from "@/lib/types";

export default function QuickAddBar({ onCreated }: { onCreated?: (task: Task) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastHint, setLastHint] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || busy) return;
    setBusy(true);
    setLastHint(null);
    try {
      const { payload, matchedFragments } = parseQuickAdd(text);
      const task = await api.createTask(payload);
      setValue("");
      setLastHint(
        matchedFragments.length > 0
          ? `Parsed: ${matchedFragments.join(", ")}`
          : "Added to Inbox — organize it whenever."
      );
      onCreated?.(task);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1 w-full">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Quick add… e.g. "Akuna C++ OA due Sept 18 high priority"'
          className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50 shrink-0"
        >
          Add
        </button>
      </div>
      {lastHint && <span className="text-xs text-neutral-400 px-1">{lastHint}</span>}
    </form>
  );
}
