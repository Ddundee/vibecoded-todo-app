"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged, notifyTasksChanged } from "@/lib/events";
import { formatDate } from "@/lib/format";
import type { OADeadlineItem, RecruitingPipelineStage } from "@/lib/types";
import { UrgencyBadge } from "@/components/Badges";

const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  planning_to_apply: "Planning to apply",
  applied: "Applied",
  OA: "OA",
  interview: "Interview",
  final_round: "Final round",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function AddOAForm({ onAdded }: { onAdded: () => void }) {
  const [company, setCompany] = useState("");
  const [oaName, setOaName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setBusy(true);
    try {
      await api.createOA({ company: company.trim(), oa_name: oaName.trim() || undefined, deadline: deadline || undefined });
      setCompany("");
      setOaName("");
      setDeadline("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-end bg-white border border-neutral-200 rounded-xl p-3">
      <label className="text-xs text-neutral-500">
        Company
        <input value={company} onChange={(e) => setCompany(e.target.value)} required className="block border border-neutral-200 rounded-lg px-2 py-1.5 text-sm mt-1" />
      </label>
      <label className="text-xs text-neutral-500">
        OA name
        <input value={oaName} onChange={(e) => setOaName(e.target.value)} className="block border border-neutral-200 rounded-lg px-2 py-1.5 text-sm mt-1" />
      </label>
      <label className="text-xs text-neutral-500">
        Deadline
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="block border border-neutral-200 rounded-lg px-2 py-1.5 text-sm mt-1" />
      </label>
      <button type="submit" disabled={busy} className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50">
        Add OA
      </button>
    </form>
  );
}

function AddApplicationForm({ onAdded }: { onAdded: () => void }) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) return;
    setBusy(true);
    try {
      await api.createApplication({ company: company.trim(), position: position.trim() || undefined });
      setCompany("");
      setPosition("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-end bg-white border border-neutral-200 rounded-xl p-3">
      <label className="text-xs text-neutral-500">
        Company
        <input value={company} onChange={(e) => setCompany(e.target.value)} required className="block border border-neutral-200 rounded-lg px-2 py-1.5 text-sm mt-1" />
      </label>
      <label className="text-xs text-neutral-500">
        Position
        <input value={position} onChange={(e) => setPosition(e.target.value)} className="block border border-neutral-200 rounded-lg px-2 py-1.5 text-sm mt-1" />
      </label>
      <button type="submit" disabled={busy} className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50">
        Add application
      </button>
    </form>
  );
}

export default function RecruitingPage() {
  const [oas, setOas] = useState<OADeadlineItem[]>([]);
  const [pipeline, setPipeline] = useState<RecruitingPipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([api.listOAs(), api.getPipeline()])
      .then(([o, p]) => {
        setOas(o);
        setPipeline(p);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    return onTasksChanged(load);
  }, []);

  async function complete(taskId: string) {
    await api.completeTask(taskId);
    notifyTasksChanged();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Recruiting</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
          OA Deadlines
        </h2>
        <AddOAForm onAdded={load} />
        {loading && <p className="text-sm text-neutral-400">Loading…</p>}
        {!loading && oas.length === 0 && <p className="text-sm text-neutral-400">No OAs tracked.</p>}
        {oas.length > 0 && (
          <div className="overflow-x-auto bg-white border border-neutral-200 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-100">
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">OA</th>
                  <th className="px-3 py-2 font-medium">Received</th>
                  <th className="px-3 py-2 font-medium">Deadline</th>
                  <th className="px-3 py-2 font-medium">Days left</th>
                  <th className="px-3 py-2 font-medium">Urgency</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {oas.map((item) => (
                  <tr key={item.task.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-3 py-2">{item.company}</td>
                    <td className="px-3 py-2">{item.oa_name}</td>
                    <td className="px-3 py-2">{formatDate(item.received_date)}</td>
                    <td className="px-3 py-2">{formatDate(item.deadline)}</td>
                    <td className="px-3 py-2">
                      {item.days_remaining !== null ? item.days_remaining : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <UrgencyBadge urgency={item.urgency} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!item.completed && (
                        <button
                          onClick={() => complete(item.task.id)}
                          className="text-xs px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-100"
                        >
                          Mark done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
          Application Pipeline
        </h2>
        <AddApplicationForm onAdded={load} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pipeline
            .filter((stage) => stage.count > 0)
            .map((stage) => (
              <div key={stage.status} className="bg-white border border-neutral-200 rounded-xl p-3">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">
                  {STAGE_LABELS[stage.status] ?? stage.status} ({stage.count})
                </h3>
                <ul className="space-y-1">
                  {stage.tasks.map((t) => (
                    <li key={t.id} className="text-sm">
                      <span className="font-medium">{t.recruiting?.company ?? t.title}</span>
                      {t.recruiting?.position && (
                        <span className="text-neutral-500"> · {t.recruiting.position}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          {pipeline.every((s) => s.count === 0) && !loading && (
            <p className="text-sm text-neutral-400">No recruiting tasks yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
