# Warfarin Dosing Decision Support App

A prototype clinical decision support system for adjusting warfarin (a
vitamin K antagonist) doses based on INR results, for several common
indications, plus a chat assistant for patients. Built as a **web console for
clinicians/onsite anticoagulation clinics** and a **mobile app for patients**,
sharing one guideline-grounded dosing engine so the numbers never diverge
between the two.

> **This is clinical decision support software, not an autonomous prescriber.**
> Every dose suggestion is generated from published thresholds and must be
> reviewed and approved by a licensed clinician before it reaches a patient or
> is acted on. It is a working MVP/demo, not a certified medical device, and
> has not been through clinical validation, regulatory clearance, or a real
> EHR/pharmacy integration. Do not use it to make real dosing decisions.

## Why this design

The task specifically asked for guideline-based warfarin dose adjustment
(ESC/ACC-style) across different indications, with a chat feature giving
"live/personal" advice on continuing, stopping, or changing dose. Two things
drove the architecture:

1. **Safety model — clinician-reviewed decision support.** The dosing engine
   never pushes a dose change straight to a patient. Every recommendation
   carries `requiresClinicianApproval: true` in its type, the web console
   requires a named clinician sign-off before a recommendation is applied,
   and the mobile app has no way for a patient to self-approve a dose change.
   The chat assistant is a **deterministic, rule-based responder grounded in
   the engine's own output** — it explains *why* a recommendation was made,
   never invents a dose, always defers "stop/start" decisions to the care
   team, and hard-escalates on emergency keywords (chest pain, coughing
   blood, severe/uncontrolled bleeding, stroke symptoms, etc.) ahead of
   anything else. This avoids an unsupervised LLM handing out anticoagulant
   dosing advice, which is a real patient-safety hazard.
2. **One engine, two apps.** `packages/dosing-engine` is a framework-free
   TypeScript library with no UI code. Both apps import it directly so the
   clinic and the patient are always looking at output from the same logic.

## Clinical sources

Thresholds and target ranges are synthesized from commonly used,
publicly documented anticoagulation-management guidance:

- **CHEST/ACCP** — Holbrook A, et al. *"Evidence-Based Management of
  Anticoagulant Therapy."* Chest. 2012;141(2 Suppl):e152S-e184S. (Initiation
  nomogram and out-of-range INR management thresholds.)
- **ACC/AHA/HRS 2019** atrial fibrillation guideline and **ESC 2020** AF
  guideline (target INR 2.0–3.0 for non-valvular AF).
- **ACC/AHA 2020** valvular heart disease guideline (mechanical valve target
  INR by valve type/position/risk factors).
- General VTE treatment target INR (2.0–3.0) per CHEST VTE guidance.

**These are general-population defaults for a demo, not a substitute for
institutional protocol.** Real anticoagulation clinics individualize targets
and thresholds (bleeding risk, indication specifics, genetics, interacting
drugs) — the engine exposes `PatientFactors` and flags several of these
(`SPECIALIST_REVIEW_INDICATIONS`, sensitivity flags in `initiation.ts`) but a
clinician must still make the call.

## Repository layout

```
packages/dosing-engine/   Shared TypeScript logic (no UI). Unit tested.
  src/indications.ts        Indication -> target INR range table
  src/initiation.ts         Warfarin-naive starting dose guidance
  src/maintenance.ts        INR -> dose adjustment nomogram (the core logic)
  src/scheduler.ts          Weekly mg total -> practical daily tablet plan
  src/chat.ts                Deterministic, engine-grounded chat responder
  src/__tests__/             Vitest unit tests for all of the above

apps/web/                 Next.js clinician / onsite console
  app/page.tsx               Patient list / triage dashboard
  app/patients/[id]/page.tsx Patient detail: INR entry, recommendation,
                              approval workflow, chat view
  lib/store.ts                Client-side demo state (Zustand + localStorage)

apps/mobile/               Expo (React Native) patient app
  App.tsx                     Home / Log INR / Chat tabs
  src/store.tsx                Local demo state (AsyncStorage)
  src/screens/                 HomeScreen, LogInrScreen, ChatScreen
```

## Indications covered

