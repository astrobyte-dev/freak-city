import type { GameState, Passage, NPCId } from "./types";
import type { Command } from "./language";
import type { Entity } from "./world-types";
import { surfaceCommand } from "./natural-language";
import { envelopeCare as t } from "../content/commitments/inez-envelope";
import {
  acceptCare,
  agreementFor,
  clockLabel,
  finishCollection,
  learnSocial,
  recordSocial,
  repairCare,
  socialTime,
  witnessedSurface,
  observeCurrentPossession,
  knownCareStatus,
} from "./commitments";

interface Services {
  tick: (s: GameState, minutes: number, out: Passage[]) => void;
  object: (s: GameState, noun: string) => Entity;
  person: (s: GameState, noun: string) => NPCId;
  syncInventory: (s: GameState) => void;
  fail: (text: string) => never;
}
export interface SocialResult {
  stop?: boolean;
  failed?: boolean;
}

function replyText(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .replace(/^(?:say|tell inez|ask inez|inez,?)\s+/, "")
    .replace(/\s+to inez[.!?]*$/, "")
    .replace(/^"|"[.!?]*$/g, "")
    .replace(/[.!?]+$/, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function requestedTime(raw: string, now: number): number | undefined {
  if (/\bmidnight\b/.test(raw)) return 1440 * 60;
  const clock = raw.match(
    /(?:before|by|at|until)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (clock) {
    if (+clock[1] > 23 || +clock[2] > 59 || +(clock[3] ?? 0) > 59) return NaN;
    const minute = +clock[1] * 60 + +clock[2];
    return (minute < 720 ? 1440 + minute : minute) * 60 + +(clock[3] ?? 0);
  }
  const duration = raw.match(
    /\b(?:in|within|for)\s+(.+?\b(?:minutes?|mins?|seconds?|secs?))\b/,
  );
  if (duration) {
    const parsed = surfaceCommand(`wait ${duration[1]}`);
    return parsed.duration === undefined ||
      parsed.text !== "wait" ||
      parsed.duration <= 0
      ? NaN
      : now + Math.round(parsed.duration * 60);
  }
  return undefined;
}

type ReferenceScope = "care" | "other" | "ambiguous";
/** Resolve the explicit complement before using conversational ellipsis.
 * Unknown named objects never become the envelope just because Inez is listening.
 */
function careReference(
  reference: string | undefined,
  focus: boolean,
  lastObject: string | undefined,
): ReferenceScope {
  const ref = (reference ?? "").trim();
  if (!ref) return focus ? "care" : "ambiguous";
  if (t.objectReference.test(ref) || t.agreementReference.test(ref))
    return "care";
  if (/^(?:it|this|that)$/.test(ref))
    return focus && (!lastObject || lastObject === t.object)
      ? "care"
      : "ambiguous";
  const action = ref.match(
    /^(?:leaving|keeping|watching|holding|collecting|picking up|collect|pick up) (.+?)(?: (?:here|on the ledge|with you))?$/,
  );
  if (action) return careReference(action[1], focus, lastObject);
  // Mixed or qualified care references need a narrower statement, not a guessed action.
  const primary = ref.split(
    /\s+(?:and|or|while|because|with|for|from|after|before|at)\s+/,
  )[0];
  return t.objectReference.test(primary) || t.agreementReference.test(primary)
    ? "ambiguous"
    : "other";
}

/** Bounded intent routing; lifecycle/custody/observations live in commitments.ts. */
export function handleCommitment(
  s: GameState,
  c: Command,
  raw: string,
  out: Passage[],
  api: Services,
): SocialResult | undefined {
  const w = s.world!,
    social = w.social!;
  let a = agreementFor(s);
  const text = replyText(raw);
  const limit = a?.limit ?? social.offer?.limit ?? t.availability(s) ?? 0;
  const named = /\binez\b/i.test(raw);
  const focus =
    social.focus &&
    w.room === t.room &&
    w.lastStatement?.npc === t.npc &&
    w.lastStatement.room === w.room &&
    s.time - w.lastStatement.at <= 20;
  const speechVerb = [
    "ask",
    "tell",
    "say",
    "talk",
    "agree",
    "deny",
    "apologise",
  ].includes(c.verb);
  const addressedOther =
    speechVerb &&
    (c.verb === "say"
      ? c.indirect && !/^(?:inez|her|she)$/.test(c.indirect)
      : /^(mara|celeste|luca)/.test(c.direct));
  const currentSpeaker =
    w.lastStatement?.npc === t.npc &&
    w.lastStatement.room === w.room &&
    s.time - w.lastStatement.at <= 20;
  const addressed = !addressedOther && (named || focus || currentSpeaker);
  const say = (message: string) => {
    out.push({ speaker: t.npc, from: "commitment", text: message });
    social.focus = true;
  };
  const present = () => {
    api.person(s, t.npc);
    if (w.room !== t.room) api.fail("Ask about this at the vestibule ledge.");
  };
  const timed = () => {
    api.tick(s, 1, out);
    if (s.npcs[t.npc].location !== w.room) {
      out.push({
        text: "Inez has left. That conversation wasn't completed; its terms have not changed.",
      });
      return false;
    }
    return true;
  };
  const offer = (due: number, revision = false) => {
    delete social.clarification;
    social.offer = {
      template: t.id,
      at: socialTime(s),
      limit: limit,
      due,
      revision: a?.revisions.length ?? 0,
      ...(revision ? { agreement: a!.id } : {}),
    };
    say(t.quote(clockLabel(due), clockLabel(limit)));
    return { stop: true };
  };
  const eligible = () => {
    if (!t.availability(s) || socialTime(s) + 60 >= limit)
      api.fail(t.unavailable);
    const item = api.object(s, t.object),
      ledge = api.object(s, t.surface);
    if (item.location !== "player")
      api.fail("Keep the envelope in your hands before asking me to watch it.");
    if (item.open !== false)
      api.fail("Close the envelope first if you want it kept closed.");
    if (!ledge.open || ledge.destroyed)
      api.fail("The ledge isn't available for that.");
  };

  // Physical collection is staged even through ordinary TAKE, not just a special reply.
  const collection = /^(?:collect|retrieve|pick up|take back|get back)\b/.test(
    text,
  );
  if (
    a &&
    !c.negated &&
    !c.tentative &&
    (c.verb === "take" || collection) &&
    !speechVerb
  ) {
    const noun = collection
      ? text.replace(/^(?:collect|retrieve|pick up|take back|get back)\s+/, "")
      : c.direct;
    const namesEnvelope =
      /envelope/.test(noun) ||
      (/^(?:it|this|that)$/.test(noun) && w.lastObject === t.object);
    if (!namesEnvelope) return;
    const item = api.object(s, noun);
    if (item.id !== t.object) return;
    if (item.location === "player") api.fail("You already have the envelope.");
    if (item.location !== t.surface || w.room !== t.room) return; // Ordinary custody rules elsewhere.
    api.tick(s, 1, out);
    if (item.destroyed || item.location !== t.surface) {
      out.push({
        text: "The envelope is no longer available to collect here.",
      });
      return { failed: true, stop: true };
    }
    item.location = "player";
    w.lastObject = item.id;
    finishCollection(s, a);
    api.syncInventory(s);
    out.push({ text: "You collect your black envelope from the ledge." });
    if (s.npcs[t.npc].location === w.room)
      say(
        a.status === "cancelled"
          ? t.collectedAfterCancellation
          : a.repairAt !== undefined
            ? t.repaired
            : a.missedAt !== undefined
              ? t.late
              : t.collected,
      );
    delete social.offer;
    delete social.clarification;
    return {};
  }

  // Private claims remain player reports. Mara does not receive Inez's hidden state.
  if (
    c.verb === "tell" &&
    /^(?:mara|mara venn)$/.test(c.direct) &&
    /\binez\b/.test(c.topic) &&
    /\benvelope\b/.test(c.topic)
  ) {
    api.person(s, "mara");
    api.tick(s, 1, out);
    if (s.npcs.mara.location !== w.room) {
      out.push({
        text: "Mara has moved on before you could finish telling her.",
      });
      return { failed: true, stop: true };
    }
    if (
      a &&
      !social.events.some(
        (e) =>
          e.kind === "reported" && e.actor === "player" && e.room === "bar",
      )
    ) {
      const event = recordSocial(
        s,
        a,
        "reported",
        "player",
        `Player said: ${c.topic}`,
      );
      learnSocial(s, event, "mara", "heard");
    }
    s.npcs.mara.beliefs.envelopeReport = {
      value: c.topic,
      source: "Player report; not verified",
      at: s.time,
    };
    out.push({ speaker: "mara", text: t.maraReport });
    social.focus = false;
    return {};
  }
  if (!addressed || c.tentative || ["text", "call"].includes(c.verb)) return;
  if (focus && /^(?:thanks|thank you|cheers|thank inez)$/.test(text)) {
    say(t.thanks);
    return {};
  }

  const accept =
    /^(?:yes(?: please)?|yeah|yep|sure|okay|ok|all right|alright|agreed|i agree|that(?:'s| is) (?:fine|okay|ok)|that works|sounds good|please do)(?:[, ]+(?:thanks|thank you))?$/.test(
      text,
    ) ||
    /^(?:i )?agree to collect (?:my |the )?envelope before \d{1,2}:\d{2}(?::\d{2})?$/.test(
      text,
    );
  const refuse =
    /^(?:no(?: thanks| thank you)?|not now|never mind|nevermind|i(?:'d| would) rather not|i(?:'ll| will) keep it|i don't want to|decline(?: the envelope arrangement)?|don't bother)$/.test(
      text,
    );
  let ambiguous = false;
  const scoped = (match: RegExpMatchArray | null, reference = match?.[1]) => {
    if (!match) return false;
    const scope = careReference(reference, focus, w.lastObject);
    ambiguous ||= scope === "ambiguous";
    return scope === "care";
  };
  // Full clauses expose an explicit object/purpose before context is considered.
  const changeOfMind = text.match(
    /^(?:i(?:'ve| have)? )?(?:changed|change) my mind(?: about (.+))?$/,
  );
  const cancellation =
    changeOfMind ??
    text.match(/^(?:please )?(?:cancel|stop watching)(?: (.+))?$/) ??
    text.match(
      /^i(?:'ll| will) (?:just )?(?:keep|take) (.+) (?:with me|myself)$/,
    );
  const pendingRevision = !!a && social.offer?.agreement === a.id;
  const revisionChoice =
    pendingRevision && focus && social.clarification === "revision-choice";
  const declineRequest = text.match(/^(?:decline|reject|cancel)(?: (.+))?$/);
  const declineRevision =
    pendingRevision &&
    (t.revisionReference.test(declineRequest?.[1] ?? changeOfMind?.[1] ?? "") ||
      (revisionChoice &&
        (t.revisionReference.test(text) ||
          /^(?:no extra time|keep (?:the |our )?original (?:time|deadline))$/.test(
            text,
          ))));
  const cancel =
    !declineRevision &&
    ((focus && social.clarification === "cancellation" && accept) ||
      (revisionChoice && t.agreementReference.test(text)) ||
      (!!declineRequest?.[1] && scoped(declineRequest)) ||
      scoped(cancellation));
  const clarifyRevision =
    pendingRevision &&
    cancel &&
    !!changeOfMind &&
    (!changeOfMind[1] || /^(?:it|this|that)$/.test(changeOfMind[1]));
  const extensionRequest = text.match(
    /^(?:(?:can|could|may) i (?:have|get|take) |i (?:need|want) |(?:please )?(?:give|allow) me )?(more time|(?:a little |a bit )?longer|(?:another |extra )?[a-z\d. ]+? (?:more )?(?:minutes?|mins?|seconds?|secs?)(?: more)?)(?: (?:for|to) (.+))?$/,
  );
  const explicitExtension = text.match(
    /^(?:(?:can|could) (?:you|we) |please )?extend(?: (.+?))?(?: by .+)?$/,
  );
  const durationReply = surfaceCommand(`wait ${text}`);
  const extensionAmount = surfaceCommand(
    `wait ${(extensionRequest?.[1] ?? "").replace(/\b(?:another|extra|more)\b/g, "").trim()}`,
  );
  const extensionForm =
    !!extensionRequest &&
    (/^(?:(?:can|could|may) i (?:have|get|take)|i (?:need|want)|(?:please )?(?:give|allow) me)\b/.test(
      text,
    ) ||
      /^(?:more time|(?:a little |a bit )?longer)$/.test(extensionRequest[1]) ||
      (extensionAmount.text === "wait" &&
        extensionAmount.duration !== undefined));
  const extension =
    (extensionForm && scoped(extensionRequest, extensionRequest?.[2] ?? "")) ||
    scoped(explicitExtension) ||
    (focus &&
      social.clarification === "extension" &&
      durationReply.text === "wait" &&
      durationReply.duration !== undefined);
  const returnProposal = text.match(
    /^(?:i(?:'ll| will)|can i) (?:be back|come back|return|collect|pick up)(?: (.+?))? (?:in|before|by|at|within) (?:\d{1,2}:\d{2}(?::\d{2})?|midnight|[a-z\d. ]+ (?:minutes?|mins?|seconds?|secs?))$/,
  );
  const earlier = scoped(returnProposal);
  const apologyClause = text
    .replace(/^(apologi[sz]e) to inez\b/, "$1")
    .match(
      /^(?:i(?:'m| am) )?(?:sorry|apologi[sz]e)(?: (?:i(?:'m| am) late|for (.+)))?$/,
    );
  const apologySubject = apologyClause?.[1]?.replace(
    /^(?:missing|being late for) /,
    "",
  );
  const apology = scoped(
    apologyClause,
    /^(?:being late|keeping you waiting)$/.test(apologySubject ?? "")
      ? ""
      : apologySubject,
  );
  const collectionReport =
    text.match(
      /^i(?:'ve| have)? (?:already )?(?:collected|picked up|took|got)(?: (.+))?$/,
    ) ?? text.match(/^i(?:'ve| have)? (?:already )?picked (.+) up$/);
  const report = scoped(collectionReport);
  const termsQuery =
    text.match(
      /^(?:terms|arrangement|agreement|what time|what did we agree)(?: (?:for|about) (.+))?$/,
    ) ??
    text.match(/^when (?:should|must|do) i (?:come back|collect)(?: (.+))?$/);
  const query = scoped(termsQuery);
  const closedRequest = text.match(/^don't open(?: (.+))?$/);
  const closed = scoped(closedRequest);
  const careRequest = text.match(
    /^(?:(?:to|can you|can i|could you|could i|would you|will you|please|i want to|i would like to|i'd like you to) )*(?:keep|watch|hold|look after|leave) (.+?)(?: (?:while .+|for me|here|in .+|until .+|before .+|by .+))?$/,
  );
  // Initial requests still use the ordinary object resolver (including pronouns).
  const request =
    !!careRequest &&
    (t.objectReference.test(careRequest[1]) ||
      /^(?:it|this|that|service envelope)$/.test(careRequest[1]));
  if (ambiguous && !c.negated) {
    present();
    say(t.clarifySubject);
    return { stop: true };
  }
  if (!request && !focus && !named) return;
  if (!request && !a && !social.offer && !query) return;
  if (!(
    accept ||
    refuse ||
    cancel ||
    declineRevision ||
    extension ||
    earlier ||
    apology ||
    report ||
    query ||
    request ||
    closed
  ))
    return;
  if (c.negated && !refuse && !cancel && !declineRevision && !closed) return;
  present();
  if (clarifyRevision || (revisionChoice && accept)) {
    social.clarification = "revision-choice";
    say(t.clarifyRevisionChoice);
    return { stop: true };
  }
  // A short answer refers to the question actually asked, not an implicit new offer.
  if (focus && !social.offer && (accept || refuse)) {
    const question = w.lastStatement?.text;
    if (accept && question === t.reminder) {
      return handleCommitment(
        s,
        { ...c, verb: "take", direct: "envelope", negated: false },
        "take envelope",
        out,
        api,
      );
    }
    if (question === t.callback.uncertain || question === t.apology) {
      if (accept) {
        return handleCommitment(
          s,
          { ...c, verb: "tell", direct: "inez", negated: false },
          "tell Inez I collected the envelope",
          out,
          api,
        );
      }
      if (!timed()) return { failed: true, stop: true };
      if (a) {
        const detail =
          "Player reports not having collected the envelope; earlier custody is unverified.";
        if (
          !social.events.some(
            (e) => e.kind === "reported" && e.detail === detail,
          )
        ) {
          const event = recordSocial(s, a, "reported", "player", detail);
          learnSocial(s, event, t.npc, "heard");
        }
        observeCurrentPossession(s, a);
      }
      say(t.notCollectedReport);
      return {};
    }
    if (refuse && social.clarification === "cancellation") {
      delete social.clarification;
      say(t.keepArrangement);
      return {};
    }
  }
  if (closed) {
    say(t.closed);
    return { stop: !!social.offer };
  }
  if (refuse || cancel || declineRevision) {
    if (social.offer && (!pendingRevision || !cancel)) {
      delete social.offer;
      delete social.clarification;
      say(
        pendingRevision
          ? t.declinedRevision(clockLabel(a!.due), a!.missedAt !== undefined)
          : t.refused,
      );
      return {};
    }
    if (
      !a ||
      a.status === "fulfilled" ||
      a.status === "collected-late" ||
      a.status === "cancelled"
    ) {
      say(t.nothingToCancel);
      return {};
    }
    if (!cancel) {
      social.clarification = "cancellation";
      say(t.clarifyCancellation);
      return { stop: true };
    }
    if (!timed()) return { failed: true, stop: true };
    delete social.offer;
    delete social.clarification;
    a.status = "cancelled";
    a.cancelledAt = socialTime(s);
    const event = recordSocial(
      s,
      a,
      "cancelled",
      "player",
      "Explicitly ended the care arrangement; earlier events remain.",
    );
    learnSocial(s, event, t.npc, "heard");
    say(t.cancelled);
    return {};
  }
  if (accept) {
    const pending = social.offer;
    if (!pending || !focus) {
      say(t.clarifyAcceptance);
      return { stop: true };
    }
    const stated = requestedTime(text, socialTime(s));
    if (stated !== undefined && stated !== pending.due) {
      say(t.clarifyAcceptance);
      return { stop: true };
    }
    if (
      pending.due <= socialTime(s) + 60 ||
      pending.limit <= socialTime(s) + 60 ||
      (pending.agreement && a?.status !== "active")
    ) {
      delete social.offer;
      say(t.expiredOffer);
      return { stop: true };
    }
    if (!pending.agreement) eligible();
    if (!timed()) return { failed: true, stop: true };
    if (pending.agreement && a?.status !== "active") {
      delete social.offer;
      say(t.missedDuringAcceptance);
      return { failed: true, stop: true };
    }
    a = acceptCare(s);
    delete social.clarification;
    api.syncInventory(s);
    w.lastObject = t.object;
    say(t.confirm(clockLabel(a.due)));
    return {};
  }
  if (extension || earlier) {
    if (!a && !social.offer) {
      say(t.noTerms);
      return { stop: true };
    }
    if (a && (a.status !== "active" || a.revisions.length >= 2)) {
      say(t.cannotExtend);
      return {};
    }
    let due: number | undefined;
    if (extension) {
      const amount = text.match(
        /(?:for |another |extra )?([a-z\d. ]+?)\s+(?:more\s+)?(minutes?|mins?|seconds?|secs?)(?:\s+more)?/,
      );
      if (amount) {
        const quantity = amount[1]
          .replace(/^.*?(?:have|need|take|get|me|another|extra|for)\s+/, "")
          .trim()
          .replace(/^(?:another|extra) /, "");
        const parsed = surfaceCommand(`wait ${quantity} ${amount[2]}`);
        due =
          parsed.duration === undefined ||
          parsed.text !== "wait" ||
          parsed.duration <= 0
            ? NaN
            : (a?.due ?? social.offer!.due) + Math.round(parsed.duration * 60);
      }
    } else due = requestedTime(text, socialTime(s) + 60);
    if (due === undefined || !Number.isFinite(due)) {
      social.clarification = "extension";
      say(t.clarifyDuration);
      return { stop: true };
    }
    delete social.clarification;
    if (due <= socialTime(s) + 120) {
      say(t.tooSoon);
      return { stop: true };
    }
    if (due > limit) {
      say(t.availabilityRefusal(clockLabel(limit)));
      return {};
    }
    if (a && due <= a.due) {
      say(t.alreadyWithinTime);
      return {};
    }
    if (!timed()) return { failed: true, stop: true };
    if (a && a.status !== "active") {
      say(t.missedDuringRequest);
      return {};
    }
    return offer(due, !!a);
  }
  if (apology && a && a.missedAt !== undefined) {
    if (a.apologyAt !== undefined) {
      say(a.repairAt !== undefined ? t.repaired : t.apologyRemembered);
      return {};
    }
    if (!timed()) return { failed: true, stop: true };
    a.apologyAt = socialTime(s);
    const event = recordSocial(
      s,
      a,
      "apologised",
      "player",
      "Player acknowledged missing the agreed collection time.",
    );
    learnSocial(s, event, t.npc, "heard");
    observeCurrentPossession(s, a);
    repairCare(s, a);
    say(a.repairAt !== undefined ? t.repaired : t.apology);
    return {};
  }
  if (report && a) {
    if (!timed()) return { failed: true, stop: true };
    const contradicted = witnessedSurface(s, a);
    const detail = contradicted
      ? "Player claimed collection, contradicted by the visible envelope on the ledge."
      : "Player reports collection; time and earlier custody are unverified.";
    if (
      !social.events.some((e) => e.kind === "reported" && e.detail === detail)
    ) {
      const event = recordSocial(s, a, "reported", "player", detail);
      learnSocial(s, event, t.npc, "heard");
    }
    s.npcs[t.npc].beliefs.envelopeCollection = {
      value: detail,
      source: contradicted
        ? "Player claim contradicted by direct inspection"
        : "Player report; not verified",
      at: s.time,
    };
    observeCurrentPossession(s, a);
    repairCare(s, a);
    say(
      contradicted
        ? t.contradicted
        : a.repairAt !== undefined
          ? t.repaired
          : t.reported,
    );
    return {};
  }
  if (apology && a) {
    say(t.nothingToApologise);
    return {};
  }
  if (query) {
    const due = social.offer?.due ?? a?.due;
    say(
      due === undefined
        ? t.noAgreement
        : t.terms(
            clockLabel(due),
            clockLabel(limit),
            a ? knownCareStatus(s, a) : undefined,
          ),
    );
    return { stop: !!social.offer };
  }
  if (request) {
    if (a) {
      say(
        a.status === "active" ? t.alreadyAgreed(clockLabel(a.due)) : t.finished,
      );
      return {};
    }
    // Resolve IT rather than guessing that every object means the envelope.
    const noun = /\benvelope\b/.test(text)
      ? text.includes("service envelope")
        ? "service envelope"
        : "envelope"
      : "it";
    if (api.object(s, noun).id !== t.object)
      api.fail(
        "Inez can offer temporary care for your black envelope here, not that object.",
      );
    eligible();
    let due = requestedTime(text, socialTime(s) + 60) ?? limit;
    if (!Number.isFinite(due))
      api.fail("Name a clock time or a duration for collecting it.");
    if (due > limit) {
      say(t.availabilityRefusal(clockLabel(limit)));
      return {};
    }
    if (due <= socialTime(s) + 120) api.fail(t.tooSoon);
    if (!timed()) return { failed: true, stop: true };
    return offer(due);
  }
  return;
}
