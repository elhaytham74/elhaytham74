"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  answerChatQuery,
  getIndicationTargetRange,
  getMaintenanceAdjustment,
} from "@warfarin/dosing-engine";
import { initialPatients } from "./fixtures";
import type { ChatMessage, Patient, StoredRecommendation } from "./types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface StoreState {
  patients: Patient[];
  getPatient: (id: string) => Patient | undefined;
  addInrReading: (patientId: string, value: number) => void;
  decideRecommendation: (
    patientId: string,
    recommendationId: string,
    decision: { status: "approved" | "modified" | "rejected"; finalWeeklyDoseMg?: number; note?: string; clinicianName: string }
  ) => void;
  sendPatientMessage: (patientId: string, text: string) => void;
  sendClinicianMessage: (patientId: string, text: string) => void;
  resetDemoData: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      patients: initialPatients,

      getPatient: (id) => get().patients.find((p) => p.id === id),

      addInrReading: (patientId, value) =>
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const range = getIndicationTargetRange(p.indication);
            const recommendation = getMaintenanceAdjustment(value, range, p.weeklyDoseMg);
            const stored: StoredRecommendation = {
              id: uid("rec"),
              createdAt: new Date().toISOString(),
              basedOnInr: value,
              recommendation,
              status: "pending",
            };
            return {
              ...p,
              inrHistory: [...p.inrHistory, { id: uid("inr"), value, takenAt: new Date().toISOString() }],
              recommendations: [stored, ...p.recommendations],
            };
          }),
        })),

      decideRecommendation: (patientId, recommendationId, decision) =>
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const recommendations = p.recommendations.map((r) =>
              r.id === recommendationId
                ? {
                    ...r,
                    status: decision.status,
                    finalWeeklyDoseMg: decision.finalWeeklyDoseMg,
                    clinicianNote: decision.note,
                    clinicianName: decision.clinicianName,
                    decidedAt: new Date().toISOString(),
                  }
                : r
            );
            const applied = recommendations.find((r) => r.id === recommendationId);
            const newWeeklyDose =
              applied && (decision.status === "approved" || decision.status === "modified") && decision.finalWeeklyDoseMg
                ? decision.finalWeeklyDoseMg
                : p.weeklyDoseMg;

            const noteMessage: ChatMessage | null = decision.note
              ? {
                  id: uid("msg"),
                  from: "clinician",
                  text: decision.note,
                  at: new Date().toISOString(),
                }
              : null;

            return {
              ...p,
              weeklyDoseMg: newWeeklyDose,
              recommendations,
              chatMessages: noteMessage ? [...p.chatMessages, noteMessage] : p.chatMessages,
            };
          }),
        })),

      sendPatientMessage: (patientId, text) =>
        set((state) => ({
          patients: state.patients.map((p) => {
            if (p.id !== patientId) return p;
            const latestRec = p.recommendations[0];
            const reply = answerChatQuery(text, {
              indication: p.indication,
              latestInr: p.inrHistory.at(-1)?.value,
              recommendation: latestRec?.recommendation,
              clinicianApproved: latestRec?.status === "approved" || latestRec?.status === "modified",
            });
            const patientMsg: ChatMessage = { id: uid("msg"), from: "patient", text, at: new Date().toISOString() };
            const assistantMsg: ChatMessage = {
              id: uid("msg"),
              from: "assistant",
              text: reply.text,
              at: new Date().toISOString(),
              urgent: reply.urgent,
              escalated: reply.escalateToClinician,
            };
            return { ...p, chatMessages: [...p.chatMessages, patientMsg, assistantMsg] };
          }),
        })),

      sendClinicianMessage: (patientId, text) =>
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  chatMessages: [
                    ...p.chatMessages,
                    { id: uid("msg"), from: "clinician", text, at: new Date().toISOString() },
                  ],
                }
              : p
          ),
        })),

      resetDemoData: () => set({ patients: initialPatients }),
    }),
    { name: "warfarin-demo-store" }
  )
);
