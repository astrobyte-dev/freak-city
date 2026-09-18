import { favour } from "./interaction-content";
import { hesitation, qualified } from "./interaction-language";
import type {
  InteractionContext,
  InteractionResult,
  ResponseMeaning,
} from "./interaction-model";
import {
  activeInteraction,
  responseMemory,
  setInteraction,
} from "./interactions";
import { sensitiveTopics, speechText, trialText } from "./language";
import type { TrialState } from "./state";

// The opening's shop hook: one small favour from Sable, one answer from
// Vesper, one thanks. Two axes only: history in the observations ledger and
// the agreement in s.agreements. The lines and phrase lists are data in
// interaction-content.ts; the engine calls the two functions below.
type Present = (actor: string) => boolean;
export type Recorder = (
  s: TrialState,
  actor: "sable" | "vesper",
  mode: "heard",
  subject: string,
  detail: string,
  source: string,
) => unknown;

const heardByVesper = (s: TrialState) =>
  s.observations.find(
    (o) =>
      o.actor === "vesper" && o.mode === "heard" && o.subject === favour.id,
  );
const toldSable = (s: TrialState) =>
  s.observations.some(
    (o) => o.actor === "sable" && o.subject === favour.delivered,
  );
const openAgreement = (s: TrialState) =>
  s.agreements.find((a) => a.id === favour.id && a.status === "open");
// Small talk, drinks and the party; never the hospital, the evidence or the
// decision.
const ordinary = (context?: InteractionContext) =>
  !context ||
  (["social", "drink", "roleplay"].includes(context.kind) &&
    !sensitiveTopics.includes(context.topic ?? ""));
const day = (time: number) => Math.floor(time / 1440);
const reply = (
  line: string,
  intent: string,
  meaning: ResponseMeaning,
): InteractionResult => ({ lines: [line], minutes: 2, intent, meaning });

// What the player says: an answer to Sable's open question, a message for
// Vesper at the shop, or telling Sable it was delivered. Anything else
// belongs to the existing handlers.
export function agreementReply(
  s: TrialState,
  raw: string,
  present: Present,
  record: Recorder,
): InteractionResult | undefined {
  const text = trialText(raw);
  if (favour.action.test(text)) return undefined;
  const context = activeInteraction(s);
  if (present("sable") && context?.question?.kind === "favour") {
    // Bare answers only. A sentence about something else keeps its own
    // handler, and the favour stays open until the subject changes.
    const body = speechText(text);
    const answer = favour.accept.test(body)
      ? "accept"
      : hesitation(body) ||
          (/^(?:yes|yeah|sure|ok|okay)\b/.test(body) && qualified(body))
        ? "hesitation"
        : favour.decline.test(body)
          ? "decline"
          : undefined;
    if (!answer) return undefined;
    const meaning: ResponseMeaning = {
      kind: answer === "hesitation" ? "uncertain" : answer,
      interlocutor: "sable",
      subject: "favour",
      entities: [],
    };
    if (answer === "hesitation")
      return {
        lines: [favour.lines.hesitation],
        minutes: 0,
        deferred: true,
        intent: "conversation:hesitation",
        meaning,
      };
    delete context.question;
    context.at = s.time;
    if (answer === "decline")
      return reply(favour.lines.declined, "conversation:decline-favour", {
        ...meaning,
        polarity: "negative",
      });
    s.agreements.push({
      id: favour.id,
      at: s.time,
      observer: "sable",
      words: raw,
      status: "open",
    });
    record(
      s,
      "sable",
      "heard",
      favour.accepted,
      raw,
      "Player agreed to carry a message to Vesper",
    );
    return reply(favour.lines.accepted, "conversation:accept-favour", {
      ...meaning,
      polarity: "positive",
    });
  }
  if (
    present("vesper") &&
    favour.mention.test(text) &&
    !favour.notMessage.test(text) &&
    !favour.relay.test(text) &&
    !favour.toSable.test(text) &&
    !favour.vocativeSable.test(raw)
  ) {
    const first = !heardByVesper(s);
    if (first) {
      record(
        s,
        "vesper",
        "heard",
        favour.id,
        raw,
        "Player's present words at the shop",
      );
      const open = openAgreement(s);
      if (open) {
        open.status = "kept";
        open.keptAt = s.time;
      }
    }
    return reply(
      first ? favour.lines.vesper : favour.lines.vesperAgain,
      "conversation:message",
      {
        kind: "social",
        interlocutor: "vesper",
        subject: "message",
        entities: [],
      },
    );
  }
  if (
    present("sable") &&
    heardByVesper(s) &&
    !toldSable(s) &&
    favour.reminder.test(text) &&
    !favour.toVesper.test(raw) &&
    ordinary(context)
  ) {
    record(
      s,
      "sable",
      "heard",
      favour.delivered,
      raw,
      "Player told Sable the message had reached Vesper",
    );
    return reply(favour.lines.thanks, "conversation:message-delivered", {
      kind: "social",
      interlocutor: "sable",
      subject: "message",
      entities: [],
    });
  }
  return undefined;
}

// What Sable adds after a reply at the bar: the offer, the goodnight line
// or the next-evening acknowledgement. One line at most, never after a
// failure.
export function agreementBeat(
  s: TrialState,
  result: InteractionResult,
  present: Present,
  record: Recorder,
): string[] {
  if (result.failed || s.room !== "bar" || !present("sable")) return [];
  const memory = responseMemory(s);
  const context = activeInteraction(s);
  const offerKey = `sable:${favour.id}:offer`;
  // Once, after the first ordinary exchange of the first evening, before
  // any disclosure, with no question open and Vesper not already answered.
  if (
    !memory.replies[offerKey] &&
    !s.receipt &&
    !result.deferred &&
    /^(?:conversation|service):/.test(result.intent ?? "") &&
    day(s.time) === 0 &&
    !heardByVesper(s) &&
    !context?.question &&
    ordinary(context)
  ) {
    memory.replies[offerKey] = 1;
    const question = { kind: "favour" as const, subject: favour.id };
    if (context) {
      context.question = question;
      context.at = s.time;
    } else setInteraction(s, "sable", "social", "plans", question);
    return [favour.lines.offer];
  }
  const waitKey = `sable:${favour.id}:wait`;
  if (
    result.intent === "conversation:goodbye" &&
    openAgreement(s) &&
    !memory.replies[waitKey]
  ) {
    memory.replies[waitKey] = 1;
    return [favour.lines.canWait];
  }
  const heard = heardByVesper(s);
  if (heard && !toldSable(s) && day(s.time) > day(heard.at)) {
    record(
      s,
      "sable",
      "heard",
      favour.delivered,
      "Vesper mentioned that the message about the smoke machine had reached them.",
      "Vesper told Sable next door",
    );
    return [favour.lines.door];
  }
  return [];
}