`atrial_fibrillation`, `vte_treatment` (first DVT/PE), `vte_recurrent_on_warfarin`,
`mechanical_valve_aortic_bileaflet_low_risk`, `mechanical_valve_aortic_high_risk`,
`mechanical_valve_mitral`, `mechanical_valve_older_generation`,
`antiphospholipid_syndrome` — see `packages/dosing-engine/src/indications.ts`
for target ranges and citations.

## The maintenance dosing logic, in brief

Given an INR, target range, and current weekly dose, `getMaintenanceAdjustment`
returns one of: continue, increase, decrease, hold, hold+decrease, or urgent/
emergency escalation — each with a weekly-dose delta, a next-INR-check
interval, human-readable rationale, and safety flags. Highlights:

- **Active/significant bleeding, any INR** → immediate emergency escalation,
  no routine dose suggested.
- **INR ≥ 10** → hold warfarin, oral vitamin K 2.5–5 mg (clinician to
  confirm), recheck in 24h, urgent clinician contact.
- **INR ≥ target-high + 1.5** → hold 1–2 doses, cut weekly dose ~10-15%,
  consider vitamin K if high bleeding risk, recheck in a few days.
- **In range** → continue, recheck in 4 (up to 12) weeks.
- **Below range** → increase 5–20% depending on how far below, recheck in
  1–4 weeks.

Full logic and citations are in `packages/dosing-engine/src/maintenance.ts`.

## Chat assistant behavior

`answerChatQuery` is intentionally rule-based, not a free-form generative
model, for the dosing-relevant parts:

- Emergency keywords (chest pain, coughing/vomiting blood, black stool,
  stroke symptoms, uncontrolled bleeding, etc.) always win and tell the
  patient to seek emergency care immediately.
- Bleeding/bruising reports are escalated to the care team.
- "Should I stop warfarin?" never gets a yes — it explains the clotting risk
  for the patient's indication and routes the question to the clinician.
- "Why did my dose change?" answers using the *actual* stored
  `DoseRecommendation.rationale`, labeled pending or clinician-approved.
- Missed-dose and vitamin K/diet questions get general, non-dosing
  educational answers.
- Anything else gets a safe fallback that says what the assistant can and
  can't do and that it will pass the question to the care team.

A natural-language layer could be added on top for free-text understanding,
but it should call into this module (or an equivalently guarded one) for
anything about dose, continuation, or stopping — never generate a
recommendation itself.

## Running it

### Engine tests

```bash
npm install
npm run test:engine
```

### Web console (clinician/onsite)

```bash
cd apps/web
npm install   # already done via root workspace install
npm run dev   # http://localhost:3000
```

Demo data seeds 3 fictional patients. Log an INR on a patient page to
generate a recommendation, then approve/modify/reject it as the "clinician"
(a name field simulates sign-off) — only then does the dose change and the
chat assistant treat it as approved. State persists to `localStorage` only;
there is no backend/database/auth in this MVP.

### Mobile app (patient)

```bash
cd apps/mobile
npm install
npm run start   # opens Expo dev tools; press i/a/w for iOS/Android/web
```

Single demo patient, state persisted locally via AsyncStorage. Since there is
no shared backend between the two apps in this MVP, the mobile "Log INR"
screen includes a clearly-labeled demo-only button to simulate the clinic
confirming a recommendation (in production this would arrive via the same
backend the web console writes to, e.g. a push notification once the
clinician approves).

## Known limitations / what a production version needs

- **No backend, no auth, no persistence beyond browser/device local storage.**
  A real deployment needs a proper API + database, clinician authentication
  (with audit logging of who approved what), and the two apps talking to the
  same source of truth instead of independent local demo state.
- **No regulatory/clinical validation.** Institutional review, individualized
  protocols, and likely regulatory classification (e.g. as clinical decision
  support / SaMD depending on jurisdiction) are required before real use.
- **Dev-dependency vulnerabilities:** `npm audit` flags some transitive
  dev/build-time packages (Next.js's bundled `postcss`/`sharp`, Vitest's dev
  server, and the usual long tail in the Expo/Metro toolchain) — these are
  build tooling, not code shipped to end users, but should be revisited
  (`npm audit`, `npx expo-doctor`) before any production hardening.
- **Chat is not connected to a real messaging/notification backend** — in
  production, `escalateToClinician` events should page the on-call
  anticoagulation team, not just sit in local state.
