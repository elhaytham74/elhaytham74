import type { Patient } from "./types";

/** Seed demo data — not real patients. For prototype/demo purposes only. */
export const initialPatients: Patient[] = [
  {
    id: "p1",
    name: "A. Karim (demo)",
    indication: "atrial_fibrillation",
    ageYears: 72,
    weightKg: 78,
    weeklyDoseMg: 35,
    inrHistory: [{ id: "i1", value: 2.4, takenAt: daysAgo(28) }],
    recommendations: [],
    chatMessages: [],
  },
  {
    id: "p2",
    name: "S. Nasser (demo)",
    indication: "mechanical_valve_mitral",
    ageYears: 54,
    weightKg: 65,
    weeklyDoseMg: 42,
    inrHistory: [{ id: "i1", value: 3.9, takenAt: daysAgo(3) }],
    recommendations: [],
    chatMessages: [],
  },
  {
    id: "p3",
    name: "L. Fahmy (demo)",
    indication: "vte_treatment",
    ageYears: 45,
    weightKg: 70,
    weeklyDoseMg: 30,
    inrHistory: [{ id: "i1", value: 1.6, takenAt: daysAgo(10) }],
    recommendations: [],
    chatMessages: [],
  },
];

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
