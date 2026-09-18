import { currentDrink } from "./vessels";
import {
  offerService,
  setInteraction,
  activeInteraction,
  responseMemory,
} from "./interactions";
import { trialInterlocutors, beverages } from "./interaction-content";
import type { TrialState } from "./state";
import { socialFollowups, socialLines, socialSubjects } from "./content";

type Context = NonNullable<TrialState["context"]>;
export function setTopic(
  s: TrialState,
  kind: Context["kind"],
  topic: NonNullable<Context["topic"]>,
  question?: Omit<NonNullable<Context["question"]>, "subject">,
) {
  const speaker = trialInterlocutors[0];
  const definition = speaker.topics.find((t) => t.id === topic);
  setInteraction(
    s,
    speaker.id,
    kind,
    topic,
    question
      ? { ...question, subject: topic }
      : definition?.kind === "opinion"
        ? { kind: "opinion", subject: topic }
        : undefined,
    definition?.entityId ? [definition.entityId] : [],
  );
}
export function activeContext(s: TrialState) {
  return activeInteraction(s);
}
export function offerDrink(s: TrialState) {
  const actor = trialInterlocutors[0];
  const result = offerService(
    s,
    {
      actors: trialInterlocutors,
      beverages,
      present: () => true,
      observed: () => false,
      inspect: () => {},
      record: () => {},
    },
    actor,
  );
  return result.lines
    .join(" ")
    .replace(
      "usual " + s.preference + "?",
      "usual " + s.preference + ", " + s.alias + "?",
    );
}
export function socialConversation(
  s: TrialState,
  requested: "plans" | (typeof socialSubjects)[number],
  offer = false,
) {
  offer =
    offer && !responseMemory(s).declined.includes(trialInterlocutors[0].id);
  const subject =
    requested === "plans"
      ? socialSubjects.find((topic) => !s.socialSeen.includes(topic))
      : requested;
  if (!subject) {
    setTopic(s, "social", "plans");
    return [
      "Sable settles into the quiet stretch between orders. ‘No new stories just now. You're welcome to stay.’",
      ...(offer && !currentDrink(s)?.remaining ? [offerDrink(s)] : []),
    ];
  }
  const seen = s.socialSeen.includes(subject);
  const followupSeen = s.socialSeen.includes(`${subject}:followup`);
  const line = !seen
    ? s.socialSeen.includes(`${subject}:question`)
      ? socialFollowups[subject]
      : socialLines[socialSubjects.indexOf(subject)]
    : !followupSeen
      ? socialFollowups[subject]
      : `Sable: ‘No news on ${subject === "supplier" ? "the missing jars" : subject === "party" ? "Deep Sea Prom" : "the playlist"} yet.’`;
  s.socialSeen.push(!seen ? subject : `${subject}:followup`);
  s.socialSeen = [...new Set(s.socialSeen)];
  s.socialCount++;
  setTopic(s, "social", subject);
  const definition = trialInterlocutors[0].topics.find((t) => t.id === subject);
  responseMemory(s).replies[`sable:${subject}:question`] = 1;
  if (line === definition?.followup)
    responseMemory(s).replies[`sable:${subject}:followup`] = 1;
  return [
    line,
    ...(offer && !currentDrink(s)?.remaining ? [offerDrink(s)] : []),
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
    "ORDER COFFEE asks for a fresh drink; REFILL CUP uses your existing cup. An empty cup or glass left on the counter can be rinsed for a new order. There are two serving vessels in this small trial; neither is replaced if you carry it away.",
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
