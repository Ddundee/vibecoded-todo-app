"use client";

import { useState } from "react";

export default function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can reject outside a secure context (e.g. plain
      // HTTP over a LAN/Tailscale IP) — fail silently, the text is still
      // selectable by hand.
    }
  }

  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs leading-relaxed text-neutral-100 dark:bg-black">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md bg-neutral-800/90 px-2 py-1 text-[11px] text-neutral-300 opacity-0 transition-opacity hover:bg-neutral-700 group-hover:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
