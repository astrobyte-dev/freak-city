import {
  availableChoices,
  choiceEnabled,
  choose,
  getPassages,
  newGame,
  updateBoundary,
  validateSave,
} from "../src/engine/game";
import { scenes } from "../src/content/scenes";
import { themes, type GameState } from "../src/engine/types";
export const routes: Record<string, string[]> = {
  honest: [
    "enter",
    "truth",
    "bar",
    "tea",
    "find_mara",
    "protect_mara",
    "chips",
    "friends",
    "commit",
    "loading_bay",
    "protect_witness",
    "fare",
    "mara_private",
    "hold_history",
    "confront_sender",
    "boundary_sender",
    "choose_redact",
    "redact_done",
    "mirror_ask",
    "reply_mara",
    "reflect",
    "reflect_truth",
    "motel_hook",
    "motel_protect",
  ],
  reckless: [
    "enter",
    "lie",
    "wardrobe",
    "formal",
    "coffee",
    "find_celeste",
    "take_pass",
    "commit",
    "upstairs",
    "object",
    "leverage",
    "face_luca",
    "double_down",
    "open_proof",
    "confront_sender",
    "debt_sender",
    "choose_bargain",
    "bargain_done",
    "mirror_angry",
    "home",
    "reflect",
    "reflect_truth",
    "motel_hook",
    "motel_power",
  ],
  curious: [
    "ask_driver",
    "truth",
    "bar",
    "water",
    "find_luca",
    "sympathy",
    "promise_publish",
    "commit",
    "loading_bay",
    "copy_dates",
    "arrange",
    "archive_now",
    "ask_before",
    "confront_sender",
    "boundary_sender",
    "choose_publish",
    "publish_done",
    "mirror_accept",
    "home",
    "reflect",
    "reflect_truth",
    "motel_hook",
    "motel_public",
  ],
  guarded: [
    "circle",
    "street_door",
    "private",
    "bar",
    "water",
    "commit",
    "neither",
    "keep_distance",
    "outside_read",
    "open_proof",
    "focus_ledger",
    "choose_withhold",
    "withhold_done",
    "mirror_silence",
    "home",
    "reflect",
    "reflect_unknown",
    "end_withheld",
  ],
  boundaries: [
    "enter",
    "truth",
    "bar",
    "tea",
    "find_inez",
    "help_inez",
    "ask_copy",
    "commit",
    "loading_bay",
    "copy_dates",
    "fare",
    "archive_now",
    "open_proof",
    "confront_sender",
    "boundary_sender",
    "choose_redact",
    "redact_done",
    "mirror_ask",
    "home",
    "reflect",
    "reflect_truth",
    "end_protected",
  ],
};
routes.investigator = [...routes.honest];
export function playRoute(name: string, seed = "948-ASH-17") {
  let state = newGame(seed);
  state.alias = "Ash";
  state.started = true;
  if (name === "boundaries")
    for (const t of themes) state = updateBoundary(state, t, "skip");
  let words = 0;
  const transcript: string[] = [];
  for (const id of routes[name].flatMap((id) =>
    [
      "boundary_sender",
      "debt_sender",
      "distance_sender",
      "focus_ledger",
    ].includes(id)
      ? name === "investigator"
        ? [
            id,
            ...(state.variant === "carbon"
              ? ["investigate_carbon", "mara_tells"]
              : state.variant === "proxy"
                ? ["investigate_proxy", "refuse_proxy"]
                : ["investigate_letter", "ask_contact"]),
            "respect_no",
            "write_account",
          ]
        : [id, "decide_now"]
      : [id],
  )) {
    words += getPassages(state)
      .map((p) => p.text.split(/\s+/).length)
      .reduce((a, b) => a + b, 0);
    const c = availableChoices(state).find((c) => c.id === id);
    if (!c || !choiceEnabled(state, c))
      throw new Error(
        `${name}/${seed}: ${id} unavailable at ${state.scene} (${state.time}); valid: ${availableChoices(
          state,
        )
          .filter((c) => choiceEnabled(state, c))
          .map((c) => c.id)
          .join(", ")}`,
      );
    transcript.push(`${state.scene} → ${id}`);
    state = choose(state, id);
    validateSave(JSON.parse(JSON.stringify(state)));
  }
  words += getPassages(state)
    .map((p) => p.text.split(/\s+/).length)
    .reduce((a, b) => a + b, 0);
  if (!scenes[state.scene].ending)
    throw new Error(`${name} did not reach an ending`);
  return { state, words, transcript };
}
export function walkChoices(s: GameState, ids: string[]) {
  return ids.reduce((s, id) => choose(s, id), s);
}
