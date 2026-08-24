import type { PatientFactors } from "./types";

export interface InitiationRecommendation {
  startingDailyDoseMg: number;
  rationale: string;
  flags: string[];
  /** INR should first be checked on this day of therapy. */
  firstInrCheckDay: number;
  requiresClinicianApproval: true;
}

/**
 * Starting-dose guidance for a warfarin-naive patient.
 *
 * Based on commonly used initiation nomograms (e.g. the 5 mg/10 mg initiation
 * protocols summarized in CHEST 2012 guidance): most outpatients are started
 * on a standard dose, with reduced starting doses for patients who are
 * elderly, frail, hepatically impaired, malnourished/heart-failure, on
 * interacting medications, or of low body weight, reflecting their higher
 * expected sensitivity to warfarin. Genotype-guided dosing (CYP2C9/VKORC1),
 * where available, should take precedence over this generic table — flagged
 * below when relevant.
 *
 * This is a starting point only; INR must be rechecked and the dose titrated
 * per the maintenance nomogram. Never used for re-loading/urgent reversal.
 */
export function getInitiationRecommendation(factors: PatientFactors = {}): InitiationRecommendation {
  const flags: string[] = [];
  let dose = 5; // standard starting dose, mg/day

  const isElderly = (factors.ageYears ?? 0) >= 65;
  const lowWeight = (factors.weightKg ?? 100) < 50;
  const sensitive =
    isElderly ||
    lowWeight ||
    factors.hepaticImpairment ||
    factors.highSensitivityRiskFactors ||
    factors.interactingMedications;

  if (sensitive) {
    dose = 2.5;
    flags.push(
      "Reduced starting dose selected due to one or more sensitivity factors (age ≥65, low body weight, hepatic impairment, heart failure/malnutrition, or interacting medications)."
    );
  }

  if (factors.geneticSensitivityKnown) {
    flags.push(
      "Genetic sensitivity (CYP2C9/VKORC1) noted — prefer institutional pharmacogenomic dosing table over this generic starting dose."
    );
  }

  if (factors.activeBleeding) {
    flags.push("Active bleeding reported — do NOT initiate warfarin until cleared by a clinician.");
  }

  return {
    startingDailyDoseMg: dose,
    rationale: sensitive
      ? "Standard initiation would be 5 mg/day; reduced to 2.5 mg/day given sensitivity factors, consistent with CHEST/ACCP initiation guidance."
      : "Standard 5 mg/day starting dose per CHEST/ACCP initiation guidance for an average-risk, warfarin-naive adult.",
    flags,
    firstInrCheckDay: 3,
    requiresClinicianApproval: true,
  };
}
