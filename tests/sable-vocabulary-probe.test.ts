import { it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { executeTrial } from "../src/trial/engine";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";

const reload = (s: TrialState) => validateTrial(JSON.parse(JSON.stringify(s)));
const run = (s: TrialState, ...cmds: string[]) =>
  cmds.reduce((s, c) => reload(executeTrial(s, c)), s);

const states: Record<string, string[]> = {
  bar_opening: [],
  bar_after_coffee: ["ask for drink", "coffee"],
  shop: ["go to the secondhand shop"],
  shop_seen_evidence: [
    "go to the secondhand shop",
    "look at the photograph",
    "read the provenance listing",
  ],
  bar_holding_evidence: [
    "go to the secondhand shop",
    "look at the photograph",
    "read the provenance listing",
    "take the photograph",
    "take the listing",
    "go back to the bar",
  ],
  bar_after_show: [
    "go to the secondhand shop",
    "look at the photograph",
    "read the provenance listing",
    "take the photograph",
    "take the listing",
    "go back to the bar",
    "Sable, did you work at the Cat's Cradle?",
    "show the photograph to Sable",
    "show Sable the provenance listing",
    "Sable, tell me about the hospital",
  ],
  booth: ["go to the quiet booth"],
  home: ["go home"],
};

const common = [
  // answering Sable's opening question
  "no", "yes", "no it doesn't sound threatening", "a little", "sounds fine to me",
  "it sounds fine", "not really", "maybe", "I think it's fine", "it's a bit much",
  // scenery from prose
  "examine pencil", "look at the pencil", "tell me about the pencil", "x counter",
  "look at the counter", "look at the glasses", "look at the shelves",
  "look at the speakers", "look behind the curtain", "examine curtain",
  "go through the curtain", "look under the counter", "look at the lids",
  "examine the box", "look at the box of lids", "look at sable", "examine sable",
  "x sable", "look at the bass line", "listen", "listen to the music",
  "smell", "smell the coffee", "touch the counter", "sit down", "sit at the counter",
  "stand up", "read menu", "read the menu", "x menu", "i", "inventory", "wait", "z",
  // ordering
  "gin", "ask for gin", "a gin please", "the special with gin", "order the special",
  "order coffee", "tea please", "can I get a tea", "can I have a coffee please",
  "another coffee", "same again", "I'll have a water", "give me water",
  "one coffee", "coffee please", "a cup of tea", "what do you have",
  "what's good", "what do you recommend", "can I see the menu", "menu",
  // conversation openers
  "hi", "hello sable", "hey", "how's it going", "how are you", "what's new",
  "what's up", "how's your night", "tell me about yourself", "who are you",
  "what do you do", "how long have you worked here", "do you like it here",
  "do you like working here", "what's the octopus for", "tell me about the prom",
  "tell me about the supplier", "what's wrong", "you seem tired", "you ok?",
  "are you alright", "nice place", "I like it here", "busy night?",
  "what's the story with the lids", "who is the supplier", "what's the special",
  "tell me about the deep sea prom", "when's the prom", "can I come to the prom",
  "what's this place called", "how long has the bar been here",
  "do you own the bar", "who owns this place", "what's next door",
  "what's in the shop", "who runs the shop", "who is vesper",
  "tell me about vesper", "do you know vesper", "what's beyond the curtain",
  "what's in the booth", "can we talk somewhere quiet", "can we talk privately",
  // expressive / social
  "smells good", "that's funny", "lol", "ha", "nice", "good one", "sorry",
  "I'm tired", "thanks", "thank you", "thanks sable", "cheers", "bye", "goodbye",
  "see you", "goodnight", "good night sable", "take care", "you're funny",
  "I like you", "you're good at this", "that was good", "great coffee",
  "this is nice", "I'm glad I came", "I missed you", "how was your day",
  // travel
  "go to shop", "shop", "next door", "go next door", "leave", "go outside",
  "go home", "home", "go to booth", "booth", "curtain", "enter booth",
  "sit in booth", "go to the quiet booth", "walk to the shop", "visit vesper",
  "go see vesper", "head home", "go back", "exit", "out", "n", "north",
  // meta
  "help", "hint", "journal", "think", "save", "quit", "look", "l",
  // misspellings
  "lok", "tlak to sable", "coffe please", "watre", "helo", "hi sabel",
];

const shopProbes = [
  "look", "x vesper", "look at vesper", "talk to vesper", "hi vesper",
  "hello", "what's this", "what is this place", "browse", "look around",
  "look at the shelves", "look at the photo", "look at the photograph",
  "who's in the photo", "who is in the photograph", "ask vesper about the photo",
  "ask vesper about the photograph", "ask vesper about sable", "vesper, who is this",
  "buy the photo", "how much is the photograph", "how much", "can I buy this",
  "take photo", "take the photograph", "examine listing", "read the listing",
  "what's the listing", "ask about the listing", "where did you get this",
  "where did this come from", "is that sable", "that's sable", "this looks like sable",
  "can I borrow this", "can I take this", "vesper, can I take the photograph",
  "show vesper the photo", "tell vesper about sable", "does vesper know sable",
  "what do you sell", "what's for sale", "do you know sable", "thanks vesper",
  "bye vesper", "go back to the bar", "bar", "back", "leave", "go to the bar",
];

const showProbes = [
  "do you remember that night", "were you there", "is this you", "that's you",
  "you were at the cat's cradle", "how do you explain this", "what do you think",
  "how are you feeling", "are you ok", "are you alright", "this is strange",
  "I'm sorry", "I didn't mean to upset you", "take your time", "it's ok",
  "we'll figure it out", "what do you want to do", "what will you do",
  "should we tell someone", "who could have done this", "why would someone do this",
  "do you want me to come with you", "I'll come with you", "I'm here for you",
  "tell me about the dream", "what do you dream about", "when did the dreams start",
  "tell me about the hospital", "what happened in hospital", "who was your doctor",
  "who's the practitioner", "can you trust them", "when is the appointment",
  "what day", "let me know how it goes", "I'll check in tomorrow", "goodnight",
  "thank you for telling me", "thanks for trusting me", "you can trust me",
  "I believe you", "I don't know what to say", "that's a lot", "sit down",
  "let's go to the booth", "can we talk in the booth", "let's talk privately",
];

// Vocabulary probe: fires natural player inputs at every reachable trial state
// and records outcome, intent and first reply line. Not an assertion suite;
// it is a measurement. Report lands in artifacts/vocabulary-probe/latest.tsv.
it("measures vocabulary coverage per state", () => {
  const rows: string[] = [];
  const fire = (label: string, base: TrialState, probes: string[]) => {
    for (const p of probes) {
      let s: TrialState;
      try {
        s = run(base, p);
      } catch (e) {
        rows.push(`${label}\tCRASH\t${p}\t${String(e).slice(0, 120)}`);
        continue;
      }
      const t = s.transcript.at(-1)!;
      const d = t.diagnostics?.[0];
      const line = t.lines.join(" | ").replace(/\s+/g, " ").slice(0, 110);
      rows.push(`${label}\t${d?.outcome ?? "?"}\t${d?.intent ?? "?"}\t${p}\t${line}`);
    }
  };
  for (const [label, path] of Object.entries(states)) {
    const base = run(newTrial(), ...path);
    fire(label, base, common);
    if (label.startsWith("shop")) fire(label, base, shopProbes);
    if (label === "bar_after_show" || label === "booth") fire(label, base, showProbes);
  }
  mkdirSync("artifacts/vocabulary-probe", { recursive: true });
  writeFileSync("artifacts/vocabulary-probe/latest.tsv", rows.join("\n"));
  const tally: Record<string, { n: number; ok: number }> = {};
  for (const r of rows) {
    const [state, outcome] = r.split("\t");
    tally[state] ??= { n: 0, ok: 0 };
    tally[state].n++;
    if (outcome === "handled") tally[state].ok++;
  }
  const lines = Object.entries(tally).map(
    ([k, v]) => `${k.padEnd(22)} ${String(v.ok).padStart(3)}/${v.n}  ${Math.round((100 * v.ok) / v.n)}%`,
  );
  console.log("\nVOCABULARY PROBE handled rate per state\n" + lines.join("\n") + "\n");
});
