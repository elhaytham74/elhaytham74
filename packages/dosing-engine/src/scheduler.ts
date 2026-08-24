import type { DailyDosePlanEntry, TabletStrength } from "./types";

const DAYS: DailyDosePlanEntry["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Standard commercially available warfarin tablet strengths (mg). */
export const STANDARD_TABLET_STRENGTHS: TabletStrength[] = [
  { mg: 1 },
  { mg: 2 },
  { mg: 2.5 },
  { mg: 3 },
  { mg: 4 },
  { mg: 5 },
  { mg: 6 },
  { mg: 7.5 },
  { mg: 10 },
];

/**
 * Given a target weekly total dose, produce a practical 7-day tablet plan.
 *
 * Warfarin is commonly dosed as a single daily amount when the weekly total
 * divides evenly by 7 into an available tablet strength (in 0.5-tablet
 * increments); otherwise clinics conventionally alternate between two daily
 * amounts across the week so the weekly total is matched as closely as
 * possible (e.g. 5 mg six days + 7.5 mg one day = 37.5 mg/week). This
 * function reproduces that common convention. The exact split is a
 * clinician-adjustable convenience default, not a clinical requirement.
 */
export function scheduleWeeklyDose(
  weeklyDoseMg: number,
  strengths: TabletStrength[] = STANDARD_TABLET_STRENGTHS
): { plan: DailyDosePlanEntry[]; achievedWeeklyDoseMg: number } {
  if (weeklyDoseMg <= 0) {
    throw new Error("weeklyDoseMg must be positive");
  }

  const smallestIncrement = 0.5; // half-tablet splitting is standard practice
  const roundTo = (v: number) => Math.round(v / smallestIncrement) * smallestIncrement;

  const evenDaily = roundTo(weeklyDoseMg / 7);
  const evenWeekly = round1(evenDaily * 7);

  // If splitting evenly gets us within 2.5% of target, just use one daily dose.
  if (Math.abs(evenWeekly - weeklyDoseMg) / weeklyDoseMg <= 0.025 && evenDaily > 0) {
    return {
      plan: DAYS.map((day) => ({ day, doseMg: evenDaily })),
      achievedWeeklyDoseMg: evenWeekly,
    };
  }

  // Otherwise, alternate between floor and ceil daily amounts to hit the
  // weekly total as closely as possible.
  const lowDaily = Math.floor(weeklyDoseMg / 7 / smallestIncrement) * smallestIncrement;
  const highDaily = lowDaily + smallestIncrement;

  let bestPlan: DailyDosePlanEntry[] | null = null;
  let bestDiff = Infinity;

  for (let highDays = 0; highDays <= 7; highDays++) {
    const lowDays = 7 - highDays;
    const total = round1(highDays * highDaily + lowDays * lowDaily);
    const diff = Math.abs(total - weeklyDoseMg);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestPlan = DAYS.map((day, i) => ({
        day,
        doseMg: i < highDays ? highDaily : lowDaily,
      }));
    }
  }

  const plan = bestPlan!;
  const achievedWeeklyDoseMg = round1(plan.reduce((sum, entry) => sum + entry.doseMg, 0));

  return { plan, achievedWeeklyDoseMg };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
