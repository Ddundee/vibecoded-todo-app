"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { parseQuickAdd } from "@/lib/quickAdd";
import type { Task } from "@/lib/types";
import { BUTTON_PRIMARY, FAINT, FIELD } from "@/lib/ui";

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
          placeholder='Quick add… e.g. "Finish problem set 3 due Sept 18 high priority"'
          className={`flex-1 py-2 ${FIELD}`}
        />
        <button type="submit" disabled={busy || !value.trim()} className={`shrink-0 ${BUTTON_PRIMARY}`}>
          Add
        </button>
      </div>
      {lastHint && <span className={`px-1 text-xs ${FAINT}`}>{lastHint}</span>}
    </form>
  );
}
