"use client";

import Link from "next/link";
import { INDICATION_LABELS } from "@warfarin/dosing-engine";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const patients = useStore((s) => s.patients);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Patients</h1>
        <p className="text-sm text-slate-500">
          Demo data only. Every dose suggestion below is pending or clinician-reviewed decision support — see each
          patient for details.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Indication</th>
              <th className="px-4 py-2">Latest INR</th>
              <th className="px-4 py-2">Weekly dose</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => {
              const latestInr = p.inrHistory.at(-1);
              const pendingRec = p.recommendations.find((r) => r.status === "pending");
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{INDICATION_LABELS[p.indication]}</td>
                  <td className="px-4 py-3">
                    {latestInr ? latestInr.value.toFixed(1) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">{p.weeklyDoseMg} mg/wk</td>
                  <td className="px-4 py-3">
                    {pendingRec ? (
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          pendingRec.recommendation.urgent
                            ? "bg-urgent-50 text-urgent-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {pendingRec.recommendation.urgent ? "Urgent review needed" : "Pending review"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Up to date
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/patients/${p.id}`} className="text-brand-600 hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
