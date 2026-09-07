import "./cards";
import type { Scene, NPCId, Choice } from "../../engine/types";
import { npcIds } from "../../engine/types";
import { cards, card } from "../cards";
import { s, p, c, flag, rel, msg, dim } from "../scenes/helpers";
import { prose, later } from "./helpers";
const names: Record<NPCId, string> = {
  mara: "Mara",
  celeste: "Celeste",
  luca: "Luca",
  inez: "Inez",
};
const select = (phase: "first" | "second" | "closing"): Choice[] =>
  npcIds.map((n) =>
    c(
      `spend_${n}`,
      phase === "closing"
        ? `Find ${names[n]} before leaving.`
        : `Spend some time with ${names[n]}.`,
      `${n}_r${phase === "closing" ? 8 : 1}`,
      4,
      phase === "closing"
        ? [flag("closingStarted")]
        : [flag(`arc_${n}`), flag(`${phase}Lead`, n), flag(`${phase}Chosen`)],
      {
        when:
          phase === "closing"
            ? {
                all: [
                  { flag: `${n}_firstDone` },
                  { not: { flag: `${n}_closed` } },
                ],
              }
            : phase === "first"
              ? undefined
              : {
                  all: [
                    { not: { flag: `arc_${n}` } },
                    { not: { flag: "secondChosen" } },
                  ],
                },
      },
    ),
  );
