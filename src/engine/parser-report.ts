import type { GameState } from "./types";
import { parseCommand } from "./language";
import { rooms, createEntities } from "../content/spaces";
function frequency(values: string[]) {
  const counts: Record<string, number> = Object.create(null);
  for (const value of values)
    if (value) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    ),
  );
}
/** Local analysis only: exported commands may contain the player's own words. */
export function parserGapReport(states: GameState[]) {
  const entries = states.flatMap(
    (s) => s.world?.transcript.filter((e) => e.command) ?? [],
  );
  const failures = entries.filter((e) => e.failed);
  const entities =
    states[0]?.world?.entities ?? (states[0] ? createEntities(states[0]) : {});
  const coverage = Object.keys(rooms).map((room) => {
    const objects = Object.values(entities).filter((e) =>
      e.id.startsWith(`detail_${room}_`),
    );
    return {
      room,
      commands: entries.filter((e) => e.room === room).length,
      authoredDetails: objects.length,
      verbs: [...new Set(objects.flatMap((e) => e.verbs))].sort(),
    };
  });
  return {
    runs: states.length,
    commands: entries.length,
    failures: failures.length,
    outcomes: frequency(
      entries.map((e) => e.outcome ?? (e.failed ? "blocked" : "handled")),
    ),
    fallbackFrequency: entries.length
      ? entries.filter((e) => e.outcome === "fallback").length / entries.length
      : 0,
    failedVerbs: frequency(
      failures.map((e) => e.verb ?? parseCommand(e.command).verb),
    ),
    failedNouns: frequency(
      failures
        .filter((e) => e.outcome === "missing-noun")
        .map((e) => parseCommand(e.command).direct),
    ),
    failedTopics: frequency(
      failures
        .filter((e) => e.outcome === "unsupported-topic")
        .map((e) => parseCommand(e.command).topic),
    ),
    ambiguous: entries
      .filter((e) => e.outcome === "ambiguous")
      .map((e) => ({
        command: e.command,
        room: e.room,
        reply: e.passages.map((p) => p.text).join(" "),
      })),
    unsupported: failures.map((e) => ({
      command: e.command,
      verb: e.verb,
      room: e.room,
      outcome: e.outcome,
      reply: e.passages.map((p) => p.text).join(" "),
    })),
    roomCoverage: coverage,
    lowAffordanceRooms: coverage.filter((r) => r.authoredDetails < 5),
    // This is an authoring prompt, not a claim every object should contain a clue.
    genericOnlyObjects: Object.values(entities)
      .filter(
        (e) =>
          e.properties.scenery &&
          !Object.keys(e.properties).some((k) =>
            ["read", "search", "touch", "listen", "sit", "lean"].includes(k),
          ),
      )
      .map((e) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        verbs: e.verbs,
      })),
  };
}
