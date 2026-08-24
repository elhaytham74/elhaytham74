import { describe, expect, it } from "vitest";
import { getMaintenanceAdjustment } from "../maintenance";
import { getIndicationTargetRange } from "../indications";

const afRange = getIndicationTargetRange("atrial_fibrillation"); // 2.0-3.0

describe("getMaintenanceAdjustment", () => {
  it("continues the dose when INR is within range", () => {
    const rec = getMaintenanceAdjustment(2.5, afRange, 35);
    expect(rec.action).toBe("continue_same_dose");
    expect(rec.newWeeklyDoseMg).toBe(35);
    expect(rec.urgent).toBe(false);
    expect(rec.requiresClinicianApproval).toBe(true);
  });

  it("increases dose mildly when INR is slightly below range", () => {
    const rec = getMaintenanceAdjustment(1.8, afRange, 35);
    expect(rec.action).toBe("increase_dose");
    expect(rec.newWeeklyDoseMg).toBeGreaterThan(35);
  });

  it("increases dose more aggressively when INR is far below range", () => {
    const rec = getMaintenanceAdjustment(1.2, afRange, 35);
    expect(rec.action).toBe("increase_dose");
    expect(rec.flags).toContain("LOW_INR");
    expect(rec.percentChange).toBeGreaterThan(10);
  });

  it("decreases dose mildly when INR is slightly above range", () => {
    const rec = getMaintenanceAdjustment(3.3, afRange, 35);
    expect(rec.action).toBe("decrease_dose");
    expect(rec.newWeeklyDoseMg).toBeLessThan(35);
  });

  it("holds and decreases when INR is substantially high", () => {
    const rec = getMaintenanceAdjustment(4.6, afRange, 35);
    expect(rec.action).toBe("hold_and_decrease");
    expect(rec.dosesToHold).toBeGreaterThanOrEqual(1);
    expect(rec.urgent).toBe(true);
  });

  it("flags very high INR (>=10) for urgent care with vitamin K suggestion", () => {
    const rec = getMaintenanceAdjustment(10.5, afRange, 35);
    expect(rec.action).toBe("hold_and_seek_urgent_care");
    expect(rec.vitaminKSuggestionMg).toBe(5);
    expect(rec.urgent).toBe(true);
    expect(rec.nextCheckDays).toBe(1);
  });

  it("escalates to emergency care regardless of INR when active bleeding is reported", () => {
    const rec = getMaintenanceAdjustment(2.5, afRange, 35, { activeBleeding: true });
    expect(rec.action).toBe("seek_emergency_care");
    expect(rec.urgent).toBe(true);
    expect(rec.flags).toContain("EMERGENCY");
  });

  it("always requires clinician approval", () => {
    const scenarios = [0.9, 1.5, 2.5, 3.5, 5.0, 12.0];
    for (const inr of scenarios) {
      const rec = getMaintenanceAdjustment(inr, afRange, 35);
      expect(rec.requiresClinicianApproval).toBe(true);
    }
  });
});
