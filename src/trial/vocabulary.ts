import { visibleAt } from "../engine/custody";
import { parseCommand, type Command } from "../engine/language";
import { beverages, trialInterlocutors } from "./interaction-content";
import type { Failure, InteractionResult } from "./interaction-model";
import { activeInteraction, entityCandidates } from "./interactions";
import { trialText } from "./language";
import {
  nearby,
  people,
  scenery,
  senses,
  spoken,
  type Room,
  type Scenery,
  type Sense,
} from "./scenery";
import type { TrialState } from "./state";

// The verbs this chapter answers. An input whose verb is not here fails as
// an unknown verb rather than an unknown object.
export const trialVerbs = [
  "look",
  "examine",
  "read",
  "take",
  "get",
  "drop",
  "put",
  "open",
  "close",
  "give",
  "show",
  "tear",
  "use",
  "go",
  "enter",
  "leave",
  "visit",
  "wait",
  "rest",
  "sleep",
  "talk",
  "ask",
  "tell",
  "say",
  "order",
  "refill",
  "sip",
  "drink",
  "finish",
  "sit",
  "stand",
  "listen",
  "smell",
  "touch",
  "think",
  "remember",
  "consider",
  "journal",
  "help",
  "hint",
  "inventory",
];
const compass = [
  "north",
  "south",
  "east",
  "west",
  "up",
  "down",
  "northeast",
  "northwest",
  "southeast",
  "southwest",
  "n",
  "s",
  "e",
  "w",
  "u",
  "d",
  "ne",
  "nw",
  "se",
  "sw",
];
// Verb forms are matched on the word the player typed. The shared parser's
// near-miss correction is not used here: "sip" is not "sit".
const senseForms: Record<Sense, string[]> = {
  sit: ["sit"],
  stand: ["stand"],
  listen: ["listen", "hear"],
  smell: ["smell", "sniff"],
};
const touchForms = ["touch", "feel", "pat", "stroke"];
const goForms = ["go", "walk", "head", "move", "travel", "run"];
const examineForms = [
  "examine",
  "x",
  "inspect",
  "look",
  "read",
  "check",
  "have",
];
const examineVerbs = ["examine", "read", "look"];
// Words a player puts between LOOK and a noun.
const preposition =
  /^(?:behind|under|underneath|beneath|inside|in|into|through|past|beyond|at|on|over|around|round) (?:the |a |an )?/;
// Names that travel to a room when typed alone.
const roomAliases: Record<Room, string[]> = {
  bar: ["bar", "the bar", "velvet corner", "the velvet corner"],
  shop: ["shop", "the shop", "secondhand shop", "the secondhand shop"],
  booth: ["booth", "the booth", "quiet booth", "the quiet booth"],
  home: ["home", "apartment", "my apartment", "the apartment", "flat"],
};
const topicWords = trialInterlocutors.flatMap((a) =>
  a.topics.flatMap((t) => t.aliases),
);
const drinkWords = beverages.flatMap((b) => b.aliases);
const unplaced =
  "I couldn't place that action. Nothing changed. HELP gives examples; name the person or object when returning to an interrupted conversation.";
const unknownObject =
  "I couldn't identify a supported object for that action. Name the menu or a visible evidence item; no object has changed.";

