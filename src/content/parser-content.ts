import { scenes } from "./scenes";
import { defaultRoom, sceneRooms } from "./spaces";
import type { Choice, GameState, NPCId } from "../engine/types";
import { normalize, distance } from "../engine/language";

// Every authored scene remains addressable as a beat; room navigation is separate.
export const contentMigration = Object.values(scenes).map((scene) => ({
  id: scene.id,
  room:
    sceneRooms[scene.id] ??
    (/^mara_r/.test(scene.id)
      ? "kitchen"
      : /^celeste_r/.test(scene.id)
        ? "office"
        : /^luca_r/.test(scene.id)
          ? "stage"
          : /^inez_r/.test(scene.id)
            ? "vestibule"
            : defaultRoom[scene.location]),
  kind: scene.ending
    ? "consequence outcome"
    : /_r\d/.test(scene.id)
      ? "relationship beat"
      : scene.id === "motel" || scene.id === "mirror"
        ? "phone content"
        : scene.category === "investigation"
          ? "special interaction"
          : scene.passages.some((p) => p.speaker)
            ? "authored conversation"
            : "environment / event sequence",
  continuations: scene.choices.map((c) => ({
    id: c.id,
    to: c.to,
    phrase: c.label,
  })),
}));
// Supplemental natural-language intent aliases. Original authored wording is also understood.
export const intentAliases: Record<string, string[]> = {
  follow_system: ["follow your system", "use your system", "follow system"],
  offer_system: ["count glasses differently", "suggest a simpler system"],
  vinegar: ["vinegar"],
  salt: ["plain salt", "salt"],
  no_food: ["no food", "just company"],
  home_noise: ["the refrigerator noise", "my fridge is noisy", "fridge noise"],
  home_mug: ["my mug in the sink", "the mug"],
  home_private: ["i'd rather keep home private"],
  cover_hours: ["keep sera's reason private", "cover the hours"],
  correct_hours: ["correct the hours"],
  stay_personal: ["i wanted to be around you"],
  stay_friendly: ["i enjoy talking with you"],
  stay_distance: ["i need some space"],
  keep_company: ["return to the room", "back to the room"],
  finish_talk: ["goodnight", "good night", "end conversation"],
  thanks_talk: ["thanks for your time"],
  tape_glasses: ["hold the glasses", "help tape the glasses"],
  laugh_glasses: ["find a better light"],
  soup: ["soup"],
  toast: ["toast"],
  decline_meal: ["no food", "decline food"],
  leave_dog: ["did the dog prefer the wallpaper", "the dog"],
  name_pattern: ["i keep looking for a motive"],
  close_room: ["close the room and refund", "refund them"],
  cover_room: ["cover it yourself"],
  ask_worker: ["ask the colleague first"],
  stay_colleagues: ["let's keep it professional"],
  name_attraction: ["i am attracted to you"],
  name_professional: ["i want to talk honestly again"],
  hold_light: ["hold the light", "help with the cable"],
  tease_cable: ["will geometry apologise"],
  coriander: ["coriander is fine", "coriander"],
  plain_food: ["plain sandwich"],
  no_sandwich: ["no sandwich"],
  old_music: ["something familiar", "old music"],
  new_music: ["send me the track"],
  quiet_music: ["silence", "quiet"],
  correct_now: ["correct it now"],
  correct_later: ["correct it tomorrow"],
  let_stand: ["let it stand"],
  disclose_terms: ["disclose the terms"],
  joint_terms: ["ask celeste for a joint account"],
  wait_repay: ["repay it first"],
  watch_together: ["watch together"],
  private_joke: ["i like your attention"],
  rest_feet: ["rest my feet", "take an ordinary seat"],
  ordinary_inez: ["something ordinary", "ordinary things"],
  quiet_inez: ["some quiet"],
  mitten_visible: ["put mitten on ledge"],
  mitten_bag: ["label the mitten bag"],
  radio_company: ["familiar voices in the background"],
  radio_music: ["music makes the room mine"],
  radio_quiet: ["i like the quiet"],
  trust_correction: ["i trust the correction"],
  admit_pedestal: ["i thought you always remembered correctly"],
  challenge_thread: ["challenge the claim"],
  ask_tom: ["ask tom first"],
  wait_thread: ["wait until morning"],
  tell_help: ["i make accepting help difficult"],
  keep_help_private: ["i want to keep that private"],
  yes: ["yes", "yes please"],
  later: ["another day", "later"],
  no: ["no", "no thanks"],
  truth: [
    "someone sent this i don't know who",
    "i don't know who sent it",
    "i don't know the sender",
  ],
  lie: ["luca invited me", "luca sent it"],
  private: ["just my alias", "only my alias"],
  tea: ["tea", "tea no sugar"],
  coffee: ["coffee"],
  water: ["water", "long night"],
  protect_mara: [
    "i'll protect the names",
    "i'll keep their names out",
    "i promise to protect them",
  ],
  no_promise: ["i need to see it first", "i can't promise"],
  trade_mara: ["what do i get"],
  read_terms: ["show me the terms", "what am i agreeing to", "terms"],
  listen_luca: ["the box", "archive box", "tell me about the box"],
  correct_luca: ["ask permission", "understanding isn't permission"],
  help_inez: ["what can i do", "how can i help"],
  accuse_inez: ["you know more than you're saying"],
  object: ["why is my signature attached", "my signature", "old signature"],
  call_bluff: ["my presence cannot make this legitimate"],
  protect_witness: ["your name stays off my copy", "i'll protect your name"],
  copy_dates: ["copy the dates", "copy custody stamps"],
  admit_lie: ["sorry i used your name", "i lied at the door"],
  boundary_sender: ["ask me next time", "you ask before you act"],
  focus_ledger: ["review the account", "review ledger"],
  investigate_carbon: ["why did you need an outsider", "why an outsider"],
  investigate_proxy: ["board reference", "the proxy"],
  investigate_letter: ["intended recipient", "previous tenant"],
  stand_account: ["write a formal objection"],
  write_account: ["write an anonymous account"],
  choose_redact: [
    "redact ledger",
    "redact the names",
    "protect names release accounts",
  ],
  choose_publish: ["give ledger to luca", "publish ledger"],
  choose_bargain: ["give ledger to celeste", "trade ledger for board access"],
  choose_withhold: ["keep ledger", "withhold ledger"],
  chips: ["share chips", "help repair the casing"],
  reflect_connection: ["connection", "the person"],
  reflect_truth: ["truth", "evidence"],
  reflect_control: ["control", "autonomy"],
  reflect_unknown: ["i don't know", "uncertain"],
  reflect_never: ["no personal attention"],
};
const stop = new Set([
  "the",
  "a",
  "an",
  "to",
  "about",
  "of",
  "for",
  "and",
  "it",
  "that",
  "this",
  "her",
  "him",
  "them",
  "me",
  "my",
  "you",
  "your",
  "i",
  "says",
  "say",
  "ask",
  "tell",
]);
export function intentScore(input: string, phrase: string): number {
  const a = normalize(input),
    b = normalize(phrase);
  if (a === b) return 1;
  const neg = (s: string) =>
    /\b(?:not|no|never|don't|won't|isn't|cannot|can't)\b/.test(s);
  if (neg(a) !== neg(b)) return 0;
  const aa = a.split(" ").filter((w) => !stop.has(w)),
    bb = b.split(" ").filter((w) => !stop.has(w));
  if (!aa.length || !bb.length) return 0;
  const hit = aa.filter((w) =>
    bb.some(
      (x) => x === w || (w.length > 4 && x.length > 4 && distance(w, x) <= 1),
    ),
  ).length;
  return (2 * hit) / (aa.length + bb.length);
}
export function matchIntent(
  input: string,
  choices: Choice[],
): Choice | undefined {
  const ranked = choices
    .map((c) => ({
      c,
      score: Math.max(
        ...[c.label, ...(intentAliases[c.id] ?? [])].map((p) =>
          intentScore(input, p),
        ),
      ),
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 0.72 &&
    (!ranked[1] || ranked[0].score - ranked[1].score >= 0.16)
    ? ranked[0].c
    : undefined;
}
export function conversationStart(
  s: GameState,
  npc: NPCId,
  topic: string,
): string {
  if (
    /sender|who sent|why.*(outsider|invite)|board reference|recipient/.test(
      topic,
    ) &&
    s.canon.player.includes("sender")
  ) {
    if (/outsider/.test(topic) && s.variant === "carbon" && npc === "mara")
      return "carbon_case";
    if (/board|proxy/.test(topic) && s.variant === "proxy" && npc === "celeste")
      return "proxy_case";
    if (
      /recipient|tenant/.test(topic) &&
      s.variant === "deadletter" &&
      npc === "inez"
    )
      return "letter_case";
    return "sender";
  }
  if (/track|music|headphone/.test(topic) && npc === "luca") return "listening";
  if (/sorry|lying|door/.test(topic) && npc === "luca" && s.flags.liedLuca)
    return "contradiction";
  if (
    /company|break|dinner|yourself|spend time|stocktake|keys|shift/.test(topic)
  ) {
    return `${npc}_r${s.flags[`${npc}_firstDone`] ? 8 : 1}`;
  }
  return npc;
}
