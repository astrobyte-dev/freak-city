import { currentDrink } from "./vessels";
import { z } from "zod";
import type { StorageLike } from "../engine/save";
import { transcriptEntry, type TrialState } from "./state";
import { trialClock } from "./engine";
import { rooms } from "./content";
import { TRIAL_PLAYTEST } from "./save";

const reason = z.enum([
  "start",
  "resume",
  "bookmark",
  "import",
  "restart",
  "history-revised",
]);
export type BoundaryReason = z.infer<typeof reason>;
const archiveSchema = z.object({
  format: z.literal(1),
  segments: z.array(
    z.object({
      id: z.number().int().positive(),
      reason,
      alias: z.string(),
      seed: z.string(),
      at: z.number(),
      room: z.string(),
      inheritedEntries: z.number().int().nonnegative(),
      note: z.string(),
      entries: z.array(transcriptEntry),
    }),
  ),
});
export type PlaytestArchive = z.infer<typeof archiveSchema>;
export const emptyArchive = (): PlaytestArchive => ({
  format: 1,
  segments: [],
});
export function capturePlaytest(
  archive: PlaytestArchive,
  state: TrialState,
  boundary?: BoundaryReason,
): PlaytestArchive {
  const next = structuredClone(archive),
    last = next.segments.at(-1);
  const matches =
    last &&
    last.alias === state.alias &&
    last.seed === state.seed &&
    last.entries.every(
      (entry, i) =>
        JSON.stringify(entry) === JSON.stringify(state.transcript[i]),
    );
  if (!boundary && matches) {
    last.entries = structuredClone(state.transcript);
    return next;
  }
  const actualReason = boundary ?? (last ? "history-revised" : "resume");
  const inherited =
    actualReason === "start" || actualReason === "restart"
      ? 0
      : state.transcript.length;
  next.segments.push({
    id: (last?.id ?? 0) + 1,
    reason: actualReason,
    alias: state.alias,
    seed: state.seed,
    at: state.time,
    room: state.room,
    inheritedEntries: inherited,
    note:
      actualReason === "start"
        ? "New run recorded from its opening."
        : actualReason === "restart"
          ? "Restart: this is a separate run. Earlier segments, if retained, belong to the previous run."
          : actualReason === "bookmark"
            ? "Bookmark restored. The snapshot history below is a replayed prefix, not newly performed actions. The abandoned branch remains in the previous segment."
            : actualReason === "import"
              ? "Imported snapshot: its existing transcript is included separately. History outside that save is unavailable here."
              : actualReason === "history-revised"
                ? "The saved transcript changed outside normal command progression (for example, restored or redacted). A separate segment avoids claiming continuity."
                : "Existing saved transcript recovered. Earlier restore/restart boundaries and history not present in this save are unavailable.",
    entries: structuredClone(state.transcript),
  });
  return next;
}
export function loadPlaytest(
  storage: StorageLike,
  state: TrialState | null,
): PlaytestArchive {
  let archive = emptyArchive();
  try {
    const raw = storage.getItem(TRIAL_PLAYTEST);
    if (raw) archive = archiveSchema.parse(JSON.parse(raw));
  } catch {
    /* Never invent unavailable history. */
  }
  return state ? capturePlaytest(archive, state) : archive;
}
export function savePlaytest(storage: StorageLike, archive: PlaytestArchive) {
  storage.setItem(TRIAL_PLAYTEST, JSON.stringify(archiveSchema.parse(archive)));
}
function literal(text: string) {
  const runs = text.match(/`+/g) ?? [];
  const fence = "`".repeat(Math.max(3, ...runs.map((s) => s.length + 1)));
  return `${fence}text\n${text}\n${fence}`;
}
export function buildPlaytestExport(
  state: TrialState,
  archive: PlaytestArchive,
  note = "",
  build: { appVersion?: string; baseCommit?: string } = {},
) {
  // Pure snapshot: no storage access, simulation commands, downloads, dates or clocks.
  const history = capturePlaytest(archive, state);
  const markdown = [
    "# FREAK // CITY — Sable playtest",
    "Readable playtest report, not a restorable save. Only player-visible story responses are included below. Commands are reproduced exactly as recorded.",
    "## Player note",
    note ? literal(note) : "No note supplied.",
    "## Recording limits",
    "Older entries may lack location, command-resolution diagnostics and exact original submission boundaries. Those values are marked unavailable, never reconstructed. A restored/imported snapshot repeats its own prefix under an explicit branch boundary. Simulation time is not wall-clock time.",
  ];
  for (const segment of history.segments) {
    markdown.push(
      `## Segment ${segment.id} — ${segment.reason}`,
      segment.note,
      `Boundary at ${trialClock(segment.at)} · ${rooms[segment.room as keyof typeof rooms] ?? "location unavailable"}`,
      `Alias: ${segment.alias}`,
    );
    for (const [i, entry] of segment.entries.entries()) {
      if (i === 0 && segment.inheritedEntries)
        markdown.push("### Restored / recovered snapshot history");
      if (i === segment.inheritedEntries && segment.inheritedEntries)
        markdown.push("### Actions after this boundary");
      markdown.push(
        `### ${trialClock(entry.at)} · ${entry.room ? rooms[entry.room] : "Location not recorded"}`,
      );
      if (entry.command)
        markdown.push("Submitted command:", literal(entry.command));
      else markdown.push("Opening / visible story text:");
      // Literal blocks preserve every response, order, punctuation and Markdown-like input.
      for (const line of entry.lines) markdown.push(literal(line));
    }
  }
  const diagnostic = {
    kind: "freak-city-sable-playtest-diagnostic",
    reportSchema: 1,
    warning:
      "STORY SPOILERS AND INTERNAL STATE. Diagnostic report, not a directly importable save. The separate Export trial save control creates restorable saves.",
    identifiers: {
      campaign: state.campaign,
      saveVersion: state.version,
      saveRevision: state.revision,
      recordingFormat: history.format,
      trialBuild: "sable-evening-4",
      appVersion: build.appVersion ?? "not supplied",
      baseCommit: build.baseCommit ?? "not supplied",
    },
    note,
    recordingLimits:
      "Per-command diagnostics and locations exist only where recorded. Missing older data has not been inferred. No unrelated storage or machine metadata is collected.",
    state: structuredClone(state),
    events: {
      pending: state.events.filter((e) => e.status === "pending"),
      completed: state.events.filter((e) => e.status === "fired"),
      cancelled: state.events.filter((e) => e.status === "cancelled"),
    },
    custody: Object.values(state.entities).map((e) => ({
      id: e.id,
      location: e.location,
      owner: e.owner ?? null,
      destroyed: e.destroyed,
    })),
    knowledge: { actors: state.actors, provenance: state.observations },
    conversation: {
      context: state.context ?? null,
      preference: state.preference ?? null,
      servedDrink: currentDrink(state) ?? null,
    },
    sable: {
      receipt: state.receipt ?? null,
      decision: state.decision ?? null,
      completed: state.completed ?? null,
      treatment: state.treatment,
    },
    history,
  };
  return {
    markdown: markdown.join("\n\n") + "\n",
    diagnostic: JSON.stringify(diagnostic, null, 2) + "\n",
  };
}