const spokenList = (rooms: Room[]) => {
  const names = rooms.map((r) => spoken[r]);
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`
    : names[0];
};
export function previousRoom(s: TrialState): Room | undefined {
  return [...s.transcript]
    .reverse()
    .find((t) => t.startRoom && t.room && t.startRoom !== t.room)?.startRoom;
}

// Abbreviations and shortcuts, rewritten to forms the engine already
// answers. Unmatched input is returned untouched.
export function canonical(s: TrialState, raw: string) {
  const text = trialText(raw);
  const room = s.room as Room;
  const travel = (to: Room) => (to === "home" ? "go home" : `go to the ${to}`);
  const rules: [RegExp, (m: RegExpMatchArray) => string | undefined][] = [
    [/^x (?=\S)/, () => text.replace(/^x /, "examine ")],
    [/^l$/, () => "look"],
    [/^(?:i|inv)$/, () => "inventory"],
    [/^z$/, () => "wait"],
    [
      /^(?:exit|out|go out|go outside|step outside|head out|head outside|walk out)$/,
      () => "leave",
    ],
    [
      /^(?:go |head |walk )?next door$/,
      () => travel(room === "shop" ? "bar" : "shop"),
    ],
    [
      /^(?:go |walk |step |head )?(?:through|past|behind|beyond) (?:the )?curtain$/,
      () => travel("booth"),
    ],
    [
      /^(?:sit|sit down|go sit|go and sit) (?:in|at|down in) (?:the )?(?:quiet )?booth$/,
      () => (room === "booth" ? undefined : travel("booth")),
    ],
    [
      /^(?:go |head )?back$/,
      () => {
        const to = previousRoom(s);
        return to && to !== room ? travel(to) : undefined;
      },
    ],
    [
      new RegExp(
        `^(?:a|an|one|some|the) ((?:${drinkWords.join("|")})(?: (?:with|without|no) .+)?)$`,
      ),
      (m) => m[1],
    ],
    [/^make it (?:alcoholic|with gin|a gin)$/, () => "special with gin"],
  ];
  for (const [pattern, rewrite] of rules) {
    const match = text.match(pattern);
    if (match) return rewrite(match) ?? raw;
  }
  const named = (Object.keys(roomAliases) as Room[]).find((r) =>
    roomAliases[r].includes(text),
  );
  return named && named !== room ? travel(named) : raw;
}

type Found =
  | { kind: "entity"; id: string }
  | { kind: "person"; person: (typeof people)[number] }
  | { kind: "scenery"; room: Room; item: Scenery };
// Real objects first, then people, then scenery in this room before others.
function findNoun(s: TrialState, noun: string): Found | undefined {
  const ids = entityCandidates(s, noun);
  if (ids.length) return { kind: "entity", id: ids[0] };
  const person = people.find((p) => p.aliases.includes(noun));
  if (person) return { kind: "person", person };
  const here = s.room as Room;
  const order = [here, ...(Object.keys(scenery) as Room[])];
  for (const room of order) {
    const item = scenery[room].find((i) => i.aliases.includes(noun));
    if (item) return { kind: "scenery", room, item };
  }
  return undefined;
}

// Standard verbs, resolved before conversation and only for nouns that are
// not real objects. Every reply is one line and changes nothing.
export function standardAction(
  s: TrialState,
  text: string,
  present: (actor: string) => boolean,
): InteractionResult | undefined {
  const c = parseCommand(text);
  const room = s.room as Room;
  const free = (line: string, intent: string): InteractionResult => ({
    lines: [line],
    minutes: 0,
    intent,
  });
  const refuse = (
    line: string,
    stage: Failure["stage"],
    token: string,
  ): InteractionResult => ({
    lines: [line],
    failed: true,
    intent: `vocabulary:${stage}`,
    failure: { stage, token },
  });
  const first = text.split(" ")[0];
  if (
    compass.includes(text) ||
    (goForms.includes(first) && compass.includes(c.direct))
  )
    return free(
      `No compass directions here. You can go to ${spokenList(nearby[room])}.`,
      "travel:compass",
    );
  if (room === "bar" && /^leave(?: the (?:bar|velvet corner))?$/.test(text))
    return free(
      "Outside is the secondhand shop next door and the way home. Say SHOP or HOME.",
      "travel:outside",
    );
  if (roomAliases[room].includes(text))
    return free(`You're already at ${spoken[room]}.`, "travel:here");
  const sense = (Object.keys(senseForms) as Sense[]).find((v) =>
    senseForms[v].includes(first),
  );
  if (sense) {
    // Bare LISTEN keeps its silence meaning while Sable's decision is pending.
    if (
      sense === "listen" &&
      !c.direct &&
      activeInteraction(s)?.kind === "decision"
    )
      return undefined;
    return free(senses[room][sense], `sense:${sense}`);
  }
  const noun = c.direct.replace(preposition, "");
  if (!noun) return undefined;
  if (touchForms.includes(first)) {
    const found = findNoun(s, noun);
    if (!found) return undefined;
    if (found.kind === "person")
      return present(found.person.id)
        ? refuse(
            `${found.person.name} is a person; ask first.`,
            "refused",
            found.person.id,
          )
        : refuse(
            `${found.person.name} isn't here.`,
            "not-here",
            found.person.id,
          );
    if (found.kind === "entity")
      return visibleAt(s.entities, found.id, s.room)
        ? free(
            `You run a hand over the ${s.entities[found.id].name}.`,
            "sense:touch",
          )
        : undefined;
    return found.room === room
      ? free(`You run a hand over the ${found.item.aliases[0]}.`, "sense:touch")
      : undefined;
  }
  if (examineVerbs.includes(c.verb) && examineForms.includes(first)) {
    const found = findNoun(s, noun);
    if (!found || found.kind === "entity") return undefined;
    if (found.kind === "person")
      return present(found.person.id)
        ? free(found.person.description, "examine:person")
        : refuse(
            `${found.person.name} isn't here.`,
            "not-here",
            found.person.id,
          );
    return found.room === room
      ? free(found.item.description, "examine:scenery")
      : undefined;
  }
  return undefined;
}

// Classify a failed verb or object resolution. The message text is the
// existing one; a later pass rewrites the wording per stage.
export function unresolved(
  s: TrialState,
  c: Command,
  kind: "action" | "object",
  present: (actor: string) => boolean,
): InteractionResult {
  const noun = c.direct.replace(preposition, "");
  const known = trialVerbs.includes(c.verb);
  const whole = c.raw.replace(/^(?:the|a|an|my) /, "");
  const found = noun
    ? findNoun(s, noun)
    : known
      ? undefined
      : findNoun(s, whole);
  const here =
    found?.kind === "entity"
      ? visibleAt(s.entities, found.id, s.room)
      : found?.kind === "person"
        ? present(found.person.id)
        : found?.room === s.room;
  const stage: Failure["stage"] = !known
    ? found
      ? "partial"
      : "unknown-verb"
    : !noun
      ? "partial"
      : found
        ? here
          ? "refused"
          : "not-here"
        : drinkWords.includes(noun)
          ? "not-here"
          : topicWords.includes(noun) ||
              Object.values(roomAliases).some((a) => a.includes(noun))
            ? "not-a-thing"
            : "unknown-word";
  const token =
    stage === "unknown-verb" ? c.verb : noun || (found ? whole : c.verb);
  const failure = { stage, token };
  return kind === "object"
    ? {
        lines: [unknownObject],
        failed: true,
        clarified: true,
        intent: "action:unknown-object",
        failure,
      }
    : { lines: [unplaced], failed: true, failure };
}
