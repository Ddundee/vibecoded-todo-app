"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { onTasksChanged, notifyTasksChanged } from "@/lib/events";
import { formatDate } from "@/lib/format";
import type { OADeadlineItem, RecruitingPipelineStage } from "@/lib/types";
import { BUTTON_GHOST_SM, BUTTON_PRIMARY, CARD, FAINT, FIELD, MUTED, SECTION_HEADING } from "@/lib/ui";
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
      await api.createOA({
        company: company.trim(),
        oa_name: oaName.trim() || undefined,
        deadline: deadline || undefined,
      });
      setCompany("");
      setOaName("");
      setDeadline("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`flex flex-wrap items-end gap-2 p-3 ${CARD}`}>
      <label className={`text-xs ${MUTED}`}>
        Company
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className={`mt-1 block py-1.5 ${FIELD}`}
        />
      </label>
      <label className={`text-xs ${MUTED}`}>
        OA name
        <input
          value={oaName}
          onChange={(e) => setOaName(e.target.value)}
          className={`mt-1 block py-1.5 ${FIELD}`}
        />
      </label>
      <label className={`text-xs ${MUTED}`}>
        Deadline
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={`mt-1 block py-1.5 ${FIELD}`}
        />
      </label>
      <button type="submit" disabled={busy} className={BUTTON_PRIMARY}>
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
    <form onSubmit={submit} className={`flex flex-wrap items-end gap-2 p-3 ${CARD}`}>
      <label className={`text-xs ${MUTED}`}>
        Company
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className={`mt-1 block py-1.5 ${FIELD}`}
        />
      </label>
      <label className={`text-xs ${MUTED}`}>
        Position
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={`mt-1 block py-1.5 ${FIELD}`}
        />
      </label>
      <button type="submit" disabled={busy} className={BUTTON_PRIMARY}>
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
        <h2 className={SECTION_HEADING}>OA Deadlines</h2>
        <AddOAForm onAdded={load} />
        {loading && <p className={`text-sm ${FAINT}`}>Loading…</p>}
        {!loading && oas.length === 0 && <p className={`text-sm ${FAINT}`}>No OAs tracked.</p>}
        {oas.length > 0 && (
          <div className={`overflow-x-auto ${CARD}`}>
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b border-neutral-100 text-left dark:border-neutral-800 ${MUTED}`}
                >
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
                  <tr
                    key={item.task.id}
                    className="border-b border-neutral-50 last:border-0 dark:border-neutral-800/60"
                  >
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
                        <button onClick={() => complete(item.task.id)} className={BUTTON_GHOST_SM}>
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
        <h2 className={SECTION_HEADING}>Application Pipeline</h2>
        <AddApplicationForm onAdded={load} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pipeline
            .filter((stage) => stage.count > 0)
            .map((stage) => (
              <div key={stage.status} className={`p-3 ${CARD}`}>
                <h3 className={`mb-2 text-xs font-semibold uppercase ${MUTED}`}>
                  {STAGE_LABELS[stage.status] ?? stage.status} ({stage.count})
                </h3>
                <ul className="space-y-1">
                  {stage.tasks.map((t) => (
                    <li key={t.id} className="text-sm">
                      <span className="font-medium">{t.recruiting?.company ?? t.title}</span>
                      {t.recruiting?.position && (
                        <span className={MUTED}> · {t.recruiting.position}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          {pipeline.every((s) => s.count === 0) && !loading && (
            <p className={`text-sm ${FAINT}`}>No recruiting tasks yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
