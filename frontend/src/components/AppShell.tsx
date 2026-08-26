"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { notifyTasksChanged } from "@/lib/events";
import QuickAddBar from "./QuickAddBar";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/today", label: "Today" },
  { href: "/inbox", label: "Inbox" },
  { href: "/tasks", label: "All Tasks" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/recruiting", label: "Recruiting" },
  { href: "/calendar", label: "Calendar" },
  { href: "/completed", label: "Completed" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white flex flex-col dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Tasks
          </span>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between px-3 py-4">
          <button
            onClick={handleLogout}
            className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            Log out
          </button>
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <QuickAddBar onCreated={() => notifyTasksChanged()} />
        </header>
        <main className="flex-1 px-6 py-8 max-w-3xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
