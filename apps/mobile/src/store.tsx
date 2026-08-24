import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  answerChatQuery,
  getIndicationTargetRange,
  getMaintenanceAdjustment,
} from "@warfarin/dosing-engine";
import type { ChatMessage, PatientState, RecommendationRecord } from "./types";

const STORAGE_KEY = "warfarin-demo-patient-v1";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const initialPatientState: PatientState = {
  name: "You (demo patient)",
  indication: "atrial_fibrillation",
  weeklyDoseMg: 35,
  inrHistory: [{ id: "i1", value: 2.4, takenAt: new Date(Date.now() - 28 * 86400000).toISOString() }],
  recommendations: [],
  chatMessages: [],
};

type Action =
  | { type: "hydrate"; state: PatientState }
  | { type: "add_inr"; value: number }
  | { type: "confirm_recommendation"; recommendationId: string }
  | { type: "send_patient_message"; text: string };

function reducer(state: PatientState, action: Action): PatientState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "add_inr": {
      const range = getIndicationTargetRange(state.indication);
      const recommendation = getMaintenanceAdjustment(action.value, range, state.weeklyDoseMg);
      const record: RecommendationRecord = {
        id: uid("rec"),
        createdAt: new Date().toISOString(),
        basedOnInr: action.value,
        recommendation,
        status: "pending",
      };
      return {
        ...state,
        inrHistory: [...state.inrHistory, { id: uid("inr"), value: action.value, takenAt: new Date().toISOString() }],
        recommendations: [record, ...state.recommendations],
      };
    }

    case "confirm_recommendation": {
      const record = state.recommendations.find((r) => r.id === action.recommendationId);
      if (!record) return state;
      const newDose = record.recommendation.newWeeklyDoseMg ?? state.weeklyDoseMg;
      return {
        ...state,
        weeklyDoseMg: newDose,
        recommendations: state.recommendations.map((r) =>
          r.id === action.recommendationId ? { ...r, status: "confirmed_by_clinic" } : r
        ),
      };
    }

    case "send_patient_message": {
      const latestRec = state.recommendations[0];
      const reply = answerChatQuery(action.text, {
        indication: state.indication,
        latestInr: state.inrHistory.at(-1)?.value,
        recommendation: latestRec?.recommendation,
        clinicianApproved: latestRec?.status === "confirmed_by_clinic",
      });
      const patientMsg: ChatMessage = { id: uid("msg"), from: "patient", text: action.text, at: new Date().toISOString() };
      const assistantMsg: ChatMessage = {
        id: uid("msg"),
        from: "assistant",
        text: reply.text,
        at: new Date().toISOString(),
        urgent: reply.urgent,
        escalated: reply.escalateToClinician,
      };
      return { ...state, chatMessages: [...state.chatMessages, patientMsg, assistantMsg] };
    }

    default:
      return state;
  }
}

interface StoreContextValue {
  state: PatientState;
  addInrReading: (value: number) => void;
  confirmRecommendation: (recommendationId: string) => void;
  sendPatientMessage: (text: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function PatientStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialPatientState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          dispatch({ type: "hydrate", state: JSON.parse(raw) });
        } catch {
          // ignore corrupt storage, keep defaults
        }
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      addInrReading: (value) => dispatch({ type: "add_inr", value }),
      confirmRecommendation: (recommendationId) => dispatch({ type: "confirm_recommendation", recommendationId }),
      sendPatientMessage: (text) => dispatch({ type: "send_patient_message", text }),
    }),
    [state]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePatientStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("usePatientStore must be used within PatientStoreProvider");
  return ctx;
}
