import type { DoseRecommendation, PatientFactors, TargetInrRange } from "./types";

function round(value: number, step = 0.5): number {
  return Math.round(value / step) * step;
}

function pctChange(weeklyDoseMg: number, percent: number): number {
  return round(weeklyDoseMg * (1 + percent / 100));
}

/**
 * Maintenance-phase dose adjustment for a patient already stabilized on warfarin.
 *
 * Thresholds synthesize commonly used anticoagulation-clinic nomograms and the
 * CHEST 2012 guideline ("Evidence-Based Management of Anticoagulant Therapy",
 * Holbrook et al.) on management of out-of-range INR:
 *
 *  - INR far below range:        increase weekly dose ~10-20%, recheck 1-2 wks
 *  - INR mildly below range:     increase weekly dose ~5-10%,  recheck 2-4 wks
 *  - INR in range:               continue dose,                recheck 4-12 wks
 *  - INR mildly above range:     decrease weekly dose ~5-10%,  recheck 1-2 wks
 *  - INR above range, <4.5 (using AF/VTE-style ranges), no bleeding:
 *                                decrease weekly dose ~10-15%, consider holding
 *                                1 dose, recheck within a week
 *  - INR 4.5-9.9, no significant bleeding:
 *                                hold 1-2 doses, decrease weekly dose ~10-15%,
 *                                consider vitamin K 1-2.5 mg PO if high bleeding
 *                                risk, recheck within 1-3 days
 *  - INR ≥10, no significant bleeding:
 *                                hold warfarin, vitamin K 2.5-5 mg PO, recheck
 *                                within 24 hours, urgent clinician contact
 *  - Any INR with active/significant bleeding, or very high INR with any
 *    bleeding signs: emergency escalation — this engine will NOT suggest a
 *    routine dose, it directs to immediate/emergency care.
 *
 * All numeric thresholds are general defaults; local protocols and individual
 * bleeding/clotting risk must be factored in by the reviewing clinician.
 */
export function getMaintenanceAdjustment(
  currentInr: number,
  targetRange: TargetInrRange,
  currentWeeklyDoseMg: number,
  factors: PatientFactors = {}
): DoseRecommendation {
  const flags: string[] = [];
  const { low, high } = targetRange;

  if (factors.activeBleeding) {
    return {
      action: "seek_emergency_care",
      previousWeeklyDoseMg: currentWeeklyDoseMg,
      nextCheckDays: 0,
      rationale:
        "Active or significant bleeding reported. Warfarin dosing guidance does not apply — this requires immediate emergency evaluation (hold warfarin, urgent reversal assessment).",
      flags: ["ACTIVE_BLEEDING", "EMERGENCY"],
      urgent: true,
      requiresClinicianApproval: true,
    };
  }

  if (currentInr >= 10) {
    return {
      action: "hold_and_seek_urgent_care",
      previousWeeklyDoseMg: currentWeeklyDoseMg,
      vitaminKSuggestionMg: 5,
      nextCheckDays: 1,
      rationale:
        "INR ≥ 10 with no significant bleeding: hold warfarin, oral vitamin K 2.5-5 mg per CHEST guidance, recheck INR within 24 hours, and contact the anticoagulation clinic/prescriber urgently today.",
      flags: ["VERY_HIGH_INR", "URGENT_CLINICIAN_CONTACT"],
      urgent: true,
      requiresClinicianApproval: true,
    };
  }

  if (currentInr >= high + 1.5) {
    // e.g. INR 4.5+ over a 2.0-3.0 range
    return {
      action: "hold_and_decrease",
      previousWeeklyDoseMg: currentWeeklyDoseMg,
      newWeeklyDoseMg: pctChange(currentWeeklyDoseMg, -12.5),
      percentChange: -12.5,
      dosesToHold: factors.highBleedingRisk ? 2 : 1,
      vitaminKSuggestionMg: factors.highBleedingRisk ? 1.5 : undefined,
      nextCheckDays: 3,
      rationale:
        "INR substantially above target with no significant bleeding: hold 1-2 doses, reduce weekly dose ~10-15%, consider low-dose oral vitamin K if high bleeding risk, and recheck within a few days.",
      flags: ["HIGH_INR"],
      urgent: true,
      requiresClinicianApproval: true,
    };
  }

  if (currentInr > high) {
    return {
      action: "decrease_dose",
      previousWeeklyDoseMg: currentWeeklyDoseMg,
      newWeeklyDoseMg: pctChange(currentWeeklyDoseMg, -10),
      percentChange: -10,
      dosesToHold: currentInr > high + 0.5 ? 1 : 0,
      nextCheckDays: 7,
      rationale:
        "INR above target range but < target+1.5, no bleeding: reduce weekly dose ~5-10%" +
        (currentInr > high + 0.5 ? ", consider holding one dose, " : ", ") +
        "and recheck INR within about a week.",
      flags: [],
      urgent: false,
      requiresClinicianApproval: true,
    };
  }

  if (currentInr >= low && currentInr <= high) {
    return {
      action: "continue_same_dose",
      previousWeeklyDoseMg: currentWeeklyDoseMg,
      newWeeklyDoseMg: currentWeeklyDoseMg,
      percentChange: 0,
      nextCheckDays: 28,
      rationale:
        "INR is within target range. Continue current dose. Routine recheck in 4 weeks if stable (clinician may extend up to 12 weeks for a long-stable patient per local protocol).",
      flags: [],
      urgent: false,
      requiresClinicianApproval: true,
    };
  }

  if (currentInr >= low - 0.3) {
    return {
      action: "increase_dose",
      previousWeeklyDoseMg: currentWeeklyDoseMg,
      newWeeklyDoseMg: pctChange(currentWeeklyDoseMg, 7.5),
      percentChange: 7.5,
      nextCheckDays: 14,
      rationale:
        "INR mildly below target range: increase weekly dose ~5-10% and recheck INR in 2 weeks.",
      flags: [],
      urgent: false,
      requiresClinicianApproval: true,
    };
  }

  // Far below range
  flags.push("LOW_INR");
  return {
    action: "increase_dose",
    previousWeeklyDoseMg: currentWeeklyDoseMg,
    newWeeklyDoseMg: pctChange(currentWeeklyDoseMg, 15),
    percentChange: 15,
    nextCheckDays: 10,
    rationale:
      "INR well below target range: increase weekly dose ~10-20% (consider a one-time booster dose per clinician judgment) and recheck INR within 1-2 weeks. Assess adherence and interacting factors (diet, medications, illness).",
    flags,
    urgent: false,
    requiresClinicianApproval: true,
  };
}