cards.crossed_shift = card(
  "Let two separately witnessed staffing dilemmas collide without sharing either confidence.",
  "conflict",
  [],
  {},
  {
    world:
      "Player spent time with both Mara and Inez and recommended limited disclosure.",
    goals:
      "Recognise that apparently individual remedies affect the same small staff.",
    entry:
      "Mara emergency-leave advice and Inez public correction, after both first encounters.",
    hidden: "Sera’s clinical details and Tom’s family details remain private.",
    exit: "Return to the custody decision with a remembered limit on intervention.",
    callbacks: ["Mara’s leave request", "Inez’s challenged shift thread"],
  },
);
export const relationshipShared: Scene[] = [
  s(
    "late_room",
    "The room\nafter the rush.",
    "velvet",
    "AFTER HOURS",
    prose(`
The first wave of departures leaves the room looking larger and less certain of itself. A table that held four arguments now holds a damp cloth and a glass nobody claims. Someone lowers the music; the refrigerator behind the bar becomes audible for the first time.

You have enough evidence to make the document decision. You also have time before the morning record is assembled. The people around you have spent much of the evening appearing at moments when you needed something from them. You could find out what happens between those moments.

Mara is finishing the bar stocktake. Celeste has finally retrieved the dinner she forgot. Luca is fighting with a cable near the small stage. Inez has returned to cover a colleague, despite having already ended her shift once. Each is available for a different kind of company. None has arranged the rest of the night around you.

There is enough room in the hours left to get to know two people properly, with time apart and a later return. More than that would turn every conversation into an explanation of why you have to leave it. You can choose one person now and another afterward. The others will make their own plans.

The decision feels unusually personal because it does not come with an envelope or a deadline written in somebody else's hand. You can follow attraction, curiosity, affinity, the relief of an easy conversation, or the uncomfortable sense that you misjudged somebody. For once, useful evidence is not the only reason to stay.
`),
    select("first"),
    { onEnter: [flag("lateExpanded")] },
  ),
  s(
    "late_second",
    "Time belongs\nto someone else, too.",
    "velvet",
    "ANOTHER CONVERSATION",
    [
      ...prose(`You come back to the main room carrying details that would make poor evidence: a food preference, a foolish mistake, a sentence you wish had come out differently. They have made the person you left harder to summarise. That seems like a useful change.

The next conversation will cost time somewhere else. You can already see people checking phones, collecting equipment and deciding which tasks can wait until daylight. Choosing to know somebody better means letting other people remain partly unknown tonight.

You do not owe every interesting person an equal share of yourself. You also cannot promise everybody a long goodbye and rely on the morning to stretch. The room offers company, not a list you can finish.`),
      p(
        "There is time for one more first conversation before the document decision. After that, you can return to the people you chose.",
        { when: { not: { flag: "secondChosen" } } },
      ),
      p(
        "You have spent time with two people. The others have continued their own evenings. Now the paper on the service table needs a decision.",
        { when: { flag: "secondChosen" } },
      ),
    ],
    [
      ...select("second"),
      c("enough_company", "Return to the service table.", "late_table", 4, [
        flag("companionsChosen"),
      ]),
    ],
  ),
  s(
    "late_table",
    "The last\nordinary table.",
    "velvet",
    "SOMETHING TO EAT",
    prose(`
A cleaner asks who owns the remaining food. The answer turns into a disagreement about whether putting a name on a bag establishes ownership of everything touching the bag. Mara says no. Luca says he has questions about the evidence. Celeste tells him to take a sandwich before the argument becomes administrative.

Nobody laughs very hard. They are tired. The small joke still changes how the room holds itself. Inez comes in to retrieve a cup and says the food can be divided without a witness if everybody behaves unusually well.

You notice who moves a chair for whom, who knows which cupboard sticks, who waits for another person to finish an irritated sentence. These are relationships with histories you have not been present for. They do not become simple because you have developed a preference among the people in them.

For several minutes the document stays closed. The people affected by it continue eating, working and remembering that they meant to call somebody. The pause does not make the decision less serious. It gives the word “people” some of its inconvenient contents back.

A colleague drops a spoon. Two people bend for it and almost collide. The resulting apology is warmer than anything anybody has said about the accounts. You find yourself hoping there will still be room for that warmth after you choose what to do with the paper.
`),
    [
      c(
        "help_table",
        "Help clear a space without taking charge.",
        "late_accounts",
        6,
        [dim("composure", 8), flag("sharedTable")],
      ),
      c(
        "quiet_table",
        "Eat quietly and listen to the room.",
        "late_accounts",
        6,
        [dim("composure", 12), flag("heardTable")],
      ),
    ],
    {
      onEnter: npcIds.map((n) => ({
        type: "when",
        condition: { not: { flag: `arc_${n}` } },
        then: [
          later(`unchosen-${n}`, 24, [
            msg(
              names[n].toUpperCase(),
              {
                mara: "Taking my break with the cleaner. If I miss you leaving, have a good walk home.",
                celeste:
                  "I have a family call to finish. The desk can take any practical questions until morning.",
                luca: "Helping label the spare keys. Another night for the long conversation, perhaps.",
                inez: "My sister is collecting me after handover. Leave anything unfinished with the desk.",
              }[n],
            ),
          ]),
        ],
      })),
    },
  ),
  s(
    "late_accounts",
    "What company\ndoes not settle.",
    "velvet",
    "BACK TO THE PAPER",
    prose(`
The service table has been wiped down. The document is exactly where you left it, dry and intact, which briefly feels improbable after all the other things that have moved.

Knowing someone better has changed the decision without changing the facts. You can picture the person who will answer the calls after publication. You can also picture the people who will remain unheard if nobody acts. A pleasant conversation has not supplied an exemption from either problem.

You think about the advice you gave in smaller disputes tonight. Protecting a confidence could leave an unfair account unchallenged. Correcting the account could require a disclosure someone did not want. The document asks a larger version of that question, with more people able to describe your choice after you have made it.

There will be time for a closing conversation with the people you spent time with. That conversation may be harder because of the decision. You do not need to make the paper into a gift for the person whose company you most enjoyed.

Across the room somebody checks a booking for tomorrow. The building is already beginning the next day while you are still choosing the shape of this one. You sit at the clear table, read the terms again and let the decision become yours.
`),
    [
      c("decide_after_company", "Make the document decision.", "ledger", 3, [
        flag("companyComplete"),
      ]),
      c(
        "compare_shifts",
        "Ask Mara and Inez how the two shift disputes intersect.",
        "crossed_shift",
        5,
        [],
        {
          when: {
            all: [
              { flag: "mara_firstDone" },
              { flag: "inez_firstDone" },
              { flag: "maraRota", value: "leave" },
              { flag: "inezThread", value: "challenged" },
            ],
          },
        },
      ),
    ],
  ),
  s(
    "crossed_shift",
    "The same\nsmall pool of hours.",
    "velvet",
    "A RARE OVERLAP",
    prose(`
Mara and Inez discover they have both been discussing tomorrow's staffing budget. One request would preserve emergency leave. The other would prevent a covered absence from being described as unreliability. Each sounded manageable when the other was out of the room.

Mara asks whether the leave request will reduce the available relief hours. Inez says she does not know. They check the written policy together rather than exchanging the private reasons that led each worker to need help.

The wording is poor enough to support two interpretations. Celeste will have to clarify it in the morning. Neither woman is pleased to discover another argument waiting behind the first one.

You offer to explain that both requests were reasonable. Mara says she knows. Inez says the useful question is whether both can be funded. Being able to describe a problem sympathetically has brought you to the edge of what you can solve tonight.

They draft a joint question about the budget, keeping the individual circumstances out of it. The act creates a little solidarity and no guarantee. You watch them disagree over one verb, settle on a more precise one, and send the question under both names.

For once a connection between two conversations does not reveal a hidden mastermind. It reveals the same inadequate arrangement placing different people in each other's way. You return to the document with a more concrete understanding of how a system can injure people without ever having to meet them together.
`),
    [
      c(
        "leave_budget",
        "Leave their joint question in their hands.",
        "ledger",
        6,
        [
          flag("crossedShifts"),
          rel("mara", 1),
          rel("inez", 1),
          {
            type: "npcRelationship",
            a: "mara",
            b: "inez",
            axis: "trust",
            amount: 2,
          },
        ],
      ),
    ],
  ),
  s(
    "closing_room",
    "Before\nyou disappear.",
    "velvet",
    "CLOSING CONVERSATIONS",
    prose(`
You turn back from the door. There are conversations you chose to leave unfinished, and enough of the night remains to return to them. The document decision has changed what you will bring to the encounter. The other person has changed a little in your absence as well.

The lights over the far tables have come on. Velvet is less flattering under them, more recognisably a place where people have to find dropped things. A chair scrapes. Somebody begins counting tomorrow's change into a plastic tray.

You can find the people you spent time with earlier. You cannot begin four new versions of the evening in the minutes before departure. The distinction makes the room feel less abundant and more real.

A closing conversation might become a repair, an argument, a practical promise or a goodbye with a clear edge. You think of the small things you have learned and choose whose changed evening to enter first.
`),
    [
      ...select("closing"),
      c(
        "leave_promises",
        "Leave the conversations unfinished and go home.",
        "closing_table",
        3,
        [flag("leftConversations")],
      ),
    ],
  ),
  s(
    "closing_second",
    "One more\nproper goodbye.",
    "velvet",
    "THE TIME YOU KEPT",
    prose(`
The room has acquired the sound of objects being put away. Your last conversation has left something more specific than an impression: a repaired assumption, an accepted limit, perhaps a question that can wait until sleep has made an answer possible.

If you still have another conversation to return to, this is the time. People are making actual arrangements to leave. It is possible to miss someone without either person having failed.

You check your phone. A few messages belong to people who were doing something else while you talked. Their evenings were not empty intervals between your choices. You can carry that knowledge into the next goodbye, or leave now and let the unfinished conversation remain honestly unfinished.
`),
    [
      ...select("closing"),
      c("finish_closing", "Let the night end here.", "closing_table", 4, [
        flag("closingComplete"),
      ]),
    ],
  ),
  s(
    "closing_table",
    "The things\nyou take with you.",
    "street",
    "AT THE DOOR",
    [
      ...prose(`The last departures happen in an untidy cluster. Somebody cannot find a coat they have put on. Somebody returns a borrowed charger with the gravity of a person settling an old debt. You move aside for a cleaner taking a bag through the doorway.

You are leaving with more than the document's outcome. There are preferences you will remember for no strategic reason and sentences you will want to reconsider when you are less tired. Some people have become warmer. Some have become clearer about the distance they want. Clarity has its own intimacy, though it is not always the version you hoped for.

Inside, two workers discuss tomorrow's start time without lowering their voices for your departure. The room has begun to let you go. Outside, the street is still wet and recognisable. You can walk it without carrying every unanswered conversation as an assignment.`),
      p(
        "Mara has left a packet beside the till for you. It is the flavour you actually named.",
        {
          when: {
            all: [
              { flag: "mara_closed" },
              { flag: "maraFood", value: "vinegar" },
            ],
          },
        },
      ),
      p(
        "Celeste reminds the desk about your car. The offer survived the conversation without acquiring an extra condition.",
        { when: { flag: "carHome" } },
      ),
      p(
        "Inez is already in her sister’s car. She lifts a hand when she sees you, then turns back to the person beside her.",
        { when: { flag: "inez_closed" } },
      ),
      p(
        "Luca has stepped aside to call his father. He gives you a small wave; the call keeps his attention.",
        { when: { flag: "luca_closed" } },
      ),
    ],
    [
      c("take_night_home", "Carry the night home.", "walk", 5, [
        flag("closingComplete"),
      ]),
    ],
  ),
  s(
    "home_callback",
    "Ordinary\nthings, returned.",
    "apartment",
    "AFTER THE LOCK TURNS",
    [
      ...prose(`The apartment has not become more dramatic in your absence. There is a place for your coat, a light you meant to replace and a small practical decision about whether to wash a cup now or give it to tomorrow's version of yourself.

Your phone lights while you are taking off your shoes. You do not have to answer immediately. The people on it have been allowed to finish conversations and leave rooms tonight. You can allow yourself the same thing.

You read what has arrived, if you want to. A remembered preference feels different on this side of the door. It no longer has to share the table with the evidence. There is room to like that somebody paid attention and still be angry with them about another part of the evening.

For a while you leave the next decision alone. Nothing is timing how quickly you understand yourself. The refrigerator starts, stops and leaves the room quieter than before. You can take a breath before giving the night a name.
`),
      p(
        "You hear the refrigerator click and remember telling Mara about it. A detail that usually belongs to you alone has a second address now.",
        { when: { flag: "homeDetail", value: "fridge" } },
      ),
      p(
        "The mug is still in the sink. You told Mara it would be. For once a prediction has come true without making anything worse.",
        { when: { flag: "homeDetail", value: "mug" } },
      ),
      p(
        "You consider putting on familiar voices, then remember Inez enjoying a mystery she did not need to solve. The thought makes the quiet easier.",
        { when: { flag: "inezRadio", value: "voices" } },
      ),
    ],
    [
      c(
        "reflect_after_home",
        "Decide what you want to remember.",
        "reflection",
        6,
        [dim("composure", 12), flag("homeSettled")],
      ),
    ],
  ),
];
