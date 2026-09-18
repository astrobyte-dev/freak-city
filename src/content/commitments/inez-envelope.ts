import type { GameState } from "../../engine/types";

// One authored situation. Availability is an existing fixed schedule, not an errand timer.
export const envelopeCare = {
  id: "inez-envelope-care",
  npc: "inez" as const,
  object: "envelope",
  surface: "ledge",
  room: "vestibule",
  windows: [
    [0, 1455 * 60],
    [1478 * 60, 1620 * 60],
  ],
  availability: (s: GameState) =>
    s.npcs.inez.location !== "vestibule"
      ? undefined
      : s.time < 1455
        ? 1455 * 60
        : s.time >= 1478 && s.time < 1620
          ? 1620 * 60
          : undefined,
  quote: (due: string, limit: string) =>
    `On the dry ledge, closed. Collect it before ${due}. I leave at ${limit}. Is that all right?`,
  confirm: (due: string) =>
    `Agreed. Collect it before ${due}. I'll leave it closed.`,
  terms: (due: string, limit: string, status?: string) =>
    `Collection before ${due}. Watching ends at ${limit}. ${{ unverified: "That is what we agreed. I have no verified collection to add.", active: "Collection is still due.", fulfilled: "You collected it on time.", missed: "The time passed without collection.", "collected-late": "You collected it late.", cancelled: "We ended the arrangement." }[status ?? ""] ?? "You haven't accepted yet."}`,
  alreadyAgreed: (due: string) => `We're already agreed: before ${due}.`,
  availabilityRefusal: (limit: string) =>
    limit === "00:15"
      ? "I leave at quarter past. I can't promise beyond that."
      : `I leave at ${limit}. I can't promise beyond that.`,
  thanks: "You're welcome. The terms stay as we agreed.",
  closed: "Closed, as agreed. That doesn't change the collection time.",
  nothingToCancel: "There's no unfinished arrangement to cancel.",
  clarifyCancellation: "Do you want to end the envelope arrangement?",
  clarifyRevisionChoice:
    "Do you mean no extra time, or should I stop watching the envelope?",
  declinedRevision: (due: string, missed: boolean) =>
    `All right. No extension. Our original collection time is still before ${due}.${missed ? " That time has passed." : ""}`,
  keepArrangement: "All right. The arrangement stays as we agreed.",
  notCollectedReport: "I heard you. That doesn't settle where it is now.",
  clarifyAcceptance: "What are you agreeing to? Tell me which part.",
  clarifySubject:
    "Do you mean your envelope, or something else? Please say what you want to change or report.",
  objectReference:
    /^(?:(?:my|the|this|that) )?(?:closed |black |closed black )?envelope$/,
  agreementReference:
    /^(?:(?:our|the|this|that|my) )?(?:original )?(?:envelope )?(?:arrangement|agreement|safekeeping|time|collection time|agreed time|agreed collection time|deadline)$/,
  revisionReference:
    /^(?:(?:the|this|that|your) )?(?:proposed )?(?:extension|extra time|new time|revised time|new deadline)$/,
  expiredOffer: "That time no longer works. We'll need to agree fresh terms.",
  missedDuringAcceptance: "The original time passed before we agreed a change.",
  noTerms: "Ask me to watch it first, so we know what we're agreeing to.",
  cannotExtend: "We can't extend that agreement now. You can still collect it.",
  clarifyDuration: "How much more time do you mean?",
  tooSoon:
    "That doesn't leave time to agree and collect it. Keep it with you, or suggest a later time.",
  alreadyWithinTime:
    "That's already within our agreed time. You can collect it earlier.",
  missedDuringRequest:
    "Our original time passed while we were talking. It hasn't been extended.",
  apologyRemembered: "I heard your apology. The original time still matters.",
  nothingToApologise: "There's no missed collection time to apologise for.",
  noAgreement: "We haven't agreed to leave anything here.",
  finished: "We have already made one arrangement. I can't take on another.",
  maraReport: "Then go when you said. I can finish this.",
  request: /\b(?:keep|watch|hold|look after|leave|safekeeping)\b/,
  objectWords: /\b(?:envelope|it|this|that)\b/,
  nonRomantic: "Company is welcome. Romance isn't what I'm offering.",
  accepted: "All right. On the ledge, closed. Come back before I leave.",
  refused: "All right. Keep it with you.",
  unavailable: "I can't watch it now. Keep it with you.",
  tooLate: "I leave at quarter past. I can't promise beyond that.",
  collected: "Back when you said. Thank you.",
  collectedAfterCancellation: "You have it back.",
  late: "You have it now. We had agreed an earlier time.",
  cancelled:
    "All right. I'm no longer watching it. Collect it if you've left it here.",
  reminder: "Our time is up. Are you collecting the envelope?",
  apology: "I heard you. Have you collected it?",
  repaired: "You have it now. Next time, tell me sooner.",
  contradicted: "It's still on the ledge. I can see it.",
  reported: "That's your account. I didn't see you collect it.",
  callback: {
    fulfilled: "You came back when you said. Thank you.",
    revised: "You checked the time with me instead of leaving me guessing.",
    missed: "Your envelope was still there when our time was up.",
    uncertain:
      "The ledge was empty when I returned. Did you collect your envelope?",
    stillHere: "Your envelope was still here when I came back.",
    unverified: "I haven't verified where the envelope went.",
    late: "You collected it late. I remember the original time too.",
    repaired: "You came back to put that right. I remember that too.",
    cancelled: "You told me the arrangement had changed. That helped.",
  },
};
export const commitmentTemplates = [envelopeCare];
