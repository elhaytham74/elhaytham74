/**
 * Shared types for the warfarin dosing engine.
 *
 * IMPORTANT — CLINICAL SAFETY NOTICE
 * This engine implements commonly published, general-population thresholds
 * synthesized from CHEST/ACCP ("Evidence-Based Management of Anticoagulant
 * Therapy", Holbrook et al., Chest 2012), ACC/AHA (2019 AF guideline; 2020
 * valvular heart disease guideline) and ESC (2020 AF guideline) sources.
 * It is decision-support only: every recommendation carries
 * `requiresClinicianApproval: true` and must be reviewed by a licensed
 * prescriber/anticoagulation clinician before being acted on or relayed to
 * a patient. It is not a substitute for individualized clinical judgment,
 * local institutional protocol, or emergency care.
 */

export type Indication =
  | "atrial_fibrillation"
  | "vte_treatment" // DVT/PE, first event
  | "vte_recurrent_on_warfarin"
  | "mechanical_valve_aortic_bileaflet_low_risk"
  | "mechanical_valve_aortic_high_risk"
  | "mechanical_valve_mitral"
  | "mechanical_valve_older_generation"
  | "antiphospholipid_syndrome";

export interface TargetInrRange {
  low: number;
  high: number;
  /** Midpoint, provided for convenience. */
  target: number;
}

export interface PatientFactors {
  ageYears?: number;
  weightKg?: number;
  /** Hepatic impairment increases sensitivity to warfarin. */
  hepaticImpairment?: boolean;
  /** e.g. heart failure, malnutrition, active infection, thyroid disease */
  highSensitivityRiskFactors?: boolean;
  /** Concomitant interacting medications (antibiotics, amiodarone, etc.) */
  interactingMedications?: boolean;
  /** Known or suspected CYP2C9 / VKORC1 sensitivity, if genotyped */
  geneticSensitivityKnown?: boolean;
  /** Any active or recent clinically significant bleeding */
  activeBleeding?: boolean;
  /** Patient-reported high bleeding risk (e.g. HAS-BLED high) */
  highBleedingRisk?: boolean;
}

export type DoseActionType =
  | "continue_same_dose"
  | "increase_dose"
  | "decrease_dose"
  | "hold_doses"
  | "hold_and_decrease"
  | "hold_and_seek_urgent_care"
  | "seek_emergency_care";

export interface DoseRecommendation {
  action: DoseActionType;
  /** New total weekly dose in mg, if applicable. */
  newWeeklyDoseMg?: number;
  /** Previous total weekly dose in mg. */
  previousWeeklyDoseMg?: number;
  /** Signed percent change applied to weekly dose (e.g. -10 for a 10% cut). */
  percentChange?: number;
  /** Number of upcoming scheduled doses to omit/hold, if any. */
  dosesToHold?: number;
  /** Suggested oral vitamin K per CHEST guidance, if indicated (mg). Clinician must confirm. */
  vitaminKSuggestionMg?: number;
  /** Days until next INR recheck is recommended. */
  nextCheckDays: number;
  /** Human-readable rationale citing the guideline logic used. */
  rationale: string;
  /** Non-exhaustive list of safety flags raised by this recommendation. */
  flags: string[];
  /** True if this scenario requires immediate/emergency escalation, not routine dosing. */
  urgent: boolean;
  /** Always true — enforced everywhere a recommendation is produced. */
  requiresClinicianApproval: true;
}

export interface InrReading {
  value: number;
  takenAt: string; // ISO date
}

export interface TabletStrength {
  mg: number;
}

export interface DailyDosePlanEntry {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  doseMg: number;
}
