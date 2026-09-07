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
export const lucaArc: Scene[] = [
  arc(
    "luca",
    1,
    "The wrong\nend of the cable.",
    `
Luca is trying to connect two plugs which plainly require a third object between them. He notices you noticing and holds up the cable as if you might be about to identify a rare animal.

L: Before you say anything, I know. I brought the adapter. I remember putting it somewhere sensible, which is a devastating development.

The sensible place turns out to be the equipment case he has been using as a seat. Getting at it requires standing, collecting three loose receipts and admitting that the entire search could have been avoided. You help keep the receipts from blowing under the door.

He asks you to hold the light. When you do, he adjusts the angle by asking rather than taking your hand. The distinction is small enough that you might not notice it if the room had not spent so much of the night negotiating larger permissions.

L: This is the bit nobody puts in a biography. A man and a cable, briefly defeated by geometry.

The connection works. Nothing dramatic happens. A little indicator stops blinking and a speaker produces a very ordinary hum. Luca looks pleased in a way he has not looked while discussing the evidence.

You ask whether he prefers this part of the work. He says sometimes. A cable can be wrong without taking the criticism personally. Then he looks at the adapter and admits he did spend several minutes blaming it for being in the place he himself had put it.
`,
    [
      c(
        "hold_light",
        "Hold the light until he is finished.",
        next("luca", 1),
        6,
        [
          mem("luca", "equipment", "Stayed with a boring repair"),
          rel("luca", 2),
        ],
      ),
      c("tease_cable", "“Will geometry be apologising?”", next("luca", 1), 5, [
        mem("luca", "equipment", "Made the geometry joke"),
        rel("luca", 1),
        flag("lucaGeometry"),
      ]),
    ],
  ),
  arc(
    "luca",
    2,
    "What you\nactually ordered.",
    `
He has two sandwiches because a delivery app duplicated his order and arguing would have taken longer than eating. One is wrapped in paper. The other has been opened, inspected and wrapped again with insufficient confidence.

L: There's coriander. I forgot to ask. If you hate it, please hate it out loud. I have spent enough of my life mistaking politeness for lunch.

You tell him what you want. He begins to hand you the wrong sandwich, catches himself, and asks you to repeat it. The correction is so immediate that it is almost easier to pretend the mistake did not happen. You resist helping him that way.

He puts the right one within reach, or leaves both alone if you decline. A drop of sauce escapes onto a receipt. He reads the total before dabbing it, as if discovering the receipt was important might reverse the damage.

L: I once agreed to cater a meeting because somebody said “could you bring something” and I heard “anything”. Twelve people, one packet of biscuits. A very long afternoon.

You ask whether he apologised. He says yes, though for years he told the story as if everybody else's expectation had been the ridiculous part. He is trying to stop improving anecdotes at the expense of people who were actually hungry.

The admission gives the meal a different weight. Being funny is one of his ways of making a room comfortable. You have begun to see who sometimes pays for that comfort.
`,
    [
      c(
        "coriander",
        "“Coriander is fine. Thank you for asking twice.”",
        next("luca", 2),
        5,
        [
          flag("lucaFood", "coriander"),
          mem("luca", "food", "Likes coriander; corrected my assumption"),
          rel("luca", 1),
        ],
      ),
      c("plain_food", "Ask for the plain sandwich.", next("luca", 2), 5, [
        flag("lucaFood", "plain"),
        mem("luca", "food", "Wanted the plain sandwich"),
        rel("luca", 1),
      ]),
      c(
        "no_sandwich",
        "Decline the food without inventing a reason.",
        next("luca", 2),
        4,
        [
          flag("lucaFood", "none"),
          mem("luca", "food", "Declined food directly"),
          moral("autonomy"),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    3,
    "Music for\ngetting home.",
    `
The speaker is working. Luca plays a few seconds of a track, stops it before the vocal, and asks whether the bass sounds wrong. You say it sounds like bass. He considers this a useful outside opinion.

He is making a playlist for the walk home. The first version was forty minutes too long and included a song that made him miss somebody he did not particularly want to miss tonight. He removed it, then spent ten minutes deciding whether removal was cowardly.

L: Eventually I remembered it was a playlist. You can just take things off it. Extraordinary technology.

You ask what he kept. Something old enough to know without concentrating; something his downstairs neighbour calls unlistenable; a song his father liked which he used to dislike on principle. He does not name the absent person. You leave that part unrequested.

When he asks what you want to hear on the way home, the answer can stay a preference. You do not have to provide an origin story. He seems grateful when you give him something ordinary to remember.

A cleaner asks him to turn the speaker down. He does it immediately, then removes his headphones so he can hear if she needs to ask again. It is an undramatic act of consideration. You like having enough time with someone to notice those alongside the mistakes.

He writes your answer on the undamaged edge of the receipt. It may never become anything more significant than a recommendation. Tonight that feels like a kind of relief.
`,
    [
      c(
        "old_music",
        "Ask for something familiar enough to stop thinking to.",
        next("luca", 3),
        6,
        [
          flag("lucaMusic", "familiar"),
          mem("luca", "music", "Wants familiar music on the walk home"),
          rel("luca", 2),
        ],
      ),
      c(
        "new_music",
        "Ask him to send the neighbour’s least favourite track.",
        next("luca", 3),
        6,
        [
          flag("lucaMusic", "new"),
          mem(
            "luca",
            "music",
            "Asked for the neighbour’s least favourite track",
          ),
          rel("luca", 2),
        ],
      ),
      c(
        "quiet_music",
        "“Silence. I’ve heard enough people for one night.”",
        next("luca", 3),
        5,
        [
          flag("lucaMusic", "silence"),
          mem("luca", "music", "Prefers quiet on the way home"),
          rel("luca", 1),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    4,
    "A smaller\nversion of your sentence.",
    `
A member passes the doorway and thanks you for agreeing to help Luca tomorrow. You have agreed to no such thing. Luca looks down at the receipt and then up at you, already knowing which sentence he needs to explain.

L: I said you were interested. They asked if that meant helping. I said probably. That was the bad bit.

You ask what, exactly, he told them. He repeats it. The wording is friendly, inaccurate and useful to him. It makes his unfinished plan sound as if another person already believes in it. You recognise the temptation without appreciating being made into supporting evidence.

He begins to explain that he did not intend to commit you. You tell him the member heard a commitment. He stops explaining his intention and asks whether you want him to correct it now.

The offer matters. So does the fact that you had to catch the mistake for him to make it. Earlier, with the sandwich, he listened again before giving you the wrong thing. This time he had completed the exchange in your absence.

L: I like it when people sound interested. Sometimes I round up. That is not a defence. I can hear it sounding like one.

There is still time for the member to hear a correction before leaving. You could ask for that. You could let the smaller misunderstanding stand to avoid a larger awkwardness. Luca waits, looking considerably less comfortable than he did when the cable was the thing at fault.
`,
    [
      c(
        "correct_now",
        "Ask him to correct the commitment now, in front of you.",
        next("luca", 4),
        7,
        [
          flag("lucaSummary", "corrected"),
          belief(
            "luca",
            "availability",
            "Interest is not a commitment",
            "Player explicitly corrected my summary",
          ),
          rel("luca", 2),
          moral("honesty"),
        ],
      ),
      c(
        "correct_later",
        "Ask for a written correction tomorrow; keep tonight private.",
        next("luca", 4),
        5,
        [
          flag("lucaSummary", "later"),
          belief(
            "luca",
            "availability",
            "Wants a correction without a public scene",
            "Player requested a written correction",
          ),
          moral("privacy"),
        ],
      ),
      c(
        "let_stand",
        "Let it stand, though you have promised nothing.",
        next("luca", 4),
        4,
        [
          flag("lucaSummary", "unresolved"),
          belief(
            "luca",
            "availability",
            "May be willing to help; I still have not asked properly",
            "Player allowed the summary to stand",
          ),
          rel("luca", -1),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    5,
    "Who paid\nfor the tools.",
    `
Luca opens the equipment case and finds a receipt he was hoping not to discuss. Celeste paid for repairs to the recorder last month. It is his recorder, used for jobs outside Velvet as well as inside it. He had meant to reimburse her before anyone asked.

L: She didn't buy a favourable account. I know how that sentence sounds when the next sentence is that I haven't paid her back.

A worker has asked whether the arrangement should be disclosed before Luca circulates a complaint about maintenance. The repair payment is relevant to how people read his independence. The amount is also a private measure of a difficult month. Publishing one can expose the other.

You ask what Celeste agreed to. A gift toward the repair, with no approval over his work. It was generous. He accepted it gratefully. Neither fact prevents him from wanting to minimise it now that generosity has become inconvenient to explain.

He could disclose the arrangement without the amount, ask Celeste to approve a joint statement, or delay the complaint until he can repay her. Delay would leave the maintenance problem unchallenged for another week and make independence something only people with spare money can afford.

L: I want an answer that makes me look independent without making her look predatory. Ideally one that also makes me look clever. We may have to abandon that last requirement.

He closes the case. The choice concerns an explanation, not access to his private banking. He has offered you enough information to disagree with him.
`,
    [
      c(
        "disclose_terms",
        "Recommend disclosing the terms, keeping the amount private.",
        next("luca", 5),
        7,
        [
          flag("lucaFunding", "terms"),
          moral("honesty"),
          rel("luca", 1),
          later("luca-disclosure", 35, [
            msg(
              "LUCA",
              "I disclosed the repair gift and the absence of editorial control. Someone still called it a conflict. Disclosure did not oblige them to approve.",
            ),
          ]),
        ],
      ),
      c(
        "joint_terms",
        "Suggest asking Celeste for a joint account.",
        next("luca", 5),
        7,
        [
          flag("lucaFunding", "joint"),
          moral("autonomy"),
          later("luca-joint", 35, [
            msg(
              "LUCA",
              "Celeste agreed to confirm the terms. She also asked why I waited until there was an audience. Fair question, badly timed for my dignity.",
            ),
          ]),
        ],
      ),
      c(
        "wait_repay",
        "Recommend repaying it before circulating the complaint.",
        next("luca", 5),
        7,
        [
          flag("lucaFunding", "delay"),
          moral("independence"),
          later("luca-delay", 35, [
            msg(
              "LUCA",
              "I delayed the complaint. The worker who reported the fault is angry. My independence is costing somebody else another week.",
            ),
          ]),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    6,
    "From this\nside of the room.",
    `
Two guests are rehearsing an introduction by the empty stage. One says a name, gets it wrong, and starts again. The other listens with an expression that would be difficult to mistake for forgiveness. Eventually both laugh and abandon the microphone.

Luca is watching the exchange with the fondness of someone who has ruined a public sentence before. He asks if you would like to sit where the sound is better. The seating is arranged to make people feel observed, even while they are doing the observing. You can choose the wall instead.

L: I like an audience when I know which part of myself I've offered it. Accidentally being entertaining is considerably less restful.

You ask whether the jokes make it easier. He says they make it faster. Sometimes faster is useful. Sometimes it means he reaches the laugh before deciding what he actually wanted to say.

The microphone is switched off. Without amplification, the stage becomes an ordinary platform with a water ring on its edge. Luca moves a chair so the route to the door stays clear, then waits for you to choose where to sit.

There is space here for shared attention, for the pleasure of a private joke in a public room, or simply for resting your feet beside somebody you are beginning to understand. He does not treat the least charged version as a failed attempt at the others.
`,
    [
      c(
        "watch_together",
        "Choose the little audience; agree that watching is enough.",
        next("luca", 6),
        8,
        [
          engage("performance.observer"),
          mem("luca", "audience", "Chose to observe without joining the stage"),
          rel("luca", 1),
        ],
        { theme: "performance" },
      ),
      c(
        "private_joke",
        "Choose the wall and admit you like having his attention.",
        next("luca", 6),
        8,
        [
          flag("lucaAttention"),
          engage("attention.private"),
          rel("luca", 2, "affinity"),
          dim("heat", 10),
        ],
        { theme: "romance" },
      ),
      c(
        "rest_feet",
        "Take the ordinary seat. Let the room be quiet.",
        next("luca", 6),
        8,
        [
          rel("luca", 2),
          dim("composure", 8),
          mem("luca", "audience", "Wanted quiet company"),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    7,
    "A message\ncan wait.",
    `
Luca needs to return the equipment case to a storage room. He asks if he can message you when he is done. You ask whether he means a message or another rounded-up commitment. He accepts the question with a wince.

L: A message. If you are busy, you can remain busy. I will find something else to do. There are approximately nine cables available to humiliate me.

He puts the receipt with your music preference into his pocket and the other receipts into the case. The care with which he separates them is touching, though it does not erase the earlier mistake. You are getting used to holding both impressions at once.

A colleague calls from the corridor. Luca answers, then asks you to excuse him. He does not announce that you will help carry the case. You notice. He notices you noticing and almost makes a joke, then lets the small correction stand on its own.

Before he leaves, he says the storage-room reception is terrible. A delayed response might mean the building has eaten it. It might also mean he has been distracted by another person. He would prefer you not construct a tragedy out of either possibility.

He disappears around the corner with the case catching on one heel. The room continues at a different volume without him. For the first time tonight you can choose whom to spend time with without feeling that the person you just left will cease to exist until you return.
`,
    finish("luca"),
    {
      onEnter: [
        later("luca-availability", 26, [
          msg(
            "LUCA",
            "Case returned. I am helping the cleaner label the spare keys. If you want another conversation, find me after you finish yours.",
          ),
          flag("lucaInvited"),
        ]),
      ],
    },
  ),
  arc(
    "luca",
    8,
    "He was\ndoing something else.",
    `
Luca is sitting at a table covered with keys and small paper labels. He has not been waiting in the posture you remember. A cleaner is explaining that a key marked BACK does not help when the building has four things people call the back.

L: I thought it was a useful start. Apparently several years of useful starts have produced the current arrangement.

The cleaner hands him a marker and asks him to write the full door name. He does. You wait while they finish the last three. It takes less time than a conversation about whether your arrival is interrupting would have taken.

He is pleased to see you. He is also invested in finishing this task, and for a moment those two facts compete. You can let the task win without deciding that you have been rejected.

When the cleaner leaves, he shows you the key that defeated them. It opens nothing they tested. They have labelled it UNKNOWN rather than inventing a purpose and creating trouble for the next person. He seems particularly proud of that restraint.

You ask how the rest of his evening went. He begins with the key, then remembers the funding conversation, then looks at you to see which kind of answer you meant. Both, you tell him. You came back to a person, not just the most dramatic thing that happened to him. He puts the marker down and starts again.
`,
    [
      c(
        "ask_keys",
        "Ask about the useless key before the difficult conversation.",
        next("luca", 8),
        6,
        [
          rel("luca", 2),
          mem("luca", "return", "Asked about the ordinary work too"),
        ],
      ),
      c(
        "ask_funding",
        "Ask how the funding explanation went.",
        next("luca", 8),
        6,
        [
          mem(
            "luca",
            "return",
            "Remembered the difficult funding conversation",
          ),
          rel("luca", 1),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    9,
    "The account\nand the person.",
    `
Luca has heard the document decision from you on your return. He gives himself a moment before responding. You watch him almost reach for the easiest joke and then decide it would make you responsible for telling him to be serious.

L: I can respect a decision and still wish you had made a different one. I'm saying that mostly so I can hear myself say it.

You ask which consequence he is worried about. He names the people who will have to explain themselves tomorrow, and the people who may still be unable to. He does not claim to know what every person in the room privately wanted. He knows what a few asked him to do, which is already enough to make agreement complicated.

The marker has left a line across his palm. He rubs it with his thumb while listening to your answer. It spreads. Eventually he stops trying to remove it and rests his hand flat on the table.

You could remind him that you were brought into this without preparation. That remains true. You could ask him to recognise the risk you accepted. That may also be fair. Neither request determines what the decision costs somebody else.

The conversation has become slower than the one beside the speaker. It may be more intimate for that reason, or simply harder. Luca leaves room for your account without promising that hearing it will make him agree. You realise this is something you wanted from him before you had words for it.
`,
    [
      c(
        "hear_cost",
        "Ask him to name the cost he finds hardest to accept.",
        next("luca", 9),
        7,
        [
          rel("luca", 2),
          mem(
            "luca",
            "documentTalk",
            "Heard disagreement without demanding reassurance",
          ),
        ],
      ),
      c(
        "name_own_cost",
        "Explain what the decision cost you, too.",
        next("luca", 9),
        7,
        [
          mem(
            "luca",
            "documentTalk",
            "Asked me to recognise the witness’s own cost",
          ),
          moral("honesty"),
        ],
      ),
    ],
    {
      onEnter: [
        {
          type: "when",
          condition: { flag: "ending", value: "power" },
          then: [
            rel("luca", -2),
            msg(
              "LUCA",
              "Using the document as leverage changes what I can trust you with. It does not mean I have nothing left to say.",
            ),
          ],
        },
      ],
    },
  ),
  arc(
    "luca",
    10,
    "The correction\nneeds a subject.",
    `
The member who thought you had promised to help tomorrow has asked Luca for an introduction. Your earlier conversation has acquired a second audience. Luca shows you the request before answering. That is an improvement. It also means the original mistake is still producing work.

L: I can write that I misunderstood you. Or that your plans changed. The second would be easier for me. That seems a good reason to show it to you before I use it.

Saying your plans changed would preserve his appearance of accuracy while making you look unreliable. Saying he misunderstood would be true, and might make the member question other summaries he has supplied tonight. He could avoid naming you entirely, but a vague correction would leave the assumption available to return later.

You ask why he needs a polished explanation. He says because a small, plain admission feels disproportionately large when he types it. He has been deleting the same nine words for several minutes.

The message remains unsent. You have enough familiarity now to recognise the discomfort beneath his fluency. That does not oblige you to absorb its consequences. You can insist on accuracy, permit a limited ambiguity, or ask to send your own correction while making clear that this does not repair his conduct for him.

He turns the phone so you can read the draft. There are no private amounts or unrelated messages on screen. For once the piece he has offered you is exactly the piece you need to judge.
`,
    [
      c(
        "own_misstatement",
        "Ask him to write: “I misunderstood; they made no commitment.”",
        next("luca", 10),
        7,
        [
          flag("lucaCorrection", "owned"),
          belief(
            "luca",
            "availability",
            "I must ask before describing their commitments",
            "Player required an accurate correction",
          ),
          rel("luca", 2),
          moral("honesty"),
          later("luca-correction", 18, [
            msg(
              "LUCA",
              "Sent the plain version. The member accepted it. Then asked whether my other introductions were equally provisional. A fair, inconvenient question.",
            ),
          ]),
        ],
      ),
      c(
        "limited_correction",
        "Allow “No help has been arranged” without discussing your motives.",
        next("luca", 10),
        6,
        [flag("lucaCorrection", "limited"), moral("privacy"), rel("luca", 1)],
      ),
      c(
        "own_reply",
        "Correct the member yourself; tell Luca why you are doing his work.",
        next("luca", 10),
        7,
        [
          flag("lucaCorrection", "player"),
          rel("luca", -1),
          mem("luca", "correction", "Had to do my correction for me"),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    11,
    "No joke\nat the end.",
    `
Luca says he is sorry. The sentence arrives without a joke attached. You wait, half expecting one to catch up from behind. He notices and smiles, but does not use the smile to change the subject.

L: I made being liked more urgent than being accurate. You were the convenient part. I would rather that sentence weren't true.

You ask what will be different. He says he will ask before describing your availability, show you wording that concerns you, and stop using a warm conversation as evidence of an agreement. They are small enough changes to be observable. They are also things he should already have been doing.

You do not have to grant him a clean slate. It would be possible to continue liking him and to trust his summaries less. It would be possible to appreciate the apology and want distance. He looks disappointed when you say that, then says he knows.

The cleaner comes back for the marker. Luca hands it over and asks whether UNKNOWN should stay on the unidentified key. She says yes. He does not take the interruption as permission to abandon the conversation you were having.

When she leaves, he asks whether you want to answer now. The question gives you a way to end which does not require comforting him first. It is probably the most useful thing he has said in the apology, though telling him so would make it sound like a lesson you came here to teach.
`,
    [
      c(
        "accept_limited",
        "Accept the apology; keep the new limit explicit.",
        next("luca", 11),
        6,
        [
          flag("lucaRepair"),
          rel("luca", 3),
          mem(
            "luca",
            "repair",
            "Accepted an apology without erasing the limit",
          ),
        ],
      ),
      c(
        "need_distance",
        "Thank him for saying it. Ask for more distance.",
        next("luca", 11),
        5,
        [
          flag("lucaDistance"),
          mem(
            "luca",
            "repair",
            "Appreciated the apology and requested distance",
          ),
          moral("autonomy"),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    12,
    "Company\nwith an ending.",
    `
The chairs are going onto tables. Luca collects his coat, discovers the music receipt in the wrong pocket, and checks that he has not lost your recommendation. He offers to walk as far as the corner if you would like company.

You ask whether that would delay his own plans. He says a little. He has promised to call his father before sleeping; the time difference makes the window narrow. He can offer the corner, not the whole walk. You like knowing the shape of the offer before deciding what to put inside it.

L: I am trying an experimental technique where the sentence contains the actual amount of time available.

The joke is modest enough to coexist with the effort. You could accept the walk as company. You could tell him you have felt something more personal and ask whether he wants to revisit that after a night's sleep. You could go alone. The evening has left enough unfinished business that none of those choices would feel entirely simple.

He is listening closely. You have seen him reach too quickly for agreement already. This time he takes a breath before answering, letting the silence last long enough for you to hear how much effort that costs him.

At the door he turns his phone face down. For the next sentence, you have his attention. Beyond that, there is a father waiting for a call and a life you have only begun to hear about.
`,
    [
      c(
        "ask_luca_date",
        "Ask whether he would like to meet again, as a date.",
        next("luca", 12),
        6,
        [
          dim("heat", 12),
          engage("attention.private"),
          {
            type: "when",
            condition: {
              all: [
                { flag: "lucaAttention" },
                { flag: "lucaRepair" },
                { not: { flag: "lucaDistance" } },
                { npc: "luca", trust: 6 },
              ],
            },
            then: [
              flag("lucaChemistry"),
              msg(
                "LUCA",
                "Yes to a date. After sleep. Somewhere that does not contain any of my equipment.",
              ),
            ],
            otherwise: [
              flag("lucaBounded"),
              msg(
                "LUCA",
                "I want to keep this as company. Thank you for asking a question I could answer honestly.",
              ),
            ],
          },
        ],
        { theme: "romance" },
      ),
      c(
        "take_corner",
        "Accept company as far as the corner.",
        next("luca", 12),
        5,
        [
          mem("luca", "walk", "Accepted a short walk with a clear end"),
          rel("luca", 1),
        ],
        { when: { not: { flag: "lucaDistance" } } },
      ),
      c(
        "walk_alone",
        "Choose the walk alone; wish him a good call.",
        next("luca", 12),
        5,
        [
          mem("luca", "walk", "Wanted solitude and remembered my call"),
          rel("luca", 1),
        ],
      ),
    ],
  ),
  arc(
    "luca",
    13,
    "A recommendation\nwithout an assignment.",
    `
Luca folds the receipt rather than handing it back. He says he will send the recommendation when he finds the right recording. You tell him he can also forget until tomorrow. He appears to consider this a useful amendment.

The equipment case is locked, the key labels are legible, and the unidentified key remains unidentified. Nobody has solved it in time for your departure. It is comforting to leave one loose end that does not require courage or an investigation, just the next person trying a few doors in daylight.

L: If my message arrives at an unreasonable hour, it is information, not a summons. I realise I have given you grounds to request that distinction in writing.

He pulls on his coat and finds the missing adapter in the other pocket. There are two adapters. The entire first conversation could have been shorter. He looks at you, recognises the temptation to turn the discovery into another performance, and laughs anyway because sometimes a foolish thing is simply funny.

You know more about him than the elegant account he might have given you at the beginning of the evening. The extra knowledge has made him both easier and harder to trust. That feels like the beginning of a relationship, even if the relationship ends up being a cautious friendship.

Outside, his phone lights with the name of the person he promised to call. He lets you finish your goodbye before answering, then turns his attention toward the voice already waiting on the line.
`,
    close("luca"),
    {
      onEnter: [
        later("luca-track", 23, [
          {
            type: "when",
            condition: { flag: "lucaMusic", value: "new" },
            then: [
              msg(
                "LUCA",
                "The neighbour’s hated track is called Slow Repairs. I found a live version with a terrible introduction. Start after the talking.",
              ),
            ],
          },
          {
            type: "when",
            condition: { flag: "lucaMusic", value: "familiar" },
            then: [
              msg(
                "LUCA",
                "Sent myself a reminder to find the old recording. You wanted something familiar, so I am resisting the urge to improve the recommendation.",
              ),
            ],
          },
          {
            type: "when",
            condition: { flag: "lucaMusic", value: "silence" },
            then: [
              msg(
                "LUCA",
                "No playlist. Remembered you wanted quiet. This message is the last administrative obstacle to that.",
              ),
            ],
          },
        ]),
      ],
    },
  ),
];
