"use client";

import { useState } from "react";
import type { StoredRecommendation } from "@/lib/types";
import { useStore } from "@/lib/store";

const ACTION_LABELS: Record<string, string> = {
  continue_same_dose: "Continue same dose",
  increase_dose: "Increase dose",
  decrease_dose: "Decrease dose",
  hold_doses: "Hold dose(s)",
  hold_and_decrease: "Hold dose(s) and decrease",
  hold_and_seek_urgent_care: "Hold warfarin — urgent care",
  seek_emergency_care: "Seek emergency care",
};

export function RecommendationCard({ patientId, record }: { patientId: string; record: StoredRecommendation }) {
  const decideRecommendation = useStore((s) => s.decideRecommendation);
  const [clinicianName, setClinicianName] = useState("");
  const [note, setNote] = useState("");
  const [doseOverride, setDoseOverride] = useState(
    record.recommendation.newWeeklyDoseMg?.toString() ?? record.recommendation.previousWeeklyDoseMg?.toString() ?? ""
  );

  const r = record.recommendation;
  const isPending = record.status === "pending";

  function submit(status: "approved" | "modified" | "rejected") {
    if (!clinicianName.trim()) return;
    const finalWeeklyDoseMg =
      status === "rejected" ? undefined : Number(doseOverride) || r.newWeeklyDoseMg || r.previousWeeklyDoseMg;
    decideRecommendation(patientId, record.id, { status, finalWeeklyDoseMg, note: note.trim() || undefined, clinicianName });
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        r.urgent ? "border-urgent-500 bg-urgent-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{ACTION_LABELS[r.action] ?? r.action}</span>
          {r.urgent && (
            <span className="rounded-full bg-urgent-700 px-2 py-0.5 text-xs font-medium text-white">URGENT</span>
          )}
        </div>
        <span className="text-xs text-slate-400">based on INR {record.basedOnInr.toFixed(1)}</span>
      </div>

      <p className="mt-2 text-sm text-slate-700">{r.rationale}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
        {r.newWeeklyDoseMg !== undefined && (
          <div>
            <dt className="font-medium text-slate-400">Suggested weekly dose</dt>
            <dd>
              {r.newWeeklyDoseMg} mg/wk
              {r.percentChange ? ` (${r.percentChange > 0 ? "+" : ""}${r.percentChange}%)` : ""}
            </dd>
          </div>
        )}
        {r.dosesToHold ? (
          <div>
            <dt className="font-medium text-slate-400">Doses to hold</dt>
            <dd>{r.dosesToHold}</dd>
          </div>
        ) : null}
        {r.vitaminKSuggestionMg ? (
          <div>
            <dt className="font-medium text-slate-400">Oral vitamin K</dt>
            <dd>{r.vitaminKSuggestionMg} mg (clinician to confirm)</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-medium text-slate-400">Next INR check</dt>
          <dd>{r.nextCheckDays === 0 ? "Immediately" : `${r.nextCheckDays} day(s)`}</dd>
        </div>
      </dl>

      {r.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {r.flags.map((f) => (
            <span key={f} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-slate-200 pt-3 text-xs">
        {isPending ? (
          <div className="space-y-2">
            <p className="font-medium text-slate-500">Clinician sign-off required before this reaches the patient.</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Your name (clinician)"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1"
              />
              {r.newWeeklyDoseMg !== undefined && (
                <input
                  type="number"
                  step="0.5"
                  value={doseOverride}
                  onChange={(e) => setDoseOverride(e.target.value)}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1"
                  title="Final weekly dose (mg) — edit to override the suggestion"
                />
              )}
              <input
                type="text"
                placeholder="Note to patient (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 min-w-[140px] rounded-md border border-slate-300 px-2 py-1"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={!clinicianName.trim()}
                onClick={() => submit("approved")}
                className="rounded-md bg-emerald-600 px-2.5 py-1 font-medium text-white disabled:opacity-40"
              >
                Approve as suggested
              </button>
              <button
                disabled={!clinicianName.trim()}
                onClick={() => submit("modified")}
                className="rounded-md bg-brand-600 px-2.5 py-1 font-medium text-white disabled:opacity-40"
              >
                Approve with modified dose
              </button>
              <button
                disabled={!clinicianName.trim()}
                onClick={() => submit("rejected")}
                className="rounded-md bg-slate-200 px-2.5 py-1 font-medium text-slate-700 disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">
            {record.status === "rejected" ? "Rejected" : record.status === "modified" ? "Modified & approved" : "Approved"}{" "}
            by {record.clinicianName} on {record.decidedAt ? new Date(record.decidedAt).toLocaleString() : ""}
            {record.finalWeeklyDoseMg !== undefined ? ` — final dose ${record.finalWeeklyDoseMg} mg/wk` : ""}
            {record.clinicianNote ? ` — "${record.clinicianNote}"` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
