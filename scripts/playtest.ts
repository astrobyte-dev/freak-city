import { pairs, playExpandedRoute } from "../tests/expanded-routes";
import { playRoute, routes } from "../tests/routes";
import {
  availableChoices,
  choiceEnabled,
  choose,
  getPassages,
  hashSeed,
  newGame,
  validateSave,
} from "../src/engine/game";
import { scenes } from "../src/content/scenes";
import { writeFileSync } from "node:fs";
const results = Object.keys(routes).flatMap((name) =>
  ["NIGHT-0", "NIGHT-1", "NIGHT-2"].map((seed) => {
    const { state, words, transcript } = playRoute(name, seed);
    return {
      archetype: name,
      seed,
      variant: state.variant,
      ending: state.scene,
      choices: state.history.length,
      wordsSeen: words,
      readingMinutesAt200Wpm: Math.round(words / 200),
      missedExchange: !!state.flags.missedExchange,
      missedWitness: !!state.flags.missedWitness,
      hiddenScene: state.visited.includes("hidden"),
      verifiedFacts: state.canon.player,
      transcript,
    };
  }),
);
const expandedResults = pairs.flatMap((pair, i) =>
  ["NIGHT-0", "NIGHT-1", "NIGHT-2"].map((seed, j) => {
    const style =
      i === 2 ? "rare" : j === 1 ? "boundaries" : j === 2 ? "guarded" : "warm";
    const { state, words, transcript, phoneWordsAvailable } = playExpandedRoute(
      pair,
      seed,
      style,
      [
        "honest",
        "reckless",
        "curious",
        "guarded",
        "boundaries",
        "investigator",
      ][i],
    );
    return {
      pair,
      seed,
      style,
      variant: state.variant,
      ending: state.scene,
      choices: state.history.length,
      wordsSeen: words,
      phoneWordsAvailable,
      estimatedMinutes: {
        at200WpmPlus15SecondsPerChoice: Math.round(
          words / 200 + state.history.length / 4,
        ),
        at250WpmPlus10SecondsPerChoice: Math.round(
          words / 250 + state.history.length / 6,
        ),
      },
      transcript,
      visited: state.visited,
    };
  }),
);
const coverage = new Set<string>([
  ...results.flatMap((r) => r.transcript.map((t) => t.split(" → ")[0])),
  ...expandedResults.flatMap((r) => r.visited),
]);
const endings = new Set<string>();
let longest = 0;
for (let run = 0; run < 250; run++) {
  let s = newGame(`fuzz-${run}`),
    steps = 0;
  let h = hashSeed(s.seed);
  while (!scenes[s.scene].ending && steps < 100) {
    coverage.add(s.scene);
    const valid = availableChoices(s).filter((c) => choiceEnabled(s, c));
    if (!valid.length) throw new Error(`Dead end at ${s.scene}`);
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const c = valid[(h >>> 12) % valid.length];
    s = choose(s, c.id);
    validateSave(JSON.parse(JSON.stringify(s)));
    getPassages(s);
    steps++;
  }
  if (!scenes[s.scene].ending)
    throw new Error(`Nonterminating campaign: ${s.seed} at ${s.scene}`);
  coverage.add(s.scene);
  endings.add(s.scene);
  longest = Math.max(longest, steps);
}
const report = {
  scriptedRuns: results.length,
  expandedRuns: expandedResults.length,
  coverageSource: "scripted short and expanded routes plus randomized walks",
  expandedRoutes: expandedResults,
  fuzzRuns: 250,
  endings: [...endings],
  sceneCoverage: `${coverage.size}/${Object.keys(scenes).length}`,
  unvisitedScenes: Object.keys(scenes).filter((s) => !coverage.has(s)),
  maximumChoices: longest,
  routes: results,
};
writeFileSync(
  "artifacts/playtest-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      ...report,
      expandedRoutes: expandedResults.map(
        ({ transcript, visited, ...rest }) => rest,
      ),
      routes: results.map(({ transcript, verifiedFacts, ...rest }) => rest),
    },
    null,
    2,
  ),
);
