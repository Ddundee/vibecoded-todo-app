import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Personal task manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full h-full bg-neutral-50 text-neutral-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
