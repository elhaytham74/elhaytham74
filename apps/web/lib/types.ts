import type { DoseRecommendation, Indication } from "@warfarin/dosing-engine";

export interface StoredInrReading {
  id: string;
  value: number;
  takenAt: string; // ISO date
}

export type RecommendationStatus = "pending" | "approved" | "modified" | "rejected";

export interface StoredRecommendation {
  id: string;
  createdAt: string;
  basedOnInr: number;
  recommendation: DoseRecommendation;
  status: RecommendationStatus;
  /** Set once a clinician approves/modifies — the dose actually put into effect. */
  finalWeeklyDoseMg?: number;
  clinicianNote?: string;
  clinicianName?: string;
  decidedAt?: string;
}

export interface ChatMessage {
  id: string;
  from: "patient" | "assistant" | "clinician";
  text: string;
  at: string;
  urgent?: boolean;
  escalated?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  indication: Indication;
  ageYears: number;
  weightKg: number;
  weeklyDoseMg: number;
  inrHistory: StoredInrReading[];
  recommendations: StoredRecommendation[];
  chatMessages: ChatMessage[];
}
