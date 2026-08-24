import { describe, expect, it } from "vitest";
import { answerChatQuery } from "../chat";
import { getMaintenanceAdjustment } from "../maintenance";
import { getIndicationTargetRange } from "../indications";

const ctx = { indication: "atrial_fibrillation" as const };

describe("answerChatQuery", () => {
  it("prioritizes emergency detection over everything else", () => {
    const reply = answerChatQuery("I am coughing up blood and feel dizzy", ctx);
    expect(reply.urgent).toBe(true);
    expect(reply.escalateToClinician).toBe(true);
    expect(reply.text.toLowerCase()).toContain("emergency");
  });

  it("never tells the patient to stop the medication on its own authority", () => {
    const reply = answerChatQuery("Should I stop taking my warfarin?", ctx);
    expect(reply.text.toLowerCase()).not.toMatch(/^yes, stop/);
    expect(reply.escalateToClinician).toBe(true);
  });

  it("escalates bleeding/bruising reports to the clinician", () => {
    const reply = answerChatQuery("I noticed some new bruising on my arm", ctx);
    expect(reply.escalateToClinician).toBe(true);
  });

  it("gives missed-dose guidance without inventing a dose change", () => {
    const reply = answerChatQuery("I missed my dose yesterday, what do I do?", ctx);
    expect(reply.text).toContain("skip the missed dose");
  });

  it("grounds 'why did my dose change' answers in the actual engine recommendation", () => {
    const range = getIndicationTargetRange("atrial_fibrillation");
    const recommendation = getMaintenanceAdjustment(3.4, range, 35);
    const reply = answerChatQuery("why did my dose change?", {
      ...ctx,
      recommendation,
      clinicianApproved: false,
    });
    expect(reply.text).toContain(recommendation.rationale);
    expect(reply.text.toLowerCase()).toContain("pending review");
  });
});
