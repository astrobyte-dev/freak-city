// Read-only engine review: synthetic runs, stdout only, no browser/storage access.
import { newGame, validateSave } from "../src/engine/game";
import {
  ensureWorld,
  executeAliasIntroduction,
  executeCommand,
  presentNPCs,
} from "../src/engine/parser";

const arrival = ["take envelope", "go outside", "go inside", "talk Inez"];
const scenarios: Record<string, string[]> = {
  "reported-opening": [
    "take envelope",
    "look",
    "read letter",
    "read invitation",
    "open envelope",
    "read letter",
    "read invitation",
    "is there a sender?",
    "go outside",
    "enter side door",
    "examine side door",
    "knock on side door",
    "look through club window",
    "go inside",
    "talk Inez",
    "ask Inez about the paper bag",
    "kiss Inez",
    "go to toilet",
    "speak to man",
  ],
  "natural-name": [
    ...arrival,
    "say my name is Night Finch to Inez",
    "talk Inez",
  ],
  "bare-name": [...arrival, "Night Finch", "talk Inez"],
  "authored-alias-reply": [
    ...arrival,
    "say just the alias to Inez",
    "talk Inez",
  ],
  "evidence-follow-up": [
    ...arrival,
    "open envelope",
    "read invitation",
    "show invitation to Inez",
    "ask Inez who sent it",
    "where is the routing record?",
    "ask Inez where the routing record is",
    "talk Inez",
  ],
  "bar-conversation": [
    "take envelope",
    "go outside",
    "go inside",
    "go bar",
    "talk Mara",
    "yes",
    "talk Mara",
  ],
  "bar-drink-reply": [
    "take envelope",
    "go outside",
    "go inside",
    "go bar",
    "talk Mara",
    "say tea please to Mara",
    "talk Mara",
  ],
  "care-reload": [
    "take envelope",
    "go outside",
    "go inside",
    "ask Inez to watch my envelope",
    "yes please",
    "@reload",
    "take envelope",
    "talk Inez",
  ],
  "typed-alias-seam": [
    ...arrival,
    "@alias:Night Finch",
    "@reload",
    "talk Inez",
  ],
};

const runs = Object.entries(scenarios).map(([id, commands]) => {
  let state = ensureWorld(newGame("NIGHT-0"));
  const steps = commands.map((command) => {
    if (command === "@reload") {
      state = validateSave(JSON.parse(JSON.stringify(state)));
      return { command, validated: true };
    }
    const result = command.startsWith("@alias:")
      ? executeAliasIntroduction(state, command.slice(7))
      : executeCommand(state, command);
    state = result.state;
    validateSave(JSON.parse(JSON.stringify(state)));
    return {
      command,
      ok: result.ok,
      room: state.world!.room,
      time: state.time,
      passages: state.world!.transcript.at(-1)!.passages,
      present: presentNPCs(state),
      envelopeLocation: state.world!.entities.envelope.location,
      alias: state.alias,
      chosenAlias: state.npcs.inez.memories.chosenAlias ?? null,
      lastPerson: state.world!.lastPerson,
      lastTopic: state.world!.lastTopic,
      conversations: state.world!.conversations,
      playerKnowledge: state.canon.player,
      agreements: state.world!.social!.agreements.map((a) => ({
        id: a.id,
        status: a.status,
        due: a.due,
      })),
      validated: true,
    };
  });
  return { id, steps };
});

process.stdout.write(
  JSON.stringify(
    {
      reviewedAt: new Date().toISOString(),
      method:
        "Synthetic current-engine command probes; not a human or browser playtest. @alias uses the prototype's typed engine seam, not the main text UI.",
      runs,
    },
    null,
    2,
  ) + "\n",
);
