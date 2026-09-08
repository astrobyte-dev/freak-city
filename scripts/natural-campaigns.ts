import { newGame, validateSave } from "../src/engine/game";
import { ensureWorld, executeCommand } from "../src/engine/parser";
import { variants } from "../src/content/world";
export const naturalStyles = {
  classic: {
    opening: [
      "examine envelope",
      "take envelope",
      "open it",
      "take invitation",
      "put it in coat",
    ],
    room: "look",
    question: "ask Mara about invitation",
    followup: "ask her why she recognised it",
  },
  casual: {
    opening: [
      "look at this envelope",
      "pick up envelope",
      "open it",
      "get invitation",
      "put it somewhere safe",
    ],
    room: "where am i",
    question: "ask Mara what she knows about it",
    followup: "ask her where she saw it before",
  },
  messy: {
    opening: [
      "whats up with this envlope",
      "taek envelope",
      "open it",
      "get invitation",
      "put it away",
    ],
    room: "whos here",
    question: "ask mara what the hell is going on",
    followup: "ask her y she knows it",
  },
  direct: {
    opening: [
      "check envelope",
      "take envelope",
      "open envelope",
      "take invitation",
      "put invitation in coat",
    ],
    room: "who's here",
    question: "ask Mara about invitation",
    followup: "mara is lying",
  },
  explorer: {
    opening: [
      "smell the room",
      "touch window",
      "peek inside envelope",
      "take envelope",
      "open it",
      "get invitation",
      "put it in coat",
    ],
    room: "have a look around",
    question: "ask mara about invitation",
    followup: "watch mara for thirty seconds",
  },
};
export function naturalCampaign(
  seed: string,
  style: keyof typeof naturalStyles,
  ending = "protect",
) {
  const voice = naturalStyles[style];
  let state = ensureWorld(newGame(seed));
  state.started = true;
  state.alias = "Ash";
  const prelude = [
    ...voice.opening,
    "go outside",
    "go inside",
    "go bar",
    voice.room,
    voice.question,
    voice.followup,
    ...(style === "direct"
      ? ["confront her"]
      : style === "explorer"
        ? ["look behind bar", "listen to what they're talking about"]
        : []),
    "stay here for five minutes",
    "wait 40",
    "go archive",
    "open service envelope",
    `read ${variants[state.variant].proof}`,
    "take ledger",
  ];
  const decision =
    ending === "protect"
      ? ["redact ledger", "go bar"]
      : ending === "public"
        ? ["go bar", "go stage", "give ledger to Luca", "go bar"]
        : ending === "power"
          ? [
              "go bar",
              "go upstairs",
              "open office door",
              "enter",
              "give ledger to Celeste",
              "leave",
              "go downstairs",
            ]
          : ["go bar"];
  for (const command of [
    ...prelude,
    ...decision,
    "go outside",
    "go home",
    "sleep",
  ]) {
    const result = executeCommand(state, command);
    if (!result.ok)
      throw new Error(
        `${seed}/${style}/${ending}: ${command}: ${result.state
          .world!.transcript.at(-1)!
          .passages.map((p) => p.text)
          .join(" ")}`,
      );
    state = result.state;
    validateSave(JSON.parse(JSON.stringify(state)));
  }
  if (
    state.flags.ending !== ending ||
    !state.flags.parserNightEnded ||
    !state.canon.player.includes("sender")
  )
    throw new Error(`${seed}/${style}/${ending}: incompatible conclusion`);
  return state;
}
