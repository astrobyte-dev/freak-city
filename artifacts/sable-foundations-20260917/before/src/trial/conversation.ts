import type { TrialState } from "./state";
import { socialFollowups, socialLines, socialSubjects } from "./content";

type Context = NonNullable<TrialState["context"]>;
export function setTopic(
  s: TrialState,
  kind: Context["kind"],
  topic: NonNullable<Context["topic"]>,
  question?: Context["question"],
) {
  s.context = { kind, topic, question, room: s.room, at: s.time };
}
export function activeContext(s: TrialState) {
  const context = s.context;
  return context?.topic && context.room === s.room && s.time - context.at <= 30
    ? context
    : undefined;
}
export function offerDrink(s: TrialState) {
  setTopic(
    s,
    "drink",
    "drink",
    s.preference
      ? { kind: "confirm-drink", offered: s.preference }
      : { kind: "choose-drink" },
  );
  return s.preference
    ? `Sable: ‘Would you like your usual ${s.preference}, ${s.alias}?’`
    : "Sable: ‘Tea, coffee or water? The spectacularly named drinks can wait.’";
}
export function serveDrink(
  s: TrialState,
  kind: NonNullable<TrialState["drink"]>["kind"],
) {
  const repeated = s.preference === kind;
  const clearing =
    s.drink && [s.room, "player"].includes(s.drink.location)
      ? `Sable takes back your previous ${s.drink.kind === "water" || s.drink.kind.includes("special") ? "glass" : "cup"}. `
      : "";
  s.preference = kind;
  s.drink = { kind, servedAt: s.time, remaining: 3, location: s.room };
  setTopic(s, "drink", "drink");
  const vessel = kind.includes("special")
    ? `a glass of Minor Administrative Disappointment (${kind === "gin special" ? "with gin" : "alcohol-free"})`
    : kind === "water"
      ? "a glass of water"
      : `a cup of ${kind}`;
  const joke = repeated
    ? ""
    : kind.includes("special")
      ? " ‘Citrus cordial and soda. The paperwork is imaginary.’"
      : ` ‘${kind === "water" ? "Water. No garnish trying to escape into your nose." : kind === "tea" ? "Tea. I'll give it a minute before asking it anything difficult." : "Coffee. Smells more awake than either of us."}’`;
  return `${clearing}Sable sets ${vessel} within reach.${joke}`;
}

export function socialConversation(
  s: TrialState,
  requested: "plans" | (typeof socialSubjects)[number],
  offer = false,
) {
  const subject =
    requested === "plans"
      ? socialSubjects.find((topic) => !s.socialSeen.includes(topic))
      : requested;
  if (!subject) {
    setTopic(s, "social", "plans");
    return [
      "Sable settles into the quiet stretch between orders. ‘No new stories just now. You're welcome to stay.’",
      ...(offer && !s.drink?.remaining ? [offerDrink(s)] : []),
    ];
  }
  const seen = s.socialSeen.includes(subject);
  const followupSeen = s.socialSeen.includes(`${subject}:followup`);
  const line = !seen
    ? socialLines[socialSubjects.indexOf(subject)]
    : !followupSeen
      ? socialFollowups[subject]
      : `Sable: ‘No news on ${subject === "supplier" ? "the missing jars" : subject === "party" ? "Deep Sea Prom" : "the playlist"} yet.’`;
  s.socialSeen.push(!seen ? subject : `${subject}:followup`);
  s.socialSeen = [...new Set(s.socialSeen)];
  s.socialCount++;
  setTopic(s, "social", subject);
  const mentionDream =
    !s.actors.player.knowledge.includes("hospital-account") &&
    !s.socialSeen.includes("dream-mentioned");
  if (mentionDream) s.socialSeen.push("dream-mentioned");
  return [
    line,
    ...(offer && !s.drink?.remaining ? [offerDrink(s)] : []),
    ...(mentionDream
      ? [
          "They mention a dream that doesn't fit their hospital memories. You can ask about it, or keep the evening ordinary.",
        ]
      : []),
  ];
}
export function contextualHelp(s: TrialState) {
  const context = activeContext(s);
  const nearby =
    s.room === "bar"
      ? "You can talk with Sable when they're here, order a drink, or go to the shop or home."
      : s.room === "shop"
        ? "You can examine visible objects, ask Vesper a question during opening hours, or return to the bar."
        : s.room === "booth"
          ? "You can continue a private conversation while Sable is here, or return to the bar."
          : "You can go to the bar or shop. REST UNTIL TOMORROW is an optional jump to the next evening.";
  return [
    "Type a short action or a reply in your own words. LOOK describes your surroundings; INVENTORY shows belongings; JOURNAL reviews what you learned; THINK is private. Reading these costs no time. Travel, conversation, drinking and WAIT advance simulation time. Nothing runs while the app is closed.",
    nearby,
    context?.question?.kind === "confirm-drink"
      ? `Sable just offered ${context.question.offered}. You can say yes, decline or name another drink.`
      : context?.question?.kind === "choose-drink"
        ? "Sable is waiting for a drink choice: tea, coffee or water. You can also decline."
        : context?.topic === "investigation"
          ? "Sable is considering what to do. You can offer company, say you cannot come, ask for time to document things, or leave the decision with them. An offer does not arrange an appointment together."
          : context?.topic === "hospital"
            ? "You can ask a follow-up about the recollection, say which part puzzles you, or change the subject."
            : context?.topic &&
                ["photo", "listing", "report", "notebook"].includes(
                  context.topic,
                )
              ? "You can ask what Sable makes of the evidence or what remains uncertain. Asking about an object does not show or transfer it."
              : "Name the person, object or topic if a short reply could mean more than one thing.",
    "For explicitly spoiler-bearing puzzle guidance, type HINT. Export playtest downloads local records without moving the clock.",
  ];
}
export function privateThought(s: TrialState) {
  const choices = [
    ...(s.actors.player.knowledge.includes("credible-contradiction")
      ? [
          "The photograph has a date. Sable has a different account. Those are things to compare, not yet an explanation.",
          "Someone could check where that print came from. The picture cannot answer questions on its own.",
        ]
      : []),
    ...(s.actors.player.knowledge.includes("hospital-account")
      ? [
          "Sable described a memory and a dream. Neither came with a way to check it.",
          "There is room to ask a smaller question before trying to answer the large one.",
        ]
      : []),
    "Three weeks here. The bar has started to have familiar sounds: glass on wood, the fridge catching, Sable testing a line under their breath. You can call them to mind.",
    "That cocktail menu with a ring from a glass on it. Even the menu has had a drink.",
    "You could stay for an ordinary conversation. There doesn't have to be a discovery in it.",
  ];
  const next = choices.find((t) => !s.thoughtsShown.includes(t));
  if (next) s.thoughtsShown.push(next);
  return `Private: ${next ?? "Nothing new comes to mind. You can leave the question open."}`;
}
