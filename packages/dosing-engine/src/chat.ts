import type { DoseRecommendation, Indication } from "./types";
import { INDICATION_LABELS } from "./indications";

export interface ChatContext {
  indication: Indication;
  latestInr?: number;
  recommendation?: DoseRecommendation;
  /** Whether a clinician has already approved `recommendation` for this patient. */
  clinicianApproved?: boolean;
}

export interface ChatReply {
  text: string;
  urgent: boolean;
  /** True if this reply should also be routed to the clinical team as a priority message. */
  escalateToClinician: boolean;
}

const EMERGENCY_KEYWORDS = [
  "chest pain",
  "coughing blood",
  "cough up blood",
  "vomiting blood",
  "blood in vomit",
  "black stool",
  "bloody stool",
  "severe headache",
  "worst headache",
  "can't stop bleeding",
  "cannot stop bleeding",
  "heavy bleeding",
  "fainted",
  "stroke",
  "weakness on one side",
  "slurred speech",
  "severe bleeding",
  "blood in urine",
  "coughing up blood",
];

const BLEEDING_KEYWORDS = ["bruising", "bruise", "nosebleed", "gums bleeding", "blood in", "bleeding"];

/**
 * Deterministic, guideline-grounded chat responder.
 *
 * This is intentionally NOT a free-form generative assistant for dosing
 * decisions: every dosing-related answer is derived from the engine's own
 * `DoseRecommendation`, not invented at chat time, and any answer touching a
 * dose change is explicitly labeled as pending clinician approval. Emergency
 * keyword detection always takes priority over any other response.
 *
 * A natural-language model MAY be layered on top of this to rephrase/route
 * free-text input, but it must call into this module (or an equivalent
 * guarded layer) for anything about dose, continuation, or stopping —
 * it must never generate a dose recommendation itself.
 */
export function answerChatQuery(query: string, ctx: ChatContext): ChatReply {
  const q = query.toLowerCase();

  if (EMERGENCY_KEYWORDS.some((k) => q.includes(k))) {
    return {
      text:
        "This could be a medical emergency. Please stop and get urgent help now: call your local emergency number " +
        "or go to the nearest emergency department. Do not wait for a chat reply. If you can, bring your warfarin " +
        "and most recent INR result with you.",
      urgent: true,
      escalateToClinician: true,
    };
  }

  if (BLEEDING_KEYWORDS.some((k) => q.includes(k))) {
    return {
      text:
        "Any new bruising or bleeding while on warfarin should be reported to your anticoagulation clinic today, even if it " +
        "seems minor. I've flagged this for your care team to review. If bleeding is heavy, won't stop, or you feel unwell " +
        "(dizzy, faint, chest pain), treat it as an emergency and seek urgent care immediately.",
      urgent: false,
      escalateToClinician: true,
    };
  }

  if (/(stop|discontinue|quit).*(warfarin|medication|pill|tablet)/.test(q) || q.includes("should i stop")) {
    return {
      text:
        "I can't tell you to stop warfarin on my own — stopping it without medical guidance can raise your risk of " +
        `blood clots (you're taking it for: ${INDICATION_LABELS[ctx.indication]}). ` +
        "Only your prescriber or anticoagulation clinic can approve stopping or pausing it, for example before surgery " +
        "or a procedure. I've sent your question to your care team.",
      urgent: false,
      escalateToClinician: true,
    };
  }

  if (q.includes("miss") && (q.includes("dose") || q.includes("pill") || q.includes("tablet"))) {
    return {
      text:
        "General guidance for a missed warfarin dose: if it's within about 8 hours of your usual time, take it as soon " +
        "as you remember. If it's later than that or almost time for your next dose, skip the missed dose — do not " +
        "double up the next day. Always log the missed dose in the app and mention it at your next INR check, since it " +
        "can affect your result. This is general information, not a substitute for your clinic's specific instructions.",
      urgent: false,
      escalateToClinician: false,
    };
  }

  if ((q.includes("why") && (q.includes("dose") || q.includes("change"))) || q.includes("explain")) {
    if (ctx.recommendation) {
      const r = ctx.recommendation;
      const status = ctx.clinicianApproved
        ? "This has been reviewed and approved by your care team."
        : "This recommendation is still pending review by your care team — please don't change your dose until you hear from them.";
      return {
        text: `${r.rationale} ${status}`,
        urgent: r.urgent,
        escalateToClinician: false,
      };
    }
    return {
      text:
        "I don't have a current recommendation on file for you yet. Please log your latest INR result, or contact your " +
        "anticoagulation clinic if you're expecting a dose update.",
      urgent: false,
      escalateToClinician: false,
    };
  }

  if (q.includes("vitamin k") || q.includes("diet") || q.includes("green vegetable") || q.includes("leafy")) {
    return {
      text:
        "Warfarin works by blocking vitamin K, so sudden large changes in vitamin K intake (leafy greens, some oils) can " +
        "shift your INR. You don't need to avoid these foods — aim to keep your intake fairly consistent week to week " +
        "rather than cutting them out or suddenly eating a lot more. Tell your clinic about major diet changes, new " +
        "supplements, or new medications, since several interact with warfarin.",
      urgent: false,
      escalateToClinician: false,
    };
  }

  return {
    text:
      "I can help with general warfarin questions (missed doses, diet/vitamin K, why your dose changed) and I'll flag " +
      "anything urgent to your care team, but I can't independently start, stop, or change your dose — only your " +
      "prescriber or anticoagulation clinic can approve that. For anything I'm not sure about, I'll pass it on to them.",
    urgent: false,
    escalateToClinician: false,
  };
}
