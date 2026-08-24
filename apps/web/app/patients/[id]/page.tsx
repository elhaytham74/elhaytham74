"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { INDICATION_LABELS } from "@warfarin/dosing-engine";
import { useStore } from "@/lib/store";
import { InrForm } from "@/components/InrForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ChatPanel } from "@/components/ChatPanel";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const patient = useStore((s) => s.getPatient(id));

  if (!patient) {
    return (
      <div className="text-sm text-slate-500">
        Patient not found. <Link href="/" className="text-brand-600 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-xs text-brand-600 hover:underline">
          ← All patients
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{patient.name}</h1>
        <p className="text-sm text-slate-500">
          {INDICATION_LABELS[patient.indication]} · Age {patient.ageYears} · {patient.weightKg} kg · Current dose{" "}
          {patient.weeklyDoseMg} mg/wk
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Log a new INR result</h2>
        <div className="mt-2">
          <InrForm patientId={patient.id} />
        </div>
        {patient.inrHistory.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {[...patient.inrHistory]
              .slice(-8)
              .reverse()
              .map((r) => (
                <span key={r.id} className="rounded bg-slate-100 px-2 py-1">
                  {r.value.toFixed(1)} · {new Date(r.takenAt).toLocaleDateString()}
                </span>
              ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recommendations</h2>
        {patient.recommendations.length === 0 ? (
          <p className="text-sm text-slate-400">No recommendations yet — log an INR result above.</p>
        ) : (
          patient.recommendations.map((r) => (
            <RecommendationCard key={r.id} patientId={patient.id} record={r} />
          ))
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Chat</h2>
        <ChatPanel patientId={patient.id} />
      </section>
    </div>
  );
}
