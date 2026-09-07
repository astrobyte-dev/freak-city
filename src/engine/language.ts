export interface Command {
  verb: string;
  direct: string;
  indirect: string;
  topic: string;
  raw: string;
}
export const verbs = [
  "look",
  "examine",
  "go",
  "enter",
  "leave",
  "take",
  "drop",
  "put",
  "give",
  "show",
  "use",
  "open",
  "close",
  "lock",
  "unlock",
  "wear",
  "remove",
  "talk",
  "ask",
  "tell",
  "say",
  "text",
  "call",
  "wait",
  "follow",
  "watch",
  "listen",
  "read",
  "inventory",
  "phone",
  "journal",
  "map",
  "think",
  "remember",
  "help",
  "hint",
  "knock",
  "smell",
  "sit",
  "search",
  "tear",
  "accuse",
  "apologise",
  "flirt",
  "redact",
  "sleep",
];
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function distance(a: string, b: string): number {
  if (a.length === b.length) {
    const differing = Array.from(a)
      .map((c, i) => (c === b[i] ? -1 : i))
      .filter((i) => i >= 0);
    if (
      differing.length === 2 &&
      differing[1] === differing[0] + 1 &&
      a[differing[0]] === b[differing[1]] &&
      a[differing[1]] === b[differing[0]]
    )
      return 1;
  }
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = old;
    }
  }
  return row[b.length];
}
export const cleanNoun = (s: string) =>
  normalize(s)
    .replace(/^(?:the|a|an|my|your) /, "")
    .trim();
const aliases: Record<string, string> = {
  "look around": "look",
  "look at": "examine",
  "look under": "search",
  "look in": "search",
  "pick up": "take",
  "put on": "wear",
  "take off": "remove",
  "talk to": "talk",
  "speak to": "talk",
  "speak with": "talk",
  "talk with": "talk",
  "listen to": "listen",
  "listen at": "listen",
  "wait near": "wait",
  "wait by": "wait",
  "sit at": "sit",
  "sit on": "sit",
  get: "take",
  grab: "take",
  inspect: "examine",
  x: "examine",
  l: "look",
  i: "inventory",
  inv: "inventory",
  walk: "go",
  move: "go",
  travel: "go",
  head: "go",
  exit: "leave",
  depart: "leave",
  hold: "take",
  discard: "drop",
  don: "wear",
  doff: "remove",
  telephone: "call",
  message: "text",
  sms: "text",
  destroy: "tear",
  rip: "tear",
  apologize: "apologise",
  sniff: "smell",
  observe: "watch",
  z: "wait",
  recall: "remember",
};
const personPattern =
  "(?:mara(?: venn)?|celeste(?: ardent)?|luca(?: serrin)?|inez(?: vale)?|her|him|them|she|he)";
export function splitCommands(raw: string): string[] {
  const result: string[] = [];
  let quote = "",
    part = "";
  for (const c of raw.replace(/[“”]/g, '"')) {
    if (c === '"') quote = quote ? "" : c;
    if (c === ";" && !quote) {
      result.push(part.trim());
      part = "";
    } else part += c;
  }
  result.push(part.trim());
  return result
    .flatMap((s) => {
      // Do not split conversation text, including quoted or unquoted messages.
      if (/^(text|say|tell|ask|message)\b/i.test(s)) return [s];
      return s.split(
        /\s+(?:and then|then)\s+|\s+and\s+(?=(?:take|go|open|close|drop|look|wear|read|wait)\b)/i,
      );
    })
    .filter(Boolean)
    .slice(0, 12);
}
export function parseCommand(raw: string): Command {
  let line = normalize(raw).replace(
    /^(?:please |quietly |carefully |gently )+/,
    "",
  );
  line = line.replace(/^(go|follow) quietly /, "$1 ");
  if (
    /^(north|south|east|west|up|down|upstairs|downstairs|inside|outside|home|n|s|e|w|u|d)$/.test(
      line,
    )
  )
    line =
      "go " +
      ({ n: "north", s: "south", e: "east", w: "west", u: "up", d: "down" }[
        line
      ] ?? line);
  if (/^leave .+ (?:on|in|at) /.test(line))
    line = line.replace(/^leave /, "put ").replace(/ at /, " on ");
  for (const key of Object.keys(aliases).sort((a, b) => b.length - a.length))
    if (line === key || line.startsWith(key + " ")) {
      line = aliases[key] + line.slice(key.length);
      break;
    }
  let [verb, ...rest] = line.split(" ");
  if (!verbs.includes(verb) && verb.length >= 3) {
    const near = verbs.filter((v) => distance(v, verb) <= 1);
    const transposed = near.filter(
      (v) => v.split("").sort().join("") === verb.split("").sort().join(""),
    );
    if (near.length === 1) verb = near[0];
    else if (transposed.length === 1) verb = transposed[0];
  }
  let direct = rest.join(" ").replace(/^(?:to|at|with) /, ""),
    indirect = "",
    topic = "";
  if (["ask", "tell", "text", "call"].includes(verb)) {
    const match = direct.match(
      new RegExp(`^(${personPattern}|[^ ]+)\\s+(.+)$`),
    );
    if (match) {
      direct = match[1];
      topic = match[2].replace(/^about /, "");
    }
  }
  if (
    ["ask", "tell"].includes(verb) &&
    ["about", "for", "why", "what", "who", "how", "whether"].includes(direct)
  ) {
    topic = direct === "about" ? topic : `${direct} ${topic}`;
    direct = "";
  }
  if (verb === "say") {
    const recipient = direct.match(new RegExp(`^(.*) to (${personPattern})$`));
    if (recipient) {
      direct = recipient[1];
      indirect = recipient[2];
    }
  }
  if (["accuse", "apologise", "flirt"].includes(verb)) {
    const parts = direct.split(/\s+(?:of|for|about)\s+/);
    direct = parts[0];
    topic = parts.slice(1).join(" ");
  }
  if (["put", "give", "show", "use", "unlock", "lock"].includes(verb)) {
    const match = direct.match(
      /^(.+?)\s+(?:in|into|inside|on|onto|to|with|using)\s+(.+)$/,
    );
    if (match) {
      direct = match[1];
      indirect = match[2];
    } else if (["show", "give"].includes(verb)) {
      const person = direct.match(new RegExp(`^(${personPattern})\\s+(.+)$`));
      if (person) {
        indirect = person[1];
        direct = person[2];
      }
    }
  }
  if (verb === "follow")
    direct = direct.replace(
      /\s+(outside|inside|upstairs|downstairs)$/,
      (_, direction) => {
        indirect = direction;
        return "";
      },
    );
  if (verb === "wait") direct = direct.replace(/^for /, "");
  if (verb === "go")
    direct = direct.replace(/^(?:to|towards|into|through) /, "");
  return {
    verb,
    direct: cleanNoun(direct),
    indirect: cleanNoun(indirect),
    topic,
    raw,
  };
}
