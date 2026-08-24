import { describe, expect, it } from "vitest";
import { scheduleWeeklyDose } from "../scheduler";

describe("scheduleWeeklyDose", () => {
  it("produces a single flat daily dose when the weekly total divides evenly", () => {
    const { plan, achievedWeeklyDoseMg } = scheduleWeeklyDose(35); // 5mg/day
    expect(plan).toHaveLength(7);
    expect(plan.every((d) => d.doseMg === 5)).toBe(true);
    expect(achievedWeeklyDoseMg).toBe(35);
  });

  it("alternates daily doses to approximate an uneven weekly total", () => {
    const { plan, achievedWeeklyDoseMg } = scheduleWeeklyDose(37.5); // e.g. 5mg x6 + 7.5mg x1
    expect(plan).toHaveLength(7);
    const total = plan.reduce((sum, d) => sum + d.doseMg, 0);
    expect(Math.round(total * 10) / 10).toBe(achievedWeeklyDoseMg);
    expect(Math.abs(achievedWeeklyDoseMg - 37.5)).toBeLessThanOrEqual(0.5);
  });

  it("throws for non-positive weekly doses", () => {
    expect(() => scheduleWeeklyDose(0)).toThrow();
    expect(() => scheduleWeeklyDose(-5)).toThrow();
  });
});
