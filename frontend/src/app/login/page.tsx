"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { BUTTON_PRIMARY, CARD, FIELD } from "@/lib/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(username, password);
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? "Invalid username or password" : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <form onSubmit={handleSubmit} className={`w-full max-w-sm space-y-5 p-6 ${CARD}`}>
        <div className="flex flex-col items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Personal Task Manager
          </h1>
        </div>
        <div className="space-y-2">
          <input
            autoFocus
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={`w-full py-2 ${FIELD}`}
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={`w-full py-2 ${FIELD}`}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className={`w-full ${BUTTON_PRIMARY}`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
