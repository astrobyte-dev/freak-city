import { normalize, distance } from "../engine/language";
import type {
  ActorDefinition,
  BeverageDefinition,
  DrinkKind,
  TopicDefinition,
} from "./interaction-model";

export const words = (text: string, phrase: string) =>
  ` ${text} `.includes(` ${phrase} `);
export function interactionText(raw: string) {
  return normalize(raw)
    .replace(/\b(dosen't|doesnt|dosent)\b/g, "doesn't")
    .replace(
      /\b(cant|dont|wont|ill|im)\b/g,
      (w) =>
        ({
          cant: "can't",
          dont: "don't",
          wont: "won't",
          ill: "i'll",
          im: "i'm",
        })[w]!,
    )
    .replace(/^(?:actually|sorry|please|okay|ok)\s+/, "")
    .replace(/\s+please\b/g, "");
}
export function addressedSpeech(text: string, actors: ActorDefinition[]) {
  let body = text,
    actor: string | undefined;
  const named = actors.filter((a) =>
    a.aliases.some((alias) => words(text, normalize(alias))),
  );
  // Bounded correction of an explicit name position, using declared vocabulary.
  const position = body.match(
    /^(?:(?:hi|hello|hey|thanks|thank you|ask|tell|talk to|talk with) )?([a-z]+)\b/,
  );
  if (!named.length && position) {
    const near = actors.filter((a) =>
      a.aliases.some(
        (alias) =>
          alias.length >= 4 && distance(position[1], normalize(alias)) === 1,
      ),
    );
    if (near.length === 1) {
      body = body.replace(position[1], normalize(near[0].aliases[0]));
      named.push(near[0]);
    }
  }
  if (named.length === 1) {
    actor = named[0].id;
    for (const alias of named[0].aliases.map(normalize)) {
      for (const lead of [
        "",
        "hi ",
        "hello ",
        "hey ",
        "thanks ",
        "thank you ",
        "ask ",
        "tell ",
      ]) {
        if (body.startsWith(lead + alias + " ")) {
          const prefix = lead === "ask " || lead === "tell " ? lead : "";
          body = prefix + body.slice((lead + alias + " ").length);
        }
      }
      if (body.endsWith(" " + alias)) body = body.slice(0, -alias.length - 1);
    }
    body = body.replace(/^(?:please|actually) /, "");
  }
  return { body, actor, competingActors: named.length > 1 };
}
export const qualified = (s: string) =>
  /\b(maybe|perhaps|might|possibly|unless|if|but|or|not sure|don't know|do not know|uncertain)\b/.test(
    s,
  );
export const negated = (s: string) =>
  /\b(no|not|never|don't|do not|doesn't|does not|didn't|did not|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|can't|cannot|won't|will not)\b/.test(
    s,
  );
export const hesitation = (s: string) =>
  /^(?:(?:well|oh) )?(?:maybe|perhaps|possibly|i(?:'m| am) not sure|not sure|i (?:don't|do not) know)(?: yet| about (?:it|that|the offer))?$/.test(
    s,
  );
export const explicitTeasing = (s: string) =>
  /\b(?:just joking|only joking|just kidding|only kidding|i'm teasing|i am teasing)\b/.test(
    s,
  );

/** Resolve a declared predicate before discourse particles such as yes/no. */
export function opinionMeaning(s: string, topic: TopicDefinition) {
  if (hesitation(s) || qualified(s)) return "uncertain" as const;
  const clause = s.replace(/^(?:yes|no|yeah|yep)\s+/, "");
  const judgments: ("positive" | "negative")[] = [];
  for (const value of ["positive", "negative"] as const) {
    for (const adjective of topic.judgments?.[value] ?? []) {
      if (!words(clause, adjective)) continue;
      const prefix = clause.slice(0, clause.indexOf(adjective));
      const denial =
        /\b(?:not|never|doesn't|isn't|don't|does not|is not|do not)\b/.test(
          prefix,
        );
      judgments.push(
        denial ? (value === "positive" ? "negative" : "positive") : value,
      );
    }
  }
  if (new Set(judgments).size > 1) return "ambiguous" as const;
  if (judgments.length) return judgments[0];
  if (/\b(?:not|don't|do not) disagree\b/.test(s)) return "ambiguous" as const;
  return polarity(s);
}
export function polarity(
  s: string,
): "positive" | "negative" | "uncertain" | undefined {
  if (qualified(s)) return "uncertain";
  const negative = negated(s) || /\b(disagree|decline|refuse)\b/.test(s);
  const positive =
    /\b(yes|yeah|yep|certainly|agree|definitely|absolutely|sure)\b/.test(s);
  if (negative && /^yes\b/.test(s)) return "uncertain";
  return negative ? "negative" : positive ? "positive" : undefined;
}
export const isFollowup = (s: string) =>
  /^(tell me more(?: about .+)?|what else(?: do you remember)?|go on|and then|why|what do you mean(?: by (?:it|that))?|what do you think(?: (?:of|about) (?:it|that))?|what does (?:it|that) mean|how(?:'s| is) (?:it|that) going)$/.test(
    s,
  );
export function namedSubjects(s: string, topics: TopicDefinition[]) {
  // A specific authored name owns its span: "closing party" is not also
  // the separate "party" topic. Separate mentions still compete normally.
  const matches = topics.flatMap((topic) =>
    topic.aliases.flatMap((alias) => {
      const name = normalize(alias);
      const found: { topic: TopicDefinition; start: number; end: number }[] =
        [];
      for (
        let start = s.indexOf(name);
        start >= 0;
        start = s.indexOf(name, start + 1)
      ) {
        const end = start + name.length;
        if (
          (!start || s[start - 1] === " ") &&
          (end === s.length || s[end] === " ")
        )
          found.push({ topic, start, end });
      }
      return found;
    }),
  );
  return topics.filter((topic) =>
    matches.some(
      (m) =>
        m.topic === topic &&
        !matches.some(
          (other) =>
            other.start <= m.start &&
            other.end >= m.end &&
            other.end - other.start > m.end - m.start,
        ),
    ),
  );
}
export function beveragesIn(
  s: string,
  definitions: BeverageDefinition[],
): DrinkKind[] {
  return definitions
    .filter((d) => d.aliases.some((a) => words(s, normalize(a))))
    .map((d) => {
      const variant = d.variant;
      if (!variant) return d.kind;
      const omitted =
        variant.words.some((w) =>
          new RegExp(`(?:no|without)(?: any)? (?:${w})\\b`).test(s),
        ) || /alcohol free|non alcoholic|zero proof/.test(s);
      return !omitted && variant.words.some((w) => words(s, w))
        ? variant.kind
        : d.kind;
    });
}
export type ObjectRequest = {
  verb:
    | "take"
    | "examine"
    | "sip"
    | "finish"
    | "drop"
    | "put"
    | "open"
    | "close"
    | "show"
    | "give";
  noun: string;
  destination?: string;
  person?: string;
};
export function objectRequest(s: string): ObjectRequest | undefined {
  let match = s.match(
    /^(?:take|have)(?: another| a| one more)? sip(?: of)? (.+)$/,
  );
  if (match) return { verb: "sip", noun: match[1] };
  match = s.match(
    /^(?:put|set|place|leave) (.+?) (?:down)(?: (?:on|at) (.+))?$/,
  );
  if (match) return { verb: "drop", noun: match[1], destination: match[2] };
  match = s.match(/^(?:put|set|place) (.+?) (?:in|into|on|onto) (.+)$/);
  if (match) return { verb: "put", noun: match[1], destination: match[2] };
  match = s.match(/^(show|give) (.+?) to (.+)$/);
  if (match)
    return {
      verb: match[1] as "show" | "give",
      noun: match[2],
      person: match[3],
    };
  match = s.match(
    /^(take|pick up|get|examine|inspect|read|look at|look|sip|drink|finish|drop|put down|set down|open|close) (.+)$/,
  );
  if (!match) return undefined;
  const aliases: Record<string, ObjectRequest["verb"]> = {
    "pick up": "take",
    get: "take",
    inspect: "examine",
    read: "examine",
    look: "examine",
    "look at": "examine",
    drink: "finish",
    "put down": "drop",
    "set down": "drop",
  };
  return {
    verb: aliases[match[1]] ?? (match[1] as ObjectRequest["verb"]),
    noun: match[2],
  };
}
export const nounWords = (s: string) =>
  s
    .replace(/\b(the|my|your|a|an|some|empty|another|of)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
