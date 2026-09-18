import { newGame, validateSave } from "../src/engine/game";
import {
  ensureWorld,
  executeCommand,
  executeAliasIntroduction,
  isCarried,
  isVisible,
  presentNPCs,
  transcriptText,
} from "../src/engine/parser";
import { agreementFor, clockLabel } from "../src/engine/commitments";
import type { GameState } from "../src/engine/types";
import type { Point } from "./navigation";

export type ActionId =
  | "take"
  | "place"
  | "examine"
  | "talk"
  | "alias"
  | "open"
  | "close"
  | "read"
  | "show-invitation"
  | "ask-sender"
  | "ask-care"
  | "accept-care"
  | "decline-care"
  | "think"
  | "wait";
export type TargetId =
  "inez" | "envelope" | "invitation" | "ledge" | "bench" | "notice" | "heater";
export interface Target {
  id: TargetId;
  label: string;
  position: Point;
  approach: Point;
}
export type Action =
  | { id: "alias"; target: "inez"; alias: string }
  | { id: Exclude<ActionId, "alias">; target?: TargetId };
const entityIds = {
  envelope: "envelope",
  invitation: "invitation",
  ledge: "ledge",
  bench: "detail_vestibule_bench",
  notice: "detail_vestibule_notice",
  heater: "detail_vestibule_heater",
};
export const labels: Record<ActionId, string> = {
  take: "Take envelope",
  place: "Place envelope on ledge",
  examine: "Examine",
  talk: "Talk to Inez",
  alias: "Use this alias only",
  open: "Open envelope",
  close: "Close envelope",
  read: "Read invitation",
  "show-invitation": "Show invitation to Inez",
  "ask-sender": "Ask who sent the invitation",
  "ask-care": "Ask Inez to watch the envelope",
  "accept-care": "Yes, please",
  "decline-care": "No, thanks",
  think: "Private thought",
  wait: "Wait one minute",
};
export function createFixture(): GameState {
  // Reach this room and acquire the item legally; no fixture grants or teleports.
  let s = ensureWorld(newGame("NIGHT-0"));
  for (const command of [
    "take envelope",
    "go outside",
    "go inside",
    "put envelope on ledge",
  ]) {
    const result = executeCommand(s, command);
    if (!result.ok) throw new Error(`Fixture setup failed: ${command}`);
    s = result.state;
  }
  return validateSave(s);
}
export function targets(s: GameState): Target[] {
  if (s.world?.room !== "vestibule") return [];
  const result: Target[] = [];
  if (presentNPCs(s).includes("inez"))
    result.push({
      id: "inez",
      label: "Inez",
      position: { x: 790, y: 390 },
      approach: { x: 750, y: 430 },
    });
  const objects: Target[] = [
    {
      id: "ledge",
      label: "Dry ledge",
      position: { x: 740, y: 270 },
      approach: { x: 740, y: 330 },
    },
    {
      id: "bench",
      label: "Bench",
      position: { x: 480, y: 325 },
      approach: { x: 480, y: 410 },
    },
    {
      id: "notice",
      label: "Toilet notice",
      position: { x: 112, y: 180 },
      approach: { x: 140, y: 180 },
    },
    {
      id: "heater",
      label: "Heater",
      position: { x: 212, y: 270 },
      approach: { x: 280, y: 280 },
    },
  ];
  for (const target of objects)
    if (isVisible(s, entityIds[target.id as keyof typeof entityIds]))
      result.push(target);
  const envelope = s.world.entities.envelope;
  if (isVisible(s, "envelope") && !isCarried(s, "envelope")) {
    if (envelope.location === "ledge")
      result.push({
        id: "envelope",
        label: "Black envelope",
        position: { x: 775, y: 225 },
        approach: { x: 740, y: 330 },
      });
    else if (envelope.location === "vestibule")
      result.push({
        id: "envelope",
        label: "Black envelope",
        position: { x: 480, y: 460 },
        approach: { x: 480, y: 480 },
      });
  }
  return result;
}
export function introduced(s: GameState) {
  return !!s.npcs.inez.memories.chosenAlias;
}
export function invitationRead(s: GameState) {
  return s.canon.player.includes("header");
}
export function invitationShown(s: GameState) {
  return !!s.npcs.inez.memories["show:invitation"];
}
export function waitingForAlias(s: GameState) {
  return (
    !introduced(s) &&
    s.world?.encounters.vestibule === "door" &&
    !s.world.consumed.includes("intent:door:private")
  );
}
export function availableActions(s: GameState, target?: TargetId): ActionId[] {
  if (s.world?.room !== "vestibule") return [];
  if (!target) return ["think", "wait"];
  const canShow =
    introduced(s) &&
    invitationRead(s) &&
    isVisible(s, "invitation") &&
    isCarried(s, "invitation") &&
    presentNPCs(s).includes("inez") &&
    !s.world.social?.offer;
  if (target === "invitation") {
    if (!isVisible(s, "invitation")) return [];
    return ["read", ...(canShow ? ["show-invitation" as const] : [])];
  }
  if (target === "envelope") {
    if (!isVisible(s, "envelope")) return [];
    return [
      "examine",
      ...(isCarried(s, "envelope") ? [] : ["take" as const]),
      s.world.entities.envelope.open ? "close" : "open",
      ...(isVisible(s, "invitation") ? ["read" as const] : []),
    ];
  }
  if (!targets(s).some((t) => t.id === target)) return [];
  if (target === "inez") {
    if (s.world.social?.offer) return ["accept-care", "decline-care"];
    return [
      "talk",
      ...(waitingForAlias(s) ? ["alias" as const] : []),
      ...(canShow ? ["show-invitation" as const] : []),
      ...(introduced(s) && invitationRead(s) && invitationShown(s)
        ? ["ask-sender" as const]
        : []),
      ...(isCarried(s, "envelope") && !agreementFor(s)
        ? ["ask-care" as const]
        : []),
    ];
  }
  if (target === "ledge")
    return ["examine", ...(isCarried(s, "envelope") ? ["place" as const] : [])];
  return ["examine"];
}
// Compatibility seam: parser.ts exports handlers but no complete structured
// transaction. Fixed explicit nouns preserve its custody, care, rollback,
// clock, boundary and observation hooks. Never interpolate UI labels or prose.
export function commandFor(action: Action): string {
  switch (action.id) {
    case "take":
      return "take envelope";
    case "place":
      return "put envelope on ledge";
    case "talk":
      return "talk Inez";
    case "alias":
      return "say just the alias to Inez";
    case "open":
      return "open envelope";
    case "close":
      return "close envelope";
    case "read":
      return "read invitation";
    case "show-invitation":
      return "show invitation to Inez";
    case "ask-sender":
      return "ask Inez who sent the invitation";
    case "ask-care":
      return "ask Inez to keep my envelope while I visit the bar";
    case "accept-care":
      return "yes please";
    case "decline-care":
      return "no thanks";
    case "think":
      return "think about invitation";
    case "wait":
      return "wait one minute";
    case "examine":
      return `examine ${entityIds[action.target as keyof typeof entityIds]}`;
  }
}
export function dispatch(s: GameState, action: Action) {
  if (!availableActions(s, action.target).includes(action.id))
    return {
      state: s,
      ok: false,
      lines: ["That action is no longer available. Nothing changed."],
      spokenLines: [],
    };
  const result =
    action.id === "alias"
      ? executeAliasIntroduction(s, action.alias)
      : executeCommand(s, commandFor(action));
  validateSave(result.state);
  return {
    ...result,
    spokenLines: result.state
      .world!.transcript.at(-1)!
      .passages.filter((p) => p.speaker === "inez")
      .map((p) => transcriptText(result.state, p))
      .filter(Boolean),
    lines: result.state
      .world!.transcript.at(-1)!
      .passages.map((p) => transcriptText(result.state, p))
      .filter(Boolean),
  };
}
export function inventory(s: GameState) {
  return Object.values(s.world!.entities).filter(
    (e) => isCarried(s, e.id) && isVisible(s, e.id),
  );
}
export function actionDestination(
  s: GameState,
  action: Action,
): TargetId | undefined {
  if (
    [
      "talk",
      "alias",
      "show-invitation",
      "ask-sender",
      "ask-care",
      "accept-care",
      "decline-care",
    ].includes(action.id)
  )
    return "inez";
  if (action.id === "read")
    return isCarried(s, "invitation") ? undefined : "envelope";
  return action.target && targets(s).some((t) => t.id === action.target)
    ? action.target
    : undefined;
}
export function objective(s: GameState) {
  if (!introduced(s))
    return "Speak to Inez and give the alias you want used here.";
  if (!invitationRead(s))
    return "Open the black envelope and read the invitation.";
  if (!invitationShown(s))
    return "Show the invitation to Inez. It must be visible and carried.";
  const answered = s.world!.transcript.some(
    (t) =>
      !t.failed &&
      t.command === "ask Inez who sent the invitation" &&
      t.passages.some((p) => p.speaker === "inez"),
  );
  return answered
    ? "Story objective: check the routing record to verify the sender. This room's investigative beat is complete."
    : "Ask Inez who sent the invitation.";
}
export function summary(s: GameState) {
  const a = agreementFor(s);
  return {
    clock: clockLabel(s.time * 60 + s.world!.subMinute),
    custody: s.world!.entities.envelope.location,
    agreement: a
      ? `${a.status} · collect before ${clockLabel(a.due)}`
      : "No agreement",
  };
}
