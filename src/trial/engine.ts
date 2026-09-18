import { handleInteraction } from "./interactions";
import { currentDrink, describeVessel, isVessel } from "./vessels";
import { trialInterlocutors, beverages } from "./interaction-content";
import { isFollowup } from "./interaction-language";
import type { InteractionHost, InteractionResult } from "./interaction-model";
import { carriedBy, visibleAt } from "../engine/custody";
import { nextDueEvent, scheduleOnce } from "../engine/event-queue";
import { parseCommand, splitCommands } from "../engine/language";
import { numberWords } from "../engine/natural-language";
import {
  activeContext,
  contextualHelp,
  privateThought,
  setTopic,
  socialConversation,
} from "./conversation";
import {
  companyReply,
  greeting,
  namedTopic,
  sensitiveTopics,
  speechText,
  trialText,
} from "./language";
import {
  evidenceIds,
  helpText,
  hospitalAccount,
  rooms,
  cocktailMenu,
} from "./content";
import {
  validateTrial,
  type Actor,
  type TrialEvent,
  type TrialState,
} from "./state";

export function trialClock(time: number) {
  return `Day ${Math.floor(time / 1440)} · ${["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"][Math.floor(time / 1440) % 7]} ${String(Math.floor(time / 60) % 24).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}
export function staffed(s: TrialState) {
  return s.time % 1440 >= 1080 && s.time % 1440 < 1320;
}
export function sablePresent(s: TrialState) {
  return (
    staffed(s) &&
    !s.away &&
    (s.room === "bar" || (s.room === "booth" && (s.privateUntil ?? 0) > s.time))
  );
}
function present(s: TrialState, actor: Actor) {
  return actor === "sable"
    ? sablePresent(s)
    : actor === "vesper" && s.room === "shop" && staffed(s);
}
function visible(s: TrialState, id: string) {
  return visibleAt(s.entities, id, s.room);
}
function record(
  s: TrialState,
  actor: Actor,
  mode: TrialState["observations"][number]["mode"],
  subject: string,
  detail: string,
  source: string,
  evidence: string[] = [],
  upstream: string[] = [],
) {
  const o = {
    id: `sable:observation:${s.nextId++}`,
    at: s.time,
    actor,
    mode,
    subject,
    detail,
    source,
    evidence,
    upstream,
  };
  s.observations.push(o);
  return o;
}
function know(s: TrialState, actor: Actor, fact: string) {
  if (!s.actors[actor].knowledge.includes(fact))
    s.actors[actor].knowledge.push(fact);
}
function inspected(s: TrialState, actor: Actor, id: string) {
  return s.observations.find(
    (o) =>
      o.actor === actor && o.mode === "inspected" && o.evidence.includes(id),
  );
}
function inspect(s: TrialState, actor: Actor, id: string, source: string) {
  const old = inspected(s, actor, id);
  if (old) return old;
  const o = record(
    s,
    actor,
    "inspected",
    id,
    s.entities[id].description,
    source,
    [id],
  );
  know(s, actor, id);
  return o;
}
function schedule(s: TrialState, id: TrialEvent["id"], delay: number) {
  scheduleOnce(s.events, { id, at: s.time + delay, status: "pending" });
}
function receive(s: TrialState, path: "direct" | "vesper") {
  if (s.receipt) {
    if (path === "vesper" && s.receipt.path === "direct")
      record(
        s,
        "sable",
        "heard",
        "supplemental-relay",
        "Vesper subsequently called about the objects they had inspected.",
        "Vesper's requested private call",
        [],
        evidenceIds.map((id) => inspected(s, "vesper", id)!.id),
      );
    return false;
  }
  if (!s.actors.player.knowledge.includes("hospital-account")) return false;
  const actor = path === "direct" ? "sable" : "vesper";
  const sources = evidenceIds.map((id) => inspected(s, actor, id)?.id);
  if (sources.some((id) => !id)) return false;
  const r = record(
    s,
    "sable",
    "heard",
    "contradiction",
    "The dated event image contradicts my continuous hospitalization account.",
    path === "direct"
      ? "Player showed the print and listing directly"
      : "Vesper's private telephone report of their own inspection, requested by the player",
    [...evidenceIds],
    sources as string[],
  );
  s.receipt = { id: r.id, at: s.time, path, sources: sources as string[] };
  know(s, "sable", "credible-contradiction");
  schedule(s, "sable:decide", 10);
  return true;
}
function decide(s: TrialState) {
  if (!s.receipt || s.decision) return;
  const busy = s.time % 1440 >= 1200;
  const course = s.needsTime || busy ? "document" : "formal";
  const reasons =
    course === "formal"
      ? [
          "The photo and independent listing conflict with my hospital account.",
          "The independent practitioner agrees to explain every step and stop when asked.",
          "I can make room around work and want an examination.",
        ]
      : [
          "The photo and independent listing justify investigating.",
          s.needsTime
            ? "I want time to put my own observations in order first."
            : "Tonight's service needs my attention; I prefer a task I can pace myself.",
          "A dated notebook can distinguish what I remember from what I can check.",
        ];
  s.decision = { at: s.time, course, reasons, receipt: s.receipt.id };
  record(
    s,
    "sable",
    "own",
    "decision",
    reasons.join(" "),
    "Sable's deliberation",
    [],
    [s.receipt.id],
  );
  if (course === "formal") {
    schedule(s, "sable:medical-start", 4260);
    schedule(s, "sable:medical", 4320);
  } else schedule(s, "sable:notebook", 1440);
}
function advance(s: TrialState, minutes: number) {
  const target = s.time + minutes;
  let count = 0,
    event: TrialEvent | undefined;
  while ((event = nextDueEvent(s.events, target))) {
    if (++count > 20)
      throw new Error("Trial event bound exceeded; time was not skipped.");
    s.time = event.at;
    event.status = "fired";
    switch (event.id) {
      case "sable:relay":
        receive(s, "vesper");
        break;
      case "sable:decide":
        decide(s);
        break;
      case "sable:medical-start":
        s.away = true;
        record(
          s,
          "sable",
          "own",
          "visit",
          "Left for the independent appointment; arranged shift cover.",
          "Sable's own activity",
        );
        break;
      case "sable:medical":
      case "sable:notebook": {
        const course = event.id === "sable:medical" ? "formal" : "document";
        s.completed = { at: s.time, course };
        const id = course === "formal" ? "trial-report" : "trial-notebook";
        s.entities[id].location = "sable";
        s.entities[id].owner = "sable";
        record(
          s,
          "sable",
          "own",
          id,
          s.entities[id].description,
          course === "formal"
            ? "Received independent practitioner's limited report"
            : "Wrote dated observations and a checkable next step",
          [id],
        );
        know(s, "sable", id);
        if (course === "formal") schedule(s, "sable:return", 60);
        break;
      }
      case "sable:return":
        s.away = false;
        break;
    }
  }
  s.time = target;
  if (s.context && (s.context.room !== s.room || s.time - s.context.at > 30))
    delete s.context;
}
export function describeTrial(s: TrialState) {
  const available = Object.values(s.entities)
    .filter((e) => visible(s, e.id) && e.location !== "player")
    .map((e) => e.name);
  if (s.room === "home")
    return [
      "Your apartment. The kettle has no theories. You can return to the bar or shop, or REST UNTIL TOMORROW: an optional jump to the next evening at 18:00.",
      ...available.map((n) => `Here: ${n}.`),
    ];
  if (s.room === "shop")
    return [
      staffed(s)
        ? "Vesper is sorting a photographer's clearance lot. The photograph and provenance listing are available to take if they are still here. The bar and home are nearby."
        : "The shop is closed until 18:00. You can leave for home or the bar.",
      ...available.map((n) => `Here: ${n}.`),
    ];
  if (s.room === "booth")
    return [
      sablePresent(s)
        ? "The quiet booth has a low table and a lamp turned toward the wall. Sable is here for the private conversation you requested. The bar is just outside."
        : "The quiet booth has a low table and a shaded lamp. It is empty. Ask Sable at the bar to talk privately when they are available.",
      ...available.map((n) => `Here: ${n}.`),
    ];
  return [
    "The Velvet Corner: warm light on a worn wooden counter, shelves of mismatched glasses and a soft bass line from the speakers. The quiet booth is beyond the curtain. The shop and the way home are outside.",
    sablePresent(s)
      ? `Sable is behind the counter, pencil tucked behind one ear. ${s.time % 1440 >= 1200 ? "Orders are gathering; they are keeping service moving." : "They have a quieter stretch between orders."}${s.completed && s.updateAt === undefined ? " They have something to discuss when you can talk privately." : ""}`
      : s.away
        ? "Sable's shift is covered while they are away. The cover staff offer no account of where they went. Come back another evening."
        : "Sable is off duty. The next staffed evening begins at 18:00.",
    ...available.map((n) => `Here: ${n}.`),
    ...Object.values(s.entities)
      .filter((e) => isVessel(e) && visible(s, e.id))
      .map(describeVessel),
  ];
}
function journal(s: TrialState) {
  const lines = ["Your notes — observations, accounts and uncertainties:"];
  for (const o of s.observations.filter((o) => o.actor === "player"))
    lines.push(`${o.detail} [${o.source}; ${trialClock(o.at)}]`);
  for (const b of Object.values(s.actors.player.beliefs))
    lines.push(`Unverified: ${b.text} [${b.source}]`);
  const relay = s.events.find((e) => e.id === "sable:relay");
  if (relay)
    lines.push(
      `You requested Vesper's call for ${trialClock(relay.at)}. Requesting a call does not let you read Sable's mind.`,
    );
  if (s.actors.player.knowledge.includes("credible-contradiction"))
    lines.push(
      "The print and dated listing contradict Sable's account. They establish neither coercion nor a perpetrator.",
    );
  return lines;
}
function observeDecision(s: TrialState, source: string) {
  if (
    !s.decision ||
    s.observations.some((o) => o.actor === "player" && o.subject === "decision")
  )
    return;
  record(
    s,
    "player",
    "heard",
    "decision",
    `Sable chose ${s.decision.course === "formal" ? "an independent examination" : "to document their observations"}: ${s.decision.reasons.join(" ")}`,
    source,
    [],
    [s.receipt!.id],
  );
}
function update(s: TrialState) {
  if (
    !s.completed ||
    !s.receipt ||
    !s.decision ||
    s.updateAt !== undefined ||
    s.room !== "booth" ||
    !sablePresent(s)
  )
    return [];
  s.updateAt = s.time;
  const elapsed = s.time - s.receipt.at;
  const days = Math.floor(elapsed / 1440);
  const duration =
    days < 1
      ? "a little while"
      : days === 1
        ? "about a day"
        : days < 4
          ? "a few days"
          : "several days";
  const path =
    s.receipt.path === "direct"
      ? "you showed me the closing-party photograph and the provenance listing"
      : "Vesper called, at your request, about the closing-party photograph and listing they inspected";
  const formal = s.completed.course === "formal";
  const object = formal ? "trial-report" : "trial-notebook";
  const treatment = s.treatment.at(-1)?.value;
  const reaction =
    treatment === "disagree"
      ? "‘You disagreed. I heard you. The choice was still mine.’"
      : treatment === "space"
        ? "‘You said you couldn't help. I didn't take that as permission to stop looking after myself.’"
        : treatment === "pressure"
          ? "‘Being pushed didn't help. Please ask me before deciding what I can bear.’"
          : treatment === "silence"
            ? "‘Thank you for letting the silence stay a silence.’"
            : treatment === "time"
              ? "‘Putting the observations in order gave me something useful to do at my own pace.’"
              : "‘I'm glad we can talk about this without making you responsible for fixing me.’";
  record(
    s,
    "player",
    "heard",
    "update",
    formal
      ? "Sable reports an abnormal finding compatible with intervention, alternatives unresolved; referral recommended."
      : "Sable made a dated notebook and proposes asking the photographer to authenticate the lot and event date.",
    "Sable's private account of their completed activity",
    [],
    [s.receipt.id],
  );
  setTopic(s, "update", "investigation");
  return [
    `Sable: ‘It's been ${duration} since ${path}. Here's what I did.’`,
    ...(s.observations.some(
      (o) => o.actor === "sable" && o.subject === "supplemental-relay",
    )
      ? [
          "‘Vesper called afterward, too. They were careful to say what they'd actually seen.’",
        ]
      : []),
    `‘${s.decision.reasons.slice(1).join(" ")}’`,
    formal
      ? "‘The doctor explained each step. I could stop. The report describes an abnormal finding compatible with prior intervention. Other explanations are still open. They recommended a specialist. It doesn't tell me who, when, or what happened to my memories.’"
      : "‘I made three columns: what I remember, what I saw, what I can check. The listing gives me a next step: ask the photographer to authenticate the lot and the closing date. That isn't a recovered memory. It's a question someone might actually answer.’",
    formal
      ? "They took time away from their shift and arranged cover before returning."
      : "‘I set aside some time after stocktake to work on the notebook.’",
    reaction,
    s.entities["trial-photo"].location === "sable" &&
    !s.entities["trial-photo"].destroyed
      ? "The original print is still in Sable's custody."
      : "Sable talks through the date without laying a print on the table.",
    `‘You can ask to see the ${s.entities[object].name}. Please don't record or share it without asking.’`,
  ];
}
function objectId(text: string) {
  if (/listing|provenance|flyer/.test(text)) return "trial-listing";
  if (/photo|photograph|print|picture/.test(text)) return "trial-photo";
  if (/notebook|notes|journal book/.test(text)) return "trial-notebook";
  if (/report|medical record/.test(text)) return "trial-report";
  if (/satchel|bag/.test(text)) return "trial-bag";
  return undefined;
}
function interactionHost(s: TrialState): InteractionHost {
  return {
    actors: trialInterlocutors,
    beverages,
    present: (actor) => present(s, actor as Actor),
    accessible: (id) =>
      visible(s, id) &&
      !(s.room === "shop" && !staffed(s) && !carriedBy(s.entities, id)),
    observed: (actor, id) => !!inspected(s, actor as Actor, id),
    corroborated: (actor) => actor === "sable" && !!s.receipt,
    inspect: (actor, id) => {
      inspect(
        s,
        actor as Actor,
        id,
        actor === "player"
          ? `Inspected ${s.entities[id].name}`
          : "Player directly showed the accessible original",
      );
      if (
        actor === "player" &&
        evidenceIds.every((id) => inspected(s, "player", id)) &&
        s.actors.player.knowledge.includes("hospital-account")
      )
        know(s, "player", "credible-contradiction");
    },
    record: (actor, mode, subject, words, entities) => {
      const o = record(
        s,
        actor as Actor,
        mode === "opinion" || mode === "preference" ? "heard" : mode,
        subject,
        words,
        mode === "claim"
          ? "Player's unverified account"
          : "Player's present words or action",
        entities,
      );
      if (mode === "claim")
        s.actors[actor as Actor].beliefs[o.id] = {
          text: words,
          source: o.id,
          at: s.time,
        };
    },
    afterShow: (actor) =>
      actor === "sable" && receive(s, "direct")
        ? acknowledge(s)
        : actor === "vesper" &&
            evidenceIds.every((id) => inspected(s, "vesper", id))
          ? [
              "Vesper: ?I can describe what I've inspected. If you want me to tell Sable, ask me explicitly.?",
            ]
          : [],
  };
}
function respond(s: TrialState, raw: string): InteractionResult {
  const text = trialText(raw);
  const reply = speechText(text);
  const c = parseCommand(text);
  const conversationalQuestion =
    /^(?:what|why|how|when|where|who|can you explain|could you explain|tell me more|go on|and then)\b/.test(
      reply,
    );
  const socialReply =
    /^(?:say )?(i agree|i disagree|i don't agree|i do not agree|i would rather you didn't|i think you should wait|i think you should get an exam|i support you|i'm here|im here|take your time|no rush|i need space|i can't help|i cannot help|i cant help|i don't want to get involved|no thank you|no thanks|say nothing|nothing|listen|be quiet|do it now|you must go|yes|no|tea|coffee|water|that sounds good)[.!]?$/.test(
      reply,
    );
  const lines: string[] = [];
  const ok = (...words: string[]) => ({ lines: words, minutes: 2 });
  const no = (message: string) => ({ lines: [message], failed: true });
  const clarify = (message: string, intent = "clarification") => ({
    lines: [message],
    failed: true,
    clarified: true,
    intent,
  });
  if (text === "help" || raw.trim() === "?")
    return { lines: contextualHelp(s), intent: "help:controls" };
  if (text === "hint")
    return {
      lines: ["Optional puzzle guidance — contains spoilers:", helpText],
      intent: "help:spoilers",
    };
  if (/^(ask|ask sable)$/.test(text))
    return clarify(
      sablePresent(s)
        ? "What would you like to ask Sable about? Their evening, something they just said, or a subject you name?"
        : "Who would you like to ask, and about what? Name a person who is here.",
      "ask:missing-topic",
    );
  if (text === "take")
    return clarify(
      `What would you like to take? ${currentDrink(s) && visible(s, currentDrink(s)!.id) ? `Your ${currentDrink(s)!.kind} is within reach. ` : ""}Name a visible object; LOOK can help.`,
      "take:missing-object",
    );
  if (
    /^(what is my (?:usual(?: water| tea| coffee)?|name)|who am i)$/.test(
      text,
    ) ||
    raw.trim().toLowerCase() === `${s.alias.toLowerCase()}?`
  )
    return {
      lines: [
        /name|who am/.test(text) ||
        raw.trim().toLowerCase() === `${s.alias.toLowerCase()}?`
          ? `Your chosen alias for this run is ${s.alias}.`
          : s.preference
            ? `Sable remembers that you asked for ${s.preference}. ‘Usual’ means that preference, not a different kind of drink. ${currentDrink(s) ? "You can check the drink actually served with LOOK." : "Nothing has been served yet in this recorded state."}`
            : "You haven't established a drink preference in this run.",
      ],
      intent: "inspect:player-preference",
    };
  if (/^(look|look around|where am i)$/.test(text))
    return { lines: describeTrial(s) };
  if (/^(inventory|belongings|what am i carrying)$/.test(text))
    return {
      lines: Object.values(s.entities)
        .filter((e) => carriedBy(s.entities, e.id))
        .map((e) =>
          isVessel(e)
            ? describeVessel(e)
            : `${e.name}${e.kind === "Container" ? (e.open ? " (open)" : " (closed)") : ""}`,
        )
        .concat(
          "Contents of closed bags are carried but must be opened before inspection or showing.",
        ),
    };
  if (/^(journal|check journal)$/.test(text)) return { lines: journal(s) };
  if (/^(think|remember|consider)(\b|$)/.test(text))
    return { lines: [privateThought(s)], intent: "think:private" };
  const interaction = handleInteraction(s, raw, interactionHost(s));
  if (interaction) return interaction;
  if (
    activeContext(s)?.question?.kind === "hospital-part" &&
    /^(?:the |i mean (?:the )?)?(dream|hospital|hospital recollection|recollection)$/.test(
      text,
    )
  ) {
    if (!sablePresent(s))
      return clarify(
        "Sable isn't here to hear that answer.",
        "conversation:absent",
      );
    setTopic(s, "hospital", "hospital");
    return {
      ...ok(
        text.includes("dream")
          ? "Sable: ‘The dream, then. I don't know what it means. We can keep that question open without making it an answer.’"
          : "Sable: ‘The hospital recollection. It feels definite to me, but I know that isn't the same as checking it.’",
      ),
      intent: "conversation:clarified-hospital-part",
    };
  }
  const company = companyReply(reply);
  if (company) {
    const companyOffered =
      "Sable: ‘Thank you for offering. I haven't decided whether I want company. I'll ask before we arrange anything.’";
    if (!sablePresent(s))
      return clarify(
        "Sable isn't here to hear that offer or reply.",
        "conversation:absent",
      );
    if (
      company === "uncertain" ||
      (!activeContext(s) && !/\bsable\b/.test(text))
    )
      return clarify(
        "Are you offering Sable company, saying you cannot come, or asking what they would prefer? No arrangement has been made.",
        "conversation:company-clarification",
      );
    if (company === "ask-preference") {
      // Answer from the latest recorded position; asking offers, declines and arranges nothing.
      const position = [...s.observations]
        .reverse()
        .find(
          (o) =>
            o.actor === "sable" &&
            ["company-offer", "company-declined"].includes(o.subject),
        )?.subject;
      return {
        ...ok(
          position === "company-offer"
            ? companyOffered
            : position === "company-declined"
              ? "Sable: ‘I won't count on you coming. I can make my own arrangements.’"
              : "Sable: ‘I haven't decided whether I want company. No arrangement has been made.’",
        ),
        intent: "conversation:company-preference",
      };
    }
    if (company === "decline") {
      record(
        s,
        "sable",
        "heard",
        "company-declined",
        raw,
        "Player's present words; no accompaniment arranged",
      );
      if (activeContext(s)?.kind === "decision")
        s.treatment.push({ at: s.time, value: "space", observer: "sable" });
      return {
        ...ok(
          "Sable: ‘Understood. I won't count on you coming. I can make my own arrangements.’",
        ),
        intent: "conversation:decline-company",
      };
    }
    s.companyOffers.push({
      at: s.time,
      observer: "sable",
      words: raw,
      status: "offered",
    });
    record(
      s,
      "sable",
      "heard",
      "company-offer",
      raw,
      "Player offered company; no acceptance or appointment commitment",
    );
    return { ...ok(companyOffered), intent: "conversation:offer-company" };
  }
  const timeSuggestion =
    /^(?:(?:you can|you could|please) )?(?:take|have) (?:all )?(?:the |your |some )?time\b/.test(
      reply,
    ) ||
    /^(?:there's |there is )?no (?:rush|hurry)\b/.test(reply) ||
    /^(?:you (?:can|could|should)|i'd suggest|i suggest) (?:write|writing|document|documenting)\b.*\bfirst\b/.test(
      reply,
    );
  if (timeSuggestion && activeContext(s)?.kind === "decision") {
    if (!sablePresent(s))
      return no("Sable isn't here to hear that suggestion.");
    if (/\b(but|unless|not|must)\b/.test(reply))
      return clarify(
        "Are you suggesting Sable take time, or putting a condition on that? Their pending decision is unchanged.",
        "conversation:qualified-time",
      );
    s.treatment.push({ at: s.time, value: "time", observer: "sable" });
    record(
      s,
      "sable",
      "heard",
      "player-response",
      raw,
      "Player's present suggestion to take time",
    );
    if (!s.decision) s.needsTime = true;
    setTopic(s, "decision", "investigation");
    return {
      ...ok(
        s.decision
          ? "Sable: ‘Thank you. I've already made this first arrangement; I can take the next step at my own pace.’"
          : "Sable: ‘Yes. I would like to write things down first. A question I can hold still for a minute.’",
      ),
      intent: "conversation:offer-time",
    };
  }
  if (
    /\b(menu|costume notes|theme-night notes|theme night notes)\b/.test(text) &&
    ["look", "examine", "read"].includes(c.verb) &&
    !c.negated &&
    !c.tentative
  ) {
    if (s.room !== "bar" && s.room !== "booth")
      return no("The menu is at the Velvet Corner.");
    return { lines: [cocktailMenu], intent: "inspect:menu" };
  }
  if ((c.negated || c.tentative) && !socialReply && !conversationalQuestion)
    return no("No action taken. Say what you want to do when you've decided.");
  if (
    /^(rest until tomorrow|sleep|advance to (the )?next evening|wait until tomorrow)$/.test(
      text,
    )
  ) {
    if (s.room !== "home")
      return no(
        "Go home before choosing the optional jump to tomorrow evening.",
      );
    return {
      lines: [
        `You choose to rest until ${trialClock((Math.floor(s.time / 1440) + 1) * 1440 + 1080)}. The city continues during this optional time advance.`,
      ],
      minutes: (Math.floor(s.time / 1440) + 1) * 1440 + 1080 - s.time,
    };
  }
  if (c.verb === "wait") {
    const hours = numberWords(
      text.replace(/\b(?:an?|one) hour\b/, "one hour"),
    ).match(/^wait(?: for)? (\d+(?:\.\d+)?) hours?$/);
    const minutes = hours
      ? Number(hours[1]) * 60
      : (c.duration ?? (text === "wait" ? 10 : NaN));
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
      return no(
        "Wait between one minute and one day, or rest until tomorrow at home.",
      );
    return { lines: [`You wait ${minutes} minutes.`], minutes };
  }
  const moving =
    /^(go|walk|head|return|enter|leave)\b/.test(text) || text === "home";
  // A look, visit or pop-in sentence that names another reachable room is
  // travel. Without a room it keeps its object or conversation meaning.
  const visiting =
    /^(?:i(?:'ll| will| want to|'d like to| think i'll)? )?(?:(?:have|take) a look|look|visit|pop|drop|nip|wander|step)(?: (?:in|into|at|by|over|round|around|back|to|the))+ (?:shop|secondhand shop|booth|bar|velvet corner|home|apartment)\b/.test(
      text,
    );
  const destination = /home|apartment/.test(text)
    ? "home"
    : /shop|secondhand/.test(text)
      ? "shop"
      : /booth/.test(text)
        ? "booth"
        : /bar|velvet|outside|leave/.test(text)
          ? "bar"
          : undefined;
  if (moving || (visiting && destination !== s.room)) {
    if (!destination) return no("You can go to the bar, shop, booth or home.");
    s.room = destination;
    delete s.context;
    delete s.privateUntil;
    return ok(`You go to ${rooms[destination]}.`);
  }
  const response = socialReply;
  const isSilence =
    /^(say nothing|listen|be quiet|stay silent|remain silent|silence)$/.test(
      reply,
    );
  if (
    response ||
    isSilence ||
    /^(order|i('d| would) like|can i have)\b/.test(reply)
  ) {
    if (!sablePresent(s))
      return no(
        "Sable isn't here to hear that. A private thought or an unspoken reply doesn't reach them.",
      );
    if (!response && !isSilence && !/\b(tea|coffee|water)\b/.test(reply))
      return no(
        "Sable: ‘Tea, coffee or water? Say which you'd like, or no thanks.’",
      );
    const context = activeContext(s);
    if (!context)
      return clarify(
        "That conversation has been interrupted. Name the person and topic so they can answer what you mean.",
        "conversation:missing-topic",
      );
    if (context.topic === "hospital" && /agree|^yes|^no$/.test(reply)) {
      setTopic(s, "hospital", "hospital", { kind: "hospital-part" });
      return clarify(
        /disagree|don't agree|do not agree/.test(reply)
          ? "Sable: ‘Which part doesn't fit for you — the hospital recollection, or the dream? I'm not sure how they fit together either.’"
          : /agree|^yes/.test(reply)
            ? "Sable: ‘Do you mean the hospital recollection sounds right, or that the dream is worth asking about? I don't want to put words in your mouth.’"
            : "Sable: ‘We can leave it there for now. I don't need an answer from you tonight.’",
        "conversation:hospital-response",
      );
    }
    if (context.topic === "hospital")
      return {
        ...ok(
          "Sable: ‘We can leave it there for now. I don't need an answer from you tonight.’",
        ),
        intent: "conversation:hospital-response",
      };
    if (context.topic === "drink")
      return clarify(
        "Do you mean the drink, or something Sable said earlier? Name the topic so they can answer you.",
        "conversation:drink-ambiguity",
      );
    if (context.topic === "roleplay")
      return {
        ...ok(
          "Sable: ‘We can talk about the boundary without agreeing on what we'd enjoy. I wasn't proposing anything between us.’",
        ),
        intent: "conversation:roleplay-response",
      };
    if (context.kind === "social")
      return {
        ...ok(
          /disagree/.test(reply)
            ? context.topic === "supplier"
              ? "Sable: ‘Fair. The supplier letter could be less theatrical.’"
              : "Sable: ‘Fair. The theme may need less theatre and more snacks.’"
            : "Sable smiles. ‘I'll take that under advisement. Possibly with chips.’",
        ),
        intent: "conversation:plans-response",
      };
    if (context.kind === "update")
      return {
        ...ok(
          "Sable: ‘We can question what the result means. The next step is still a question, not a verdict.’",
        ),
        intent: "conversation:update-response",
      };
    if (
      /^(yes|no|i agree|that sounds good)$/.test(reply) &&
      context.question?.kind === "consider-options"
    )
      return clarify(
        "Sable mentioned an examination and taking time to document things. Which part are you responding to? You can name your concern, offer support or say nothing.",
        "conversation:proposal-ambiguity",
      );
    const value =
      isSilence || /nothing/.test(reply)
        ? "silence"
        : /disagree|don't agree|do not agree|rather you didn't|should/.test(
              reply,
            )
          ? "disagree"
          : /space|can't|cant|cannot|don't want|no thank|no thanks|^no$/.test(
                reply,
              )
            ? "space"
            : /time|rush/.test(reply)
              ? "time"
              : /must|do it now/.test(reply)
                ? "pressure"
                : "support";
    s.treatment.push({ at: s.time, value, observer: "sable" });
    if (value === "time" && s.receipt && !s.decision) s.needsTime = true;
    record(
      s,
      "sable",
      "heard",
      "player-response",
      value,
      "Player's present words or deliberate silence",
    );
    return ok(
      value === "silence"
        ? "You leave room for silence. Sable puts the pencil down. ‘All right. We don't need to fill every second.’"
        : value === "space"
          ? "Sable: ‘Okay. You don't owe me a rescue. I can make my own next step.’"
          : value === "disagree"
            ? "Sable: ‘I hear you. I want to decide this on what I can check and what I can manage, not on whether we agree.’"
            : value === "pressure"
              ? "Sable: ‘Please don't make this an order. I need to choose what happens to me.’"
              : value === "time"
                ? s.decision
                  ? "Sable: ‘Thank you. I've already made this first arrangement; I can take the next step at my own pace.’"
                  : "Sable: ‘Yes. I would like to write things down first. A question I can hold still for a minute.’"
                : "Sable: ‘Thank you. Being here is enough for this conversation.’",
    );
  }
  if (
    c.negated ||
    (c.tentative && !conversationalQuestion) ||
    /^(don't|do not|what if|maybe|should i)\b/.test(reply)
  )
    return no("No action taken. Say what you want to do when you've decided.");
  const implicitDocumentRequest =
    activeContext(s)?.kind === "update" &&
    /^(?:(?:may|can|could) i )?(?:please )?(?:see|read|borrow|have) (?:it|that|the document)$/.test(
      reply,
    );
  const recipient: Actor | undefined = /\bvesper\b/.test(text)
    ? "vesper"
    : /\bsable\b/.test(text)
      ? "sable"
      : activeContext(s)?.kind === "update" &&
          (/\b(report|notebook)\b/.test(text) || implicitDocumentRequest)
        ? "sable"
        : undefined;
  if (
    /^(?:please )?(?:(?:ask|tell) vesper to (?:tell|call|message) sable|(?:ask|tell) vesper to (?:relay|pass) (?:this|it|the account|the information)(?: on)? to sable|vesper[ ,]+(?:please )?tell sable)$/.test(
      text,
    )
  ) {
    if (!present(s, "vesper"))
      return no("Ask Vesper at the open shop. No request has reached them.");
    if (!evidenceIds.every((id) => inspected(s, "vesper", id)))
      return no(
        "Vesper: ‘Let me see both the photograph and listing before asking me to carry an account of them.’",
      );
    if (!s.actors.player.knowledge.includes("hospital-account"))
      return no(
        "Vesper: ‘What does this contradict? Speak to Sable about what they remember first.’",
      );
    if (s.events.some((e) => e.id === "sable:relay"))
      return ok("Vesper: ‘I remember the request. One call, as agreed.’");
    record(
      s,
      "vesper",
      "heard",
      "relay-request",
      "Player explicitly asked me to tell Sable about my inspection.",
      "Player's request",
      [],
      evidenceIds.map((id) => inspected(s, "vesper", id)!.id),
    );
    schedule(s, "sable:relay", 1440);
    return ok(
      `Vesper: ‘I'll call Sable privately at ${trialClock(s.time + 1440)}. I'll say what I saw, and that you asked me. I won't claim to know who did anything to them.’`,
    );
  }
  if (
    /talk privately|talk in private|quiet word|ask sable.*privat/.test(text)
  ) {
    if (!sablePresent(s))
      return no(
        "Ask Sable at the bar during a staffed evening. They aren't available here.",
      );
    s.room = "booth";
    s.privateUntil = s.time + 25;
    delete s.context;
    return ok(
      "Sable agrees to a few quiet minutes and joins you in the booth.",
      ...update(s),
    );
  }
  const id =
    objectId(text) ??
    (implicitDocumentRequest
      ? s.completed?.course === "formal"
        ? "trial-report"
        : "trial-notebook"
      : undefined);
  if (
    [
      "take",
      "get",
      "give",
      "show",
      "drop",
      "tear",
      "read",
      "examine",
      "put",
    ].includes(c.verb)
  ) {
    const targets = c.verb === "put" ? text.split(/\bin(?:to)?\b/)[0] : text;
    const namedObjects = [
      /\b(photo|photograph|print|picture)\b/,
      /\b(listing|provenance|flyer)\b/,
      /\b(report|medical record)\b/,
      /\b(notebook|notes)\b/,
      /\b(satchel|bag)\b/,
    ].filter((pattern) => pattern.test(targets));
    if (
      namedObjects.length > 1 ||
      /\b(?:and|both|all)\b/.test(targets) ||
      /,\s*(?:the |a )?\w/.test(raw.replace(/^(?:Sable|Vesper),\s*/i, ""))
    )
      return clarify(
        "Please name one object at a time for that action. No objects were moved, inspected or shown.",
        "custody:multiple-targets",
      );
  }
  if (
    id &&
    !implicitDocumentRequest &&
    [
      "take",
      "get",
      "drop",
      "put",
      "open",
      "close",
      "read",
      "examine",
      "look",
      "show",
      "give",
      "tear",
    ].includes(c.verb)
  ) {
    const e = s.entities[id];
    if (s.room === "shop" && !staffed(s) && !carriedBy(s.entities, id))
      return no("The shop is closed. Its contents are not within reach.");
    if (["read", "examine", "look"].includes(c.verb)) {
      if (!visible(s, id))
        return no(
          "That object is not visible within reach. Open its container or ask its custodian to show it.",
        );
      inspect(s, "player", id, `Inspected ${e.name}`);
      if (
        evidenceIds.every((id) => inspected(s, "player", id)) &&
        s.actors.player.knowledge.includes("hospital-account")
      )
        know(s, "player", "credible-contradiction");
      return {
        lines: [
          e.description,
          ...(s.actors.player.knowledge.includes("credible-contradiction") &&
          evidenceIds.includes(id as (typeof evidenceIds)[number])
            ? [
                "Private: The dated image and Sable's hospital account don't fit together. That is a discrepancy, not yet an explanation.",
              ]
            : []),
        ],
      };
    }
    if (!visible(s, id))
      return no(
        "That object isn't accessible. Nothing has moved or been disclosed.",
      );
    if (c.verb === "take" || c.verb === "get") {
      if (carriedBy(s.entities, id)) return no("You're already carrying it.");
      e.location = "player";
      record(s, "player", "custody", id, `Took ${e.name}.`, "Player action", [
        id,
      ]);
      return ok(
        `You take the ${e.name}.${inspected(s, "player", id) ? " You have already inspected it." : " You haven't read it by taking it."}`,
      );
    }
    if (!carriedBy(s.entities, id))
      return no("You need to be holding it first.");
    if (c.verb === "open" || c.verb === "close") {
      if (e.kind !== "Container") return no("It isn't a container.");
      e.open = c.verb === "open";
      return ok(`You ${c.verb} your ${e.name}.`);
    }
    if (c.verb === "drop" || c.verb === "put") {
      if (c.verb === "put" && /in(to)? (?:the |my )?(satchel|bag)/.test(text)) {
        if (
          id === "trial-bag" ||
          !s.entities["trial-bag"].open ||
          !visible(s, "trial-bag")
        )
          return no(
            "The satchel must be open and reachable, and cannot contain itself.",
          );
        e.location = "trial-bag";
      } else e.location = s.room;
      record(
        s,
        "player",
        "custody",
        id,
        `Left ${e.name} at ${e.location}.`,
        "Player action",
        [id],
      );
      return ok(
        `You put down the ${e.name}${e.location === "trial-bag" ? " inside the satchel" : ""}.`,
      );
    }
    if (c.verb === "tear") {
      if (e.kind !== "Evidence")
        return no("You cannot tear the satchel with your hands.");
      e.destroyed = true;
      e.location = "destroyed";
      record(
        s,
        "player",
        "custody",
        id,
        `Destroyed ${e.name}.`,
        "Player action",
        [id],
      );
      for (const n of ["sable", "vesper"] as const)
        if (present(s, n))
          record(
            s,
            n,
            "heard",
            "destruction",
            `Saw the player destroy ${e.name}.`,
            "Present observation",
            [id],
          );
      return ok(
        `You tear the ${e.name}. It is no longer usable as an original. Earlier observations remain; absent people are not told.`,
      );
    }
    if (!recipient || !present(s, recipient))
      return no(
        "Name a present recipient: Sable at the bar or booth, or Vesper at the shop.",
      );
    if (c.verb === "give") {
      e.location = recipient;
      e.owner = recipient;
      record(
        s,
        recipient,
        "custody",
        id,
        `Received ${e.name} without inspecting it.`,
        "Player handover",
        [id],
      );
      return ok(
        `You give ${recipient === "sable" ? "Sable" : "Vesper"} the ${e.name}. They put it aside unread. Ask them to read it if you want an inspection.`,
      );
    }
    inspect(s, recipient, id, "Player directly showed the accessible original");
    lines.push(
      `${recipient === "sable" ? "Sable" : "Vesper"} inspects the ${e.name}. You keep custody.`,
    );
    if (recipient === "sable" && receive(s, "direct"))
      lines.push(...acknowledge(s));
    else if (recipient === "sable")
      setTopic(
        s,
        "evidence",
        id === "trial-photo"
          ? "photo"
          : id === "trial-listing"
            ? "listing"
            : id === "trial-report"
              ? "report"
              : "notebook",
      );
    else if (
      recipient === "vesper" &&
      evidenceIds.every((id) => inspected(s, "vesper", id))
    )
      lines.push(
        "Vesper: ‘I can describe what I've inspected. If you want me to tell Sable, ask me explicitly.’",
      );
    return { lines, minutes: 2 };
  }
  const objectRequest =
    /^(?:(?:may|can|could|would) (?:i|you) |(?:i'd|i would) like to )?(?:please )?(?:see|show|read|inspect|borrow|have|give|return)\b/.test(
      reply,
    );
  if (
    recipient &&
    objectRequest &&
    !implicitDocumentRequest &&
    /\b(read|inspect)\b/.test(reply) &&
    id
  ) {
    if (!present(s, recipient) || !carriedBy(s.entities, id, recipient))
      return no("That person must be here and have the object to inspect it.");
    inspect(
      s,
      recipient,
      id,
      "Inspected their held object at the player's explicit request",
    );
    return ok(
      `${recipient} reads the ${s.entities[id].name}.`,
      ...(recipient === "sable" && receive(s, "direct") ? acknowledge(s) : []),
    );
  }
  if (
    recipient === "sable" &&
    objectRequest &&
    (/\b(see|show|borrow|have|give|return)\b/.test(text) ||
      implicitDocumentRequest) &&
    id
  ) {
    if (!sablePresent(s) || s.room !== "booth")
      return no("Ask Sable privately while they are here.");
    if (!carriedBy(s.entities, id, "sable"))
      return no("Sable isn't holding that object.");
    if (/borrow|have|give|return/.test(text)) {
      s.entities[id].location = "player";
      s.entities[id].owner = "player";
      record(
        s,
        "player",
        "custody",
        id,
        `Sable handed over ${s.entities[id].name} by request.`,
        "Sable's explicit handover",
        [id],
      );
      return ok(
        "Sable: ‘You can hold it. Please ask before passing it on.’ They hand it over.",
      );
    }
    inspect(s, "player", id, "Sable showed their document by request");
    setTopic(s, "update", id === "trial-report" ? "report" : "notebook");
    return ok(s.entities[id].description);
  }
  if (
    !conversationalQuestion &&
    /\b(didn't|did not|won't|cannot|can't|don't|do not|not going to)\b/.test(
      reply,
    )
  )
    return clarify(
      "Are you correcting something, declining an offer, or asking a question? Please say which you mean.",
      "conversation:qualified-statement",
    );
  if (
    recipient === "vesper" &&
    (["talk", "ask"].includes(c.verb) || /^(hi|hello|hey|what)/.test(text))
  ) {
    if (!present(s, "vesper"))
      return no("Vesper is at the shop during its 18:00–22:00 opening.");
    if (
      !namedTopic(text) &&
      !/^(talk|speak|hi|hello|hey) (?:to |with )?vesper$/.test(text)
    )
      return clarify(
        "Are you asking Vesper about the clearance lot, the photograph, or its listing?",
        "conversation:vesper-topic",
      );
    return ok(
      "Vesper: ‘The print came with that photographer's clearance lot. Read the separate event listing too. Looking at a picture isn't the same as knowing why it matters.’",
    );
  }
  if (
    !conversationalQuestion &&
    [
      "take",
      "get",
      "give",
      "show",
      "drop",
      "put",
      "tear",
      "open",
      "close",
      "read",
      "examine",
      "look",
      "use",
    ].includes(c.verb)
  )
    return clarify(
      "I couldn't identify a supported object for that action. Name the menu or a visible evidence item; no object has changed.",
      "action:unknown-object",
    );
  const context = activeContext(s);
  const followup = isFollowup(reply);
  let topic = namedTopic(reply, context?.topic);
  if (!topic && followup) topic = context?.topic;
  const socialOpening =
    greeting(text) ||
    /^(?:talk|chat|speak)(?: (?:to |with )?sable)?$/.test(text);
  if (!topic && socialOpening) topic = "plans";
  // Under a sensitive subject an unplaced remark gets a question, not a guess.
  const sensitive =
    context?.interlocutor === "sable" &&
    !!context.topic &&
    sensitiveTopics.includes(context.topic);
  if (
    recipient === "sable" ||
    topic ||
    followup ||
    socialOpening ||
    sensitive
  ) {
    if (!sablePresent(s))
      return clarify(
        "Sable isn't here to continue that conversation. They are at the bar during staffed evenings, except for their own commitments.",
        "conversation:absent",
      );
    if (!topic || (followup && !context))
      return clarify(
        "Which subject do you mean? Name what you want to ask Sable about. Your previous question or offer is still open.",
        "conversation:missing-topic",
      );
    if (["plans", "supplier", "party", "music"].includes(topic))
      return {
        ...ok(
          ...socialConversation(
            s,
            topic as "plans" | "supplier" | "party" | "music",
            socialOpening,
          ),
        ),
        intent: `conversation:${topic}`,
      };
    if (topic === "drink")
      return { lines: [cocktailMenu], intent: "conversation:menu" };
    if (topic === "hospital") {
      const heard = s.actors.player.knowledge.includes("hospital-account");
      setTopic(s, "hospital", "hospital");
      if (!heard) {
        record(
          s,
          "player",
          "heard",
          "hospital-account",
          "Sable says they remember continuous hospitalization five years ago, including the closing-party night.",
          "Sable directly told you",
        );
        know(s, "player", "hospital-account");
      }
      if (evidenceIds.every((id) => inspected(s, "player", id)))
        know(s, "player", "credible-contradiction");
      const answer =
        heard && /why.*hospital/.test(reply)
          ? "Sable: ‘I don't want to go into the reason for that admission tonight. What puzzles me is how definite the hospital recollection feels beside that dream.’"
          : heard &&
              (followup ||
                /tell me more|what else|what do you mean/.test(reply))
            ? "Sable: ‘The dream feels familiar while I'm in it. Then I wake up and can't place it. I don't know whether it's a memory. I'd rather say that plainly than make the story sound tidier.’"
            : hospitalAccount;
      return {
        ...ok(answer, ...(receive(s, "direct") ? acknowledge(s) : [])),
        intent: "conversation:hospital",
      };
    }
    if (topic === "roleplay") {
      setTopic(s, "roleplay", "roleplay");
      return ok(
        s.roleplay === "allowed"
          ? "Sable: ‘I like negotiated roleplay. Switching who takes charge can be fun when everyone knows the terms. No recording or public disclosure without permission. That's my boundary, not a proposal.’ They return to drafting a magnificently overcomplicated theme night."
          : s.roleplay === "implied"
            ? "Sable enjoys negotiated adult social play with clear terms. They mention a firm boundary: no recording or public disclosure without permission. Sharing an interest isn't an invitation."
            : "Sable turns to plans for an ordinary themed evening. No personal disclosure is needed to stay and enjoy their company.",
      );
    }
    if (topic === "report" || topic === "notebook") {
      const evidence = topic === "report" ? "trial-report" : "trial-notebook";
      if (topic === "notebook" && s.receipt && !s.completed) {
        setTopic(
          s,
          "decision",
          "notebook",
          s.decision ? undefined : { kind: "consider-options" },
        );
        return ok(
          "Sable: ‘I could write down what I remember, what I've observed, and what someone else can check. That would give me time to put things in order.’",
        );
      }
      if (!s.completed || s.updateAt === undefined)
        return clarify(
          "Sable hasn't shared a completed report or notebook with you. Are you asking about their plans, or something already discussed?",
          "conversation:outcome-unshared",
        );
      setTopic(s, "update", topic);
      return {
        ...ok(
          topic === "report"
            ? "Sable: ‘The report leaves other explanations open. The referral is a next step; it isn't an explanation of what happened.’"
            : "Sable: ‘The notebook keeps recollection separate from observation. Asking the photographer to authenticate the lot is a question someone can check.’",
          ...(inspected(s, "player", evidence)
            ? []
            : ["You can ask to see the document itself."]),
        ),
        intent: `conversation:${topic}`,
      };
    }
    if (topic === "investigation") {
      const fresh = update(s);
      if (fresh.length) return ok(...fresh);
      if (s.completed && s.updateAt === undefined)
        return ok(
          "Sable: ‘I have something to tell you. Can we talk privately?’",
        );
      if (s.completed) {
        setTopic(s, "update", "investigation");
        return ok(
          `Sable: ‘The ${s.completed.course === "formal" ? "report is limited; the referral is a next step" : "notebook separates observations from memories; authenticating the photographer's lot is the next step"}. Where we go after that isn't settled.’`,
        );
      }
      if (s.decision) {
        setTopic(s, "decision", "investigation");
        observeDecision(s, "Sable explained their choice");
        return ok(
          `Sable: ‘${s.decision.reasons.join(" ")}’`,
          s.decision.course === "formal"
            ? "Their appointment is a few days after their decision. You can spend ordinary time here or rest at home between evenings."
            : "They plan to work on the notebook the evening after their decision. You can spend ordinary time here or rest at home between evenings.",
        );
      }
      if (s.receipt) return ok(...acknowledge(s));
      return clarify(
        "Sable hasn't discussed an investigation or appointment with you. Are you asking about their evening or their recollections?",
        "conversation:unintroduced-investigation",
      );
    }
  }
  return no(
    "I couldn't place that action. Nothing changed. HELP gives examples; name the person or object when returning to an interrupted conversation.",
  );
}
function acknowledge(s: TrialState) {
  setTopic(s, "decision", "investigation", { kind: "consider-options" });
  return [
    "Sable studies the dates. ‘That contradicts what I remember. It doesn't tell me who did what.’ Their voice becomes very precise.",
    s.time % 1440 >= 1200
      ? "‘Service is busy. I'm leaning toward writing things down first. That's useful work I can pace myself.’"
      : "‘An independent practitioner will explain each step and let me stop. I could take that appointment. Or I might want time to put the observations in order first.’",
    "‘Give me a few minutes to decide. You can disagree, say nothing, offer company, or leave. It doesn't make this your responsibility.’",
  ];
}
export function executeTrial(state: TrialState, raw: string): TrialState {
  if (!raw.trim()) return state;
  const s = validateTrial(structuredClone(state));
  const lines: string[] = [];
  const diagnostics: NonNullable<
    TrialState["transcript"][number]["diagnostics"]
  > = [];
  const commands = splitCommands(raw.slice(0, 500));
  let failed = false;
  for (const command of commands) {
    const before = structuredClone(s);
    const beforeRoom = s.room,
      beforeDecision = s.decision;
    const result = respond(s, command);
    if (!result.failed && !result.deferred) {
      s.turn++;
      advance(s, result.minutes ?? 0);
    }
    if (!beforeDecision && s.decision && sablePresent(s)) {
      setTopic(s, "decision", "investigation");
      observeDecision(s, "Sable explained their choice while you were present");
      result.lines.push(
        `Sable: ‘I've decided. ${s.decision.reasons.join(" ")}’`,
      );
    }
    if (beforeRoom !== s.room) result.lines.push(...describeTrial(s));
    lines.push(...result.lines);
    const fields = [
      "room",
      "entities",
      "actors",
      "events",
      "observations",
      "receipt",
      "decision",
      "completed",
      "updateAt",
      "context",
      "preference",
      "lastVesselId",
      "objectFocus",
      "interactionMemory",
      "treatment",
      "away",
      "needsTime",
      "thoughtsShown",
      "companyOffers",
      "socialSeen",
    ] as const;
    diagnostics.push({
      command,
      intent:
        result.intent ??
        `language-verb:${parseCommand(command).verb} (handler detail not recorded)`,
      outcome: result.deferred
        ? "deferred"
        : result.clarified
          ? "clarified"
          : result.failed
            ? "rejected"
            : "handled",
      meaning: result.meaning,
      from: before.time,
      to: s.time,
      roomBefore: before.room,
      roomAfter: s.room,
      changes: fields
        .filter(
          (field) => JSON.stringify(before[field]) !== JSON.stringify(s[field]),
        )
        .map((field) => ({
          field,
          before: before[field] ?? null,
          after: s[field] ?? null,
        })),
    });
    failed = !!result.failed;
    if (
      result.failed ||
      result.deferred ||
      (s.context?.kind === "decision" && !s.decision)
    ) {
      if (diagnostics.length < commands.length)
        lines.push(
          "The remaining actions in that submission were not attempted; answer or clarify this part first.",
        );
      break;
    }
  }
  s.transcript.push({
    command: raw.slice(0, 500),
    startedAt: state.time,
    startRoom: state.room,
    room: s.room,
    at: s.time,
    lines,
    failed,
    diagnostics,
  });
  return validateTrial(s);
}
