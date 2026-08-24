import type { Indication, TargetInrRange } from "./types";

/**
 * Default target INR ranges by indication.
 *
 * Sources (general population defaults — always individualize):
 * - Atrial fibrillation (non-valvular): 2.0-3.0 (ACC/AHA/HRS 2019; ESC 2020 AF guideline)
 * - VTE treatment (first DVT/PE): 2.0-3.0 (CHEST 2012/2016)
 * - Recurrent VTE while therapeutic on warfarin: clinicians often raise to 2.5-3.5
 *   or switch agents/add mechanism — flagged for mandatory specialist review.
 * - Mechanical valves: per ACC/AHA 2020 VHD guideline —
 *     bileaflet/Medtronic Hall aortic valve, no risk factors: 2.0-3.0 (target 2.5)
 *     aortic valve + risk factor(s), or older-generation valve, or mitral valve: 2.5-3.5 (target 3.0)
 * - Antiphospholipid syndrome: 2.0-3.0 standard; higher intensity (3.0-4.0) only
 *   for recurrent thrombosis on therapeutic warfarin, per specialist/EULAR guidance —
 *   always requires specialist input, engine defaults to standard range and flags it.
 */
const RANGES: Record<Indication, TargetInrRange> = {
  atrial_fibrillation: { low: 2.0, high: 3.0, target: 2.5 },
  vte_treatment: { low: 2.0, high: 3.0, target: 2.5 },
  vte_recurrent_on_warfarin: { low: 2.5, high: 3.5, target: 3.0 },
  mechanical_valve_aortic_bileaflet_low_risk: { low: 2.0, high: 3.0, target: 2.5 },
  mechanical_valve_aortic_high_risk: { low: 2.5, high: 3.5, target: 3.0 },
  mechanical_valve_mitral: { low: 2.5, high: 3.5, target: 3.0 },
  mechanical_valve_older_generation: { low: 2.5, high: 3.5, target: 3.0 },
  antiphospholipid_syndrome: { low: 2.0, high: 3.0, target: 2.5 },
};

export const INDICATION_LABELS: Record<Indication, string> = {
  atrial_fibrillation: "Atrial fibrillation (non-valvular)",
  vte_treatment: "VTE treatment (DVT/PE) — first event",
  vte_recurrent_on_warfarin: "Recurrent VTE while therapeutic on warfarin",
  mechanical_valve_aortic_bileaflet_low_risk: "Mechanical aortic valve (bileaflet, no risk factors)",
  mechanical_valve_aortic_high_risk: "Mechanical aortic valve with risk factor(s)",
  mechanical_valve_mitral: "Mechanical mitral valve",
  mechanical_valve_older_generation: "Older-generation mechanical valve (ball-cage/tilting disc)",
  antiphospholipid_syndrome: "Antiphospholipid syndrome",
};

/** Indications where the default range is a starting point only and specialist
 * review of the target itself (not just the dose) is strongly recommended. */
export const SPECIALIST_REVIEW_INDICATIONS: ReadonlySet<Indication> = new Set([
  "vte_recurrent_on_warfarin",
  "antiphospholipid_syndrome",
  "mechanical_valve_older_generation",
]);

export function getIndicationTargetRange(indication: Indication): TargetInrRange {
  const range = RANGES[indication];
  if (!range) {
    throw new Error(`Unknown indication: ${indication}`);
  }
  return range;
}
