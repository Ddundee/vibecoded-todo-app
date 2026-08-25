"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { notifyTasksChanged } from "@/lib/events";
import QuickAddBar from "./QuickAddBar";

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
      <aside className="w-52 shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        <div className="px-4 py-4 text-lg font-semibold">Tasks</div>
        <nav className="flex-1 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="m-3 text-xs text-neutral-400 hover:text-neutral-600 text-left"
        >
          Log out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-neutral-200 bg-white px-6 py-3">
          <QuickAddBar onCreated={() => notifyTasksChanged()} />
        </header>
        <main className="flex-1 px-6 py-6 max-w-4xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
