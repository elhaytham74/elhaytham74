import type { DoseRecommendation, Indication } from "@warfarin/dosing-engine";

export interface InrEntry {
  id: string;
  value: number;
  takenAt: string;
}

export type RecommendationStatus = "pending" | "confirmed_by_clinic";

export interface RecommendationRecord {
  id: string;
  createdAt: string;
  basedOnInr: number;
  recommendation: DoseRecommendation;
  status: RecommendationStatus;
}

export interface ChatMessage {
  id: string;
  from: "patient" | "assistant";
  text: string;
  at: string;
  urgent?: boolean;
  escalated?: boolean;
}

export interface PatientState {
  name: string;
  indication: Indication;
  weeklyDoseMg: number;
  inrHistory: InrEntry[];
  recommendations: RecommendationRecord[];
  chatMessages: ChatMessage[];
}
