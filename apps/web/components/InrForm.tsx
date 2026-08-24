"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function InrForm({ patientId }: { patientId: string }) {
  const addInrReading = useStore((s) => s.addInrReading);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 20) {
      setError("Enter a plausible INR value (e.g. between 0.5 and 20).");
      return;
    }
    setError(null);
    addInrReading(patientId, parsed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="block text-xs font-medium text-slate-500">New INR result</label>
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 2.6"
          className="mt-1 w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Compute recommendation
      </button>
      {error && <span className="text-xs text-urgent-700">{error}</span>}
    </form>
  );
}
