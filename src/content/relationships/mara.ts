import type { Scene } from "../../engine/types";
import {
  arc,
  next,
  c,
  flag,
  rel,
  mem,
  moral,
  engage,
  dim,
  msg,
  belief,
  later,
  finish,
  close,
} from "./helpers";
export const maraArc: Scene[] = [
  arc(
    "mara",
    1,
    "The things\nthat need doing.",
    `
Mara is counting clean glasses into groups of twelve. You ask whether there is anything you can do. She looks at the glasses, then at you, as if both have become slightly less predictable.

M: Depends. Are you going to improve the system?

You say you haven't seen the system yet. She moves an empty tray toward you with her foot. Twelve glasses, handles facing inward if they have handles, chipped ones on the towel. There is a cupboard full of plates to your left which apparently must not be opened. She supplies no further explanation until you look at it.

M: The shelf's crooked. Open it and suddenly we're doing plates.

You work beside her for a while. The music is still loud, but there are gaps between orders now. A man in a raincoat comes back for a scarf he has already collected. Mara lets him check the hook rather than arguing. It takes less time.

You ask how she remembers everyone's things. She says she doesn't. She remembers where they stand while thinking they've lost them. The scarf man always stands next to his own scarf.

When you find a chipped glass, your first instinct is to put it in the bin. Mara catches your wristband with a finger, without touching your hand, and points at the towel.

M: We photograph them for the supplier. They keep saying it's the dishwasher. There. That's the entire glamorous secret.

She waits to see whether you can follow a boring instruction when nobody has made it sound like a test. It should not feel personal. After the evening you've had, it does.
`,
    [
      c(
        "follow_system",
        "Use her system. Ask before changing anything.",
        next("mara", 1),
        6,
        [
          mem("mara", "workingStyle", "Asked before changing my system"),
          rel("mara", 2),
          moral("autonomy"),
        ],
      ),
      c(
        "offer_system",
        "Suggest a simpler way to count the glasses.",
        next("mara", 1),
        6,
        [
          mem(
            "mara",
            "workingStyle",
            "Offered a better system before learning mine",
          ),
          rel("mara", -1),
          flag("maraImproved"),
        ],
      ),
    ],
  ),
  arc(
    "mara",
    2,
    "A completely\nunnecessary argument.",
    `
The glasses are done. Mara opens a packet of crisps with too much force and looks down at the floor for a long moment before moving. You help collect the ones that landed on the clean towel. The others are beyond negotiation.

M: Vinegar. Sorry. Didn't ask.

You tell her whether that's an apology you need. She says people get strangely intense about crisp flavours. A customer once asked her to wash the seasoning off. She had thought he was making a joke and laughed. He had thought she was refusing a reasonable request and written to management.

M: Celeste asked if there was a dietary issue. There wasn't. He just liked the texture. Fair enough. Bring your own potato, though.

You notice the packet is marked with a staff member's name. Mara notices you noticing and turns it over. It is her name, in somebody else's handwriting. Apparently food goes missing unless it looks as though an argument has already happened about it.

A cleaner stops at the door to ask whether either of you has seen a little green brush. Mara asks large-green or small-green. The cleaner holds up both hands at different distances, unable to decide. They settle on medium-green and search the same drawer together.

For several minutes you are not being assessed as a witness or a possible ally. You are a person who can move their elbow so somebody can open a drawer. It is surprisingly pleasant.

Mara finds the brush inside an empty crisp carton. Neither she nor the cleaner wants to reconstruct the sequence that put it there. They agree to leave it as a professional mystery.
`,
    [
      c("vinegar", "“Vinegar is the correct choice.”", next("mara", 2), 5, [
        flag("maraFood", "vinegar"),
        mem("mara", "snack", "Likes vinegar crisps"),
        rel("mara", 1),
      ]),
      c(
        "salt",
        "“Plain salt. I like knowing when my mouth is injured.”",
        next("mara", 2),
        5,
        [
          flag("maraFood", "salt"),
          mem(
            "mara",
            "snack",
            "Prefers plain salt; made the mouth injury joke",
          ),
          rel("mara", 1),
        ],
      ),
      c("no_food", "“No food for me. Company is enough.”", next("mara", 2), 4, [
        flag("maraFood", "none"),
        mem("mara", "snack", "Declined food, wanted company"),
        engage("care.checkIn"),
      ]),
    ],
  ),
  arc(
    "mara",
    3,
    "The space\nbetween shifts.",
    `
Mara checks her phone while you finish clearing the counter. A photograph makes her laugh. She turns the screen toward you: an exercise bike, now decorated with a tiny paper parking ticket. Somebody in her building has finally had enough.

M: That's my neighbour. The funny one. The bike one lives upstairs.

You ask whether she likes where she lives. She starts with the rent, stops, and tries again. The window opens. The shower takes a while. A person across the courtyard grows tomatoes in an old bath and gives them away when they get too many. Those are the parts she likes.

M: Bedroom's only a bedroom if you shut the wardrobe. Otherwise it's a passage. But it's mine when I'm in it.

She asks what you notice first when you get home. Not your address. Not whether you live alone. Just the first thing that tells you you're back. You could give her a picturesque answer. You could also tell her about the mug you keep forgetting, or the little refrigerator noise that becomes audible only when everything else stops.

She listens without extracting a clue. That makes it easier to answer than it should be.

M: I leave a lamp on. Wasteful, probably. Coming in with all the lights off makes it feel like I've interrupted somebody else's flat.

A member knocks on the kitchen door and asks for a towel. Mara hands one over, waits until he has gone, then resumes exactly where she stopped. The interruption has changed nothing about the question. You are allowed to remain an ordinary person with an ordinary home for another minute.
`,
    [
      c(
        "home_noise",
        "Tell her about the refrigerator noise.",
        next("mara", 3),
        6,
        [
          mem(
            "mara",
            "homeDetail",
            "The refrigerator clicks when the apartment is quiet",
          ),
          flag("homeDetail", "fridge"),
          rel("mara", 2),
        ],
      ),
      c(
        "home_mug",
        "Tell her about the mug you always leave in the sink.",
        next("mara", 3),
        6,
        [
          mem("mara", "homeDetail", "Always leaves a mug in the sink"),
          flag("homeDetail", "mug"),
          rel("mara", 2),
        ],
      ),
      c(
        "home_private",
        "“The door locking. I’d rather leave it at that.”",
        next("mara", 3),
        4,
        [
          mem("mara", "homeDetail", "Prefers to keep home private"),
          flag("homeDetail", "private"),
          rel("mara", 1),
          moral("autonomy"),
        ],
      ),
    ],
  ),
  arc(
    "mara",
    4,
    "Help can\narrive badly.",
    `
The ice machine stops midway through a cycle. You look at it. Mara looks at you looking at it. The small friendliness of the kitchen becomes awkwardly alert.

M: Please don't.

You haven't touched anything. You tell her that. She apologises too quickly, then spoils the apology by explaining what she thinks you were about to do. Someone always arrives late in her shift, discovers something broken, and begins announcing how it should have been maintained. Sometimes they are right. That has never made the announcement less exhausting.

You point out that you helped with the glasses. She says she knows. You can hear that she knows and is still bracing for a lecture.

M: I'm tired. That's an explanation, not a free pass. Sorry.

A coworker squeezes past you to reach the machine and resets a switch beneath the counter. It starts again. Nobody needed saving. The three of you stand there listening to the first pieces of ice fall, with the atmosphere of people who have held a very small emergency meeting for no reason.

You could tell Mara not to take out her shift on you. It would be reasonable. You could also admit that being useful has made you feel safer here, and you were probably about to look for another repair.

Neither answer would establish which of you is the better person. It might establish what the other should expect when a moment goes wrong. Mara moves the towel from the stool and waits, looking more uncomfortable with your silence than she was with the broken machine.
`,
    [
      c(
        "name_help",
        "“I like being useful. I wasn’t offering an inspection.”",
        next("mara", 4),
        5,
        [
          belief(
            "mara",
            "help",
            "Company, not supervision",
            "Player explained their intent directly",
          ),
          rel("mara", 2),
          flag("maraRepairStarted"),
        ],
      ),
      c(
        "push_back",
        "“You could ask what I mean before deciding.”",
        next("mara", 4),
        5,
        [
          belief(
            "mara",
            "help",
            "Feels judged by my assumption",
            "Player directly challenged my assumption",
          ),
          rel("mara", 1),
          moral("autonomy"),
        ],
      ),
      c(
        "take_over",
        "“You do look like you need somebody to take over.”",
        next("mara", 4),
        4,
        [
          belief(
            "mara",
            "help",
            "Thinks I need supervising",
            "Player offered to take over after I asked them not to",
          ),
          rel("mara", -3),
          flag("maraSupervised"),
        ],
      ),
    ],
  ),
  arc(
    "mara",
    5,
    "Someone gets\nthe late shift.",
    `
The cleaner returns with a timesheet, not the brush. Mara's colleague Sera has gone home early. Sera's partner called from a clinic; nobody in the room disputes that leaving was necessary. The timesheet is the problem.

Sera asked Mara to mark the last two hours as worked. Without them, she falls below the threshold for the weekly supplement. If the sheet goes through uncorrected, another cleaner who stayed late will appear to have needed extra help that never arrived. Management has already questioned that cleaner's hours twice.

M: I can cover the work. I can't make both records true.

She is not asking you to sign anything. She wants to talk to somebody who isn't already part of the exhausted argument. That is a form of trust; it also leaves you free to say something clean and principled before going home while she remains to deal with it.

You ask whether Celeste could pay the hours as emergency leave. Mara says she could. Asking requires telling her why Sera left. Sera specifically asked that the clinic visit remain private because it is not the first this month. A fairer record would cost somebody a confidence.

The cleaner waits in the hall, close enough to see whether the pen moves but not to hear what you say. Somewhere in the building, Sera is probably already becoming the person who left somebody else with her work.

M: There isn't a box for “we looked after each other badly”.

Mara sets the pen down. She wants your opinion, not the comforting fiction that giving it transfers the decision to you.
`,
    [
      c(
        "cover_hours",
        "Keep Sera’s reason private. Let the hours stand.",
        next("mara", 5),
        7,
        [
          flag("maraRota", "covered"),
          moral("protection"),
          rel("mara", 1),
          later("rota-query", 35, [
            msg(
              "Mara",
              "cleaner got asked about the missing help. i need to fix this. not asking you to answer for me.",
            ),
          ]),
        ],
      ),
      c(
        "ask_leave",
        "Ask Celeste for emergency leave, sharing only the minimum.",
        next("mara", 5),
        7,
        [
          flag("maraRota", "leave"),
          moral("honesty"),
          rel("mara", 1),
          later("rota-leave", 30, [
            belief(
              "celeste",
              "seraLeave",
              "A colleague left for a private emergency",
              "Mara requested emergency leave without naming the clinic",
            ),
            msg(
              "Mara",
              "leave approved. sera wanted nobody told there was an emergency. she is not thrilled.",
            ),
          ]),
        ],
      ),
      c(
        "correct_hours",
        "Correct the hours and offer to help replace the lost pay.",
        next("mara", 5),
        7,
        [
          flag("maraRota", "corrected"),
          moral("honesty"),
          rel("mara", -1),
          later("rota-corrected", 35, [
            msg(
              "Mara",
              "record is right now. money is still missing. those are different problems apparently.",
            ),
          ]),
        ],
      ),
    ],
  ),
  arc(
    "mara",
    6,
    "Without\na useful excuse.",
    `
Mara takes the bins to the service door. You follow with the smaller bag because she actually asks. The street smells of damp cardboard and the last food being cooked at the kiosk. Rain falls from the awning after the sky has finished with it.

M: You don't have to keep finding jobs if you want to stay.

She says it facing the bins. You wait until she turns around before answering. The practical business of the last hour has given both of you somewhere to put your hands and something to talk about when a sentence becomes difficult. Outside, there is less cover.

A couple pass on the opposite pavement. One person is carrying both their shoes and arguing about which route is shorter. Their companion points out that the argument has lasted longer than either route. Mara nearly laughs with her mouth closed, then gives up.

M: Sorry. I've been both of them.

You ask what staying would look like when there isn't something to fix. She thinks about it. Sitting down, probably. Talking about something neither of you can change tonight. She makes no promise that she will be particularly charming after this shift.

You notice that she has not asked you to agree with her about the timesheet. Whatever you choose next does not erase the disagreement. It simply gives the relationship a chance to contain something else as well.

From inside, someone calls her name. She closes her eyes briefly, acknowledging the timing without turning it into a performance. The door can stay open for another moment. It cannot stay open for the rest of the night.
`,
    [
      c(
        "stay_personal",
        "“I wanted an excuse to be around you.”",
        next("mara", 6),
        5,
        [
          rel("mara", 2, "affinity"),
          engage("attention.private"),
          mem("mara", "interest", "Said they wanted my company"),
          dim("heat", 12),
        ],
        { theme: "romance" },
      ),
      c(
        "stay_friendly",
        "“You’re easier to talk to when neither of us is fixing anything.”",
        next("mara", 6),
        5,
        [
          rel("mara", 2),
          mem("mara", "interest", "Wanted unproductive company"),
        ],
      ),
      c(
        "stay_distance",
        "“I’m glad we talked. I need some space now.”",
        next("mara", 6),
        4,
        [
          rel("mara", 1),
          mem("mara", "interest", "Asked for space without blaming me"),
          dim("composure", 8),
        ],
      ),
    ],
  ),
  arc(
    "mara",
    7,
    "A break\nwith an actual end.",
    `
Back at the bar, Mara puts two clean cups on a shelf above the staff kettle. She does not call them your cups. One has a chipped handle, which apparently makes it hers until someone wins an argument about throwing it out.

M: I'll stop for ten minutes when this section closes. If you're still here, come find me. If you aren't, don't stay out of politeness.

You ask whether she usually gets the break. She says sometimes. Once she spent it answering a delivery driver who had arrived at the wrong building, which she considers an impressive use of the word “break”. Tonight she intends to sit down, even if the counter has not become morally perfect.

The invitation is ordinary enough to be easy to mishandle. “See you later” could mean a commitment, a pleasant noise, or a wish neither person expects to survive the shift. She has spent much of the evening objecting to people assigning meanings without asking. It would be unkind to make her guess now.

You notice that she has given you a way to refuse. There is no strategic reason to withhold your answer until it becomes a more interesting scene. There may simply be another person you want to see first.

Mara starts sorting the till slips while you decide. A receipt sticks to the wet counter. She peels it away slowly, manages to keep it in one piece, and looks disproportionately pleased. You find yourself pleased for her. The evening has acquired these small loyalties almost without asking.
`,
    finish("mara"),
    {
      onEnter: [
        later("mara-break-plan", 95, [
          {
            type: "when",
            condition: { not: { flag: "mara_closed" } },
            then: [
              flag("maraOtherPlan"),
              msg(
                "Mara",
                "taking the break with the cleaner. don’t rush on my account. cups are still there.",
              ),
            ],
          },
        ]),
      ],
    },
  ),
  arc(
    "mara",
    8,
    "The counter\nafter midnight.",
    `
The stools have been turned toward the wall. The bar is still open at the far end, but this section has become a workplace again. Mara has a cloth over her shoulder and an expression that suggests someone has just called cleaning “winding down”.

M: Watch your bag. Floor's wet. Actual wet, not one of our atmospheric features.

You put it on the hook she points to. The remembered routine is small but immediate. She no longer has to explain where the dangerous cupboard is, and you no longer mistake the staff kettle for the one customers are allowed to use.

The timesheet is on the counter with a second sheet beside it. She has made an additional note in her own name. Whatever opinion you offered earlier, she has decided not to leave another worker alone with the consequences. This does not mean she has solved the original problem. It means she has put herself into the record of it.

M: I keep saying it isn't my job to make the place run on favours. Then I write another favour down. I know.

You ask whether she wants advice. She looks up, almost smiles, and says no. Not yet. The question itself has done something useful.

A cleaner calls goodbye from the hall. Mara calls back with the name you heard earlier. The cleaner sounds tired rather than grateful. You realise they had an entire conversation while you were deciding what to do with the ledger. You are arriving in its aftermath, not at the beginning of everything.
`,
    [
      c(
        "ask_after",
        "Ask what happened while you were elsewhere.",
        next("mara", 8),
        5,
        [
          rel("mara", 1),
          mem(
            "mara",
            "returned",
            "Asked rather than assumed the shift outcome",
          ),
        ],
      ),
      c(
        "sit_after",
        "Take the spare cup. Let her start when she wants.",
        next("mara", 8),
        6,
        [rel("mara", 1), dim("composure", 5)],
      ),
    ],
    {
      onEnter: [
        {
          type: "when",
          condition: { flag: "maraOtherPlan" },
          then: [
            msg(
              "Mara",
              "had the ten minutes. you can still have a cup. those aren’t the same appointment.",
            ),
          ],
        },
      ],
    },
  ),
  arc(
    "mara",
    9,
    "The right\nkind of ordinary.",
    `
Mara opens the staff cupboard with one hand braced against the shelf. She produces two packets of crisps, examines them as though the choice matters professionally, and puts one near your cup.

M: Found these. No big event. They were behind the napkins.

You know she has remembered what you said. You also know she would dislike having the memory turned into proof that she is a uniquely attentive person. She is a tired person who saw a packet and thought of a conversation. You let it remain that size.

The kettle clicks off before it has boiled. Mara presses the switch again with the patient hostility people reserve for appliances they cannot afford to replace. You tell her about a thing in your apartment that does something equally pointless. The comparison becomes an argument over which machine is more irritating, then wanders into stories about landlords who answer the wrong question.

She tells you about a man who inspected her shower pressure while fully dressed and managed to wet one entire sleeve. For the rest of the visit he behaved as though she had arranged it deliberately. You ask whether she had. She looks hurt that you think she would waste an opportunity so inefficiently.

The laugh leaves both of you quieter afterwards. Not sad. Just briefly out of things to perform.

At the far end of the bar, a last guest is trying to remember which coat belongs to them. Mara watches without getting up. Somebody else is on that part of the shift now. She is practising letting that be true.
`,
    [
      c(
        "remember_snack",
        "Accept the packet without making a speech.",
        next("mara", 9),
        6,
        [
          rel("mara", 2),
          mem(
            "mara",
            "ordinaryReturn",
            "Accepted the remembered snack naturally",
          ),
        ],
      ),
      c(
        "ask_rest",
        "“Can you actually leave the other end to somebody else?”",
        next("mara", 9),
        6,
        [rel("mara", 1), moral("compassion")],
      ),
    ],
    {
      onEnter: [
        {
          type: "when",
          condition: { flag: "maraFood", value: "vinegar" },
          then: [
            msg(
              "Mara",
              "vinegar packet by your cup. the good brand this time.",
            ),
          ],
        },
        {
          type: "when",
          condition: { flag: "maraFood", value: "salt" },
          then: [msg("Mara", "plain salt. no mouth injuries on company time.")],
        },
        {
          type: "when",
          condition: { flag: "homeDetail", value: "fridge" },
          then: [
            msg(
              "Mara",
              "my fridge does the clicking too. i put a folded menu under one foot. didn’t help. now it clicks over a menu.",
            ),
          ],
        },
      ],
    },
  ),
  arc(
    "mara",
    10,
    "An argument\nwith a history.",
    `
Luca arrives looking for an extension lead. Mara points him toward a drawer. He opens the wrong one, and the minor correction comes out of her mouth with years behind it.

M: The one I said, Luca.

L: There are three drawers on the left.

M: Then ask which one.

For a second, neither of them is talking about the drawer. You can feel the temptation to translate one for the other. To explain that she is exhausted, or that he is not deliberately refusing to listen. Both explanations would be plausible. Both would place you in charge of a conversation that predates you.

Luca finds the lead. Instead of leaving immediately, he puts a packet of replacement fuses beside Mara's cup. He does not announce the gesture. She turns the packet over, checks the rating, and says they are the right ones.

L: You texted the number. I read it.

M: I know. Thanks.

It is an imperfect repair, made from the materials they have. You are allowed to watch it without upgrading it into reconciliation.

Luca asks whether Mara wants the old flood-group chat reopened for the fund discussion. She says only if people are asked individually before being added. He starts to say it would take ages, catches himself, and says he will ask. Then he leaves with the extension lead.

Mara looks at the door after it closes. You cannot tell whether she is relieved or disappointed that the conversation ended. She may not have decided either. The room has enough unfinished history without requiring you to choose its official interpretation.
`,
    [
      c(
        "stay_out_pair",
        "Let their imperfect repair stand.",
        next("mara", 10),
        5,
        [moral("autonomy"), rel("mara", 1)],
      ),
      c("name_pair", "“He did listen about the fuses.”", next("mara", 10), 5, [
        rel("mara", -1),
        belief(
          "mara",
          "mediator",
          "May turn practical gestures into a verdict",
          "Player interpreted Luca’s gesture for me",
        ),
      ]),
    ],
  ),
  arc(
    "mara",
    11,
    "The choice\nthat came back.",
    `
Mara asks where the ledger is now. She knows the broad outcome from the people who had to act on it. She wants to hear the account from you without a venue announcement wrapped around it.

You explain what you chose and what you thought it would protect. Saying it to someone who will have to answer tomorrow's calls feels different from clicking the decision into place. The reasons are still yours. They have acquired an audience you cannot persuade by narrating everyone else's motives.

Mara does not interrupt. You recognise the effort from the kitchen earlier. When you finish, she moves her cup away from the edge of the table before answering.

M: I can believe you meant it and still wish you'd done something else.

You ask whether that is a warning about the friendship, or whatever this has become. She says she does not know yet. It is an answer with less comfort than a promise and more room than a verdict.

A message arrives on her phone. She reads the preview and turns the screen down. You do not ask whose name was visible. You have spent too much of the night learning the difference between nearby information and information that belongs to you.

For a while you talk about what can still be done tomorrow. Then she stops the conversation herself. She does not want every minute with you to become an extension of the fund meeting. That limit is more personal than any confession she has made.
`,
    [
      c(
        "own_cost",
        "Acknowledge the cost without asking her to approve.",
        next("mara", 11),
        7,
        [
          rel("mara", 2),
          mem(
            "mara",
            "outcomeTalk",
            "Did not ask me to approve the document choice",
          ),
        ],
      ),
      c(
        "defend_cost",
        "Explain why her preferred option also had costs.",
        next("mara", 11),
        7,
        [
          rel("mara", -2),
          mem(
            "mara",
            "outcomeTalk",
            "Needed me to agree their choice was necessary",
          ),
        ],
      ),
    ],
    {
      onEnter: [
        {
          type: "when",
          condition: { flag: "ending", value: "public" },
          then: [
            rel("mara", -2),
            msg(
              "Mara",
              "one of the people named has called three times. i’m going to answer. this conversation may have to wait.",
            ),
          ],
        },
        {
          type: "when",
          condition: { flag: "ending", value: "protect" },
          then: [
            msg(
              "Mara",
              "one person said yes to being asked tomorrow. one said no. both got to answer. that matters to me.",
            ),
          ],
        },
      ],
    },
  ),
  arc(
    "mara",
    12,
    "Ask what\nshe means.",
    `
Mara says you can leave the cups. You reach for yours anyway, then stop. She notices the stop. It would be easy for either of you to make a joke and avoid the conversation you have almost returned to.

M: Earlier, with the machine. I decided what you were about to do. I do that when I'm tired. Doesn't mean you have to like it.

There is an apology available here, but not a promise of a completely different person. She will be tired again. You will probably try to help again. What matters is whether either of you can make the misunderstanding smaller before turning it into evidence of character.

You tell her what the moment felt like. She listens, asks one question, then admits she had heard a different intention. The admission is not dramatic. Neither of you has discovered a terrible secret. You are learning that company requires correction even when both people would prefer to be naturally good at it.

Mara puts the cups in the washing tray and sits again. This time you do not have to earn the chair by completing a task. You can refuse the chair too. That remains part of the offer.

Outside, someone is sweeping water away from the side entrance. The sound is regular enough to make the room feel more still. Mara asks whether you'd like another five minutes or whether keeping you here has become another form of making work. It is an awkwardly phrased question. You understand it anyway.
`,
    [
      c(
        "repair_help",
        "“Ask what I mean. I’ll ask what you need.”",
        next("mara", 12),
        6,
        [
          flag("maraArc", "repaired"),
          belief(
            "mara",
            "help",
            "We will ask instead of deciding for each other",
            "Mutual agreement during the closing conversation",
          ),
          rel("mara", 3),
        ],
      ),
      c(
        "limit_help",
        "“I like you. I can’t be on call for this place.”",
        next("mara", 12),
        6,
        [flag("maraArc", "bounded"), rel("mara", 2), moral("autonomy")],
      ),
      c(
        "end_help",
        "“I think we keep making each other defensive.”",
        next("mara", 12),
        5,
        [
          flag("maraArc", "distance"),
          rel("mara", -1),
          mem("mara", "limit", "Asked to leave the relationship at a distance"),
        ],
      ),
    ],
  ),
  arc(
    "mara",
    13,
    "Not another\nshift.",
    `
Mara walks you to the service door because she has to put the last bag out, then admits that she could have taken it later. It is a small concession to making her own intentions visible.

M: There's a place that sells breakfast when normal people are still calling it night. I go after Thursdays sometimes.

She waits to see whether another conversation would be welcome before trying to arrange one. The suggestion comes out a little clumsily. She had an easier time telling you which cupboard to leave alone.

She leaves the suggestion there without putting a date beside it. You have not agreed to anything. When she next knows her rota, you can decide whether you want another conversation over something better than broken crisps.

A taxi stops across the street. Mara looks at it, remembers she has the bus fare, then checks the timetable anyway. You have seen her checking things she already knows all night. You finally ask whether it helps. She says sometimes it turns out she was wrong, and occasionally that is useful.

M: Other times I'm just tired. Not every habit has a good reason.

She goes back inside for her coat. You wait at the doorway without following. The boundary is neither cold nor romantic by itself. It is simply a place where you have learned to let her do a thing without making it yours.
`,
    close("mara"),
    {
      onEnter: [
        {
          type: "when",
          condition: { flag: "maraArc", value: "repaired" },
          then: [
            later("mara-tomorrow", 30, [
              msg(
                "Mara",
                "got home. not asking you to fix anything. just saying goodnight.",
              ),
            ]),
          ],
        },
      ],
    },
  ),
];
