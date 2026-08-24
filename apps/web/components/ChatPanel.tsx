"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function ChatPanel({ patientId }: { patientId: string }) {
  const patient = useStore((s) => s.getPatient(patientId));
  const sendPatientMessage = useStore((s) => s.sendPatientMessage);
  const sendClinicianMessage = useStore((s) => s.sendClinicianMessage);
  const [patientDraft, setPatientDraft] = useState("");
  const [clinicianDraft, setClinicianDraft] = useState("");

  if (!patient) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold">Patient chat (demo)</div>
      <div className="max-h-80 space-y-2 overflow-y-auto px-4 py-3">
        {patient.chatMessages.length === 0 && (
          <p className="text-xs text-slate-400">
            No messages yet. Try asking as the patient: “why did my dose change?”, “I missed a dose”, or “should I
            stop warfarin?”.
          </p>
        )}
        {patient.chatMessages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.from === "patient"
                ? "ml-auto bg-brand-600 text-white"
                : m.from === "clinician"
                ? "border border-brand-200 bg-brand-50 text-brand-800"
                : m.urgent
                ? "border border-urgent-500 bg-urgent-50 text-urgent-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
              {m.from === "assistant" ? "Care assistant" : m.from === "clinician" ? "Clinician" : "Patient"}
              {m.escalated ? " · flagged for clinician" : ""}
            </div>
            {m.text}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 border-t border-slate-200 p-3 sm:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!patientDraft.trim()) return;
            sendPatientMessage(patientId, patientDraft.trim());
            setPatientDraft("");
          }}
          className="flex gap-1"
        >
          <input
            value={patientDraft}
            onChange={(e) => setPatientDraft(e.target.value)}
            placeholder="Message as patient…"
            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <button className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white">Send</button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!clinicianDraft.trim()) return;
            sendClinicianMessage(patientId, clinicianDraft.trim());
            setClinicianDraft("");
          }}
          className="flex gap-1"
        >
          <input
            value={clinicianDraft}
            onChange={(e) => setClinicianDraft(e.target.value)}
            placeholder="Reply as clinician…"
            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <button className="rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white">Send</button>
        </form>
      </div>
    </div>
  );
}
