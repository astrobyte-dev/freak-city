import {
  availableChoices,
  choiceEnabled,
  choose,
  getPassages,
  newGame,
  updateBoundary,
  validateSave,
  messageReplies,
  replyMessage,
} from "../src/engine/game";
import { scenes } from "../src/content/scenes";
import { themes, type NPCId } from "../src/engine/types";
import { playRoute } from "./routes";
export const pairs: [NPCId, NPCId][] = [
  ["mara", "celeste"],
  ["mara", "luca"],
  ["mara", "inez"],
  ["celeste", "luca"],
  ["celeste", "inez"],
  ["luca", "inez"],
];
export function playExpandedRoute(
  pair: [NPCId, NPCId],
  seed = "NIGHT-0",
  style: "warm" | "guarded" | "boundaries" | "rare" = "warm",
  base = "honest",
) {
  let state = newGame(seed);
  state.started = true;
  state.alias = "Ash";
  if (style === "boundaries")
    for (const t of themes) state = updateBoundary(state, t, "skip");
  let words = 0;
  const transcript: string[] = [];
  const count = () => {
    words += getPassages(state).reduce(
      (n, p) => n + p.text.split(/\s+/).length,
      0,
    );
  };
  const step = (id: string) => {
    count();
    const old = state.scene;
    state = choose(state, id);
    if (old === state.scene) throw new Error(`Unavailable ${id} at ${old}`);
    transcript.push(`${old} → ${id}`);
    validateSave(JSON.parse(JSON.stringify(state)));
    // This script explicitly opens the phone between conversations; replies use authored availability.
    if (style !== "guarded" && /_r[78]$/.test(state.scene))
      for (const m of [...state.messages]) {
        const option = messageReplies(state, m.id).find((r) => r.id === "yes");
        if (option) state = replyMessage(state, m.id, option.id);
      }
  };
  const arc = (npc: NPCId) => {
    let guard = 0;
    while (state.scene.startsWith(`${npc}_r`) && guard++ < 14) {
      const choices = availableChoices(state).filter((c) =>
        choiceEnabled(state, c),
      );
      const rare =
        style === "rare" &&
        (state.scene === "mara_r5"
          ? "ask_leave"
          : state.scene === "inez_r5"
            ? "challenge_thread"
            : undefined);
      step(rare || choices[style === "guarded" ? choices.length - 1 : 0].id);
    }
  };
  const first = () => {
    step("take_time");
    step(`spend_${pair[0]}`);
    arc(pair[0]);
    step(`spend_${pair[1]}`);
    arc(pair[1]);
    step("enough_company");
    step("help_table");
    if (
      style === "rare" &&
      availableChoices(state).some((c) => c.id === "compare_shifts")
    ) {
      step("compare_shifts");
      step("leave_budget");
    } else step("decide_after_company");
  };
  const closing = () => {
    step("keep_promises");
    step(`spend_${pair[1]}`);
    arc(pair[1]);
    step(`spend_${pair[0]}`);
    arc(pair[0]);
    step("finish_closing");
    step("take_night_home");
  };
  for (const row of playRoute(base, seed).transcript) {
    const id = row.split(" → ")[1];
    if (state.scene === "ledger") first();
    if (state.scene === "walk") closing();
    if (state.scene === "apartment" && id === "reflect") {
      step("settle_home");
      step("reflect_after_home");
      continue;
    }
    step(id);
  }
  count();
  if (!scenes[state.scene].ending)
    throw new Error("Expanded route did not finish.");
  return {
    state,
    words,
    transcript,
    phoneWordsAvailable: state.messages.reduce(
      (n, m) => n + m.text.split(/\s+/).length,
      0,
    ),
  };
}
