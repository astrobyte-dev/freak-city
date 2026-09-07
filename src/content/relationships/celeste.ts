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
export const celesteArc: Scene[] = [
  arc(
    "celeste",
    1,
    "A screw\nno bigger than a seed.",
    `
Celeste is on her knees beside a cabinet. This is not how she intended to receive you. One arm of her reading glasses has come off and the screw has disappeared into a seam in the floor.

C: Before you offer: I own three spare pairs. All three are in the same drawer at home. An excellent system, geographically unfortunate.

You get down far enough to see beneath the cabinet. There is a button, a cable tie and a small accumulation of fluff that looks expensive in this lighting. No screw. Celeste asks you to stop before you kneel on it. Her voice acquires its usual authority, then loses it when she bumps her head.

She sits back against the cabinet, furious with a piece of furniture. You try not to smile. She notices the effort and tells you it would have been less embarrassing if you had simply laughed.

A worker brings tape. Celeste thanks him by name, asks about a delivery, and is told that they have already discussed the delivery twice. He places the tape within reach and leaves before she can discuss it a third time.

C: Apparently I am repeating myself. You may tell me when I do that. Once should suffice.

The arm can be taped in place. It will look ridiculous and work perfectly well until morning. She holds out the roll, waiting to see whether you will make her ask twice for such a small, unglamorous thing.
`,
    [
      c(
        "tape_glasses",
        "Hold the arm steady while she tapes it.",
        next("celeste", 1),
        6,
        [
          mem(
            "celeste",
            "glasses",
            "Helped with the taped glasses without making a performance of it",
          ),
          rel("celeste", 2),
        ],
      ),
      c(
        "laugh_glasses",
        "Laugh, then offer to find a better light.",
        next("celeste", 1),
        6,
        [
          mem(
            "celeste",
            "glasses",
            "Laughed when invited; found a better light",
          ),
          rel("celeste", 1),
          flag("celesteLaughed"),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    2,
    "Dinner has\nbeen here for hours.",
    `
Her dinner is in a paper bag behind the till. She unfolds the top with the ceremonial care of someone postponing a disappointment. Inside is a flattened sandwich and a note reminding her to eat it. The note is in her own handwriting.

C: I was persuasive when I wrote this.

She offers half. You can decline; she has mistaken neither conversation nor hunger for an obligation. The sandwich contains a very assertive pickle. Celeste takes a bite, stops talking, and drinks half a glass of water.

You ask whether this was her first choice of dinner. She says she ordered something sensible and then changed her mind while the person on the telephone was already reading the order back. The sensible thing probably arrived hot at somebody else's house.

C: I can make a decision involving a building before lunch. Put four soups in front of me and I become an administrative problem.

She asks what you would have ordered. When you begin to consider the question, she tells you there is no correct answer hidden behind it. She wants a recommendation because she is bored with her own recommendations. There is something disarming about being asked for expertise that extends no further than a late meal.

A staff member retrieves the mustard from beside her elbow without interrupting. She moves automatically. Whatever else she owns here, this corner of the counter plainly belongs to everybody who needs it.
`,
    [
      c("soup", "Recommend the least sensible soup.", next("celeste", 2), 5, [
        flag("celesteMeal", "soup"),
        mem(
          "celeste",
          "meal",
          "Recommended soup; refused to make dinner a status test",
        ),
        rel("celeste", 1),
      ]),
      c(
        "toast",
        "“Toast. At this hour I trust toast.”",
        next("celeste", 2),
        5,
        [
          flag("celesteMeal", "toast"),
          mem("celeste", "meal", "Trusts toast after midnight"),
          rel("celeste", 1),
        ],
      ),
      c(
        "decline_meal",
        "Decline the food. Stay for the conversation.",
        next("celeste", 2),
        4,
        [
          flag("celesteMeal", "none"),
          mem("celeste", "meal", "Wanted conversation without sharing dinner"),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    3,
    "The programme\nwith the bad wallpaper.",
    `
Celeste asks whether you watch the renovation programme where people uncover fireplaces they cannot afford to repair. You have seen enough of it to know the wallpaper. She seems relieved not to have to explain.

C: They always call the damp unexpected. The wall is green. What were they expecting?

She watches it with her sister on separate televisions, exchanging messages about the same impossible kitchen. Her sister pauses to take calls and then accuses Celeste of spoiling the reveal. They have had this argument for three seasons. Neither has proposed watching something else.

You start to connect this habit to her ownership of Velvet. She lifts a finger before you finish.

C: Sometimes a person who manages a property enjoys watching a different person manage one badly. Sometimes she likes the little dog that keeps escaping the surveyor. Please leave room for the dog.

It is the first time she has asked you to stop interpreting her. The request is lightly delivered. It still matters. You realise how easy it would be to turn every ordinary preference she gives you into evidence about control.

She describes an episode in which the dog stole an expensive sample of wallpaper. Her description becomes needlessly detailed. You let it. Down the corridor, somebody laughs at a different joke; the two conversations coexist without becoming part of the same intrigue. For a little while the building has room for that.
`,
    [
      c(
        "leave_dog",
        "Ask whether the dog preferred the expensive wallpaper.",
        next("celeste", 3),
        6,
        [
          mem(
            "celeste",
            "television",
            "Let the television story stay ordinary",
          ),
          rel("celeste", 2),
          flag("celesteDog"),
        ],
      ),
      c(
        "name_pattern",
        "“I do keep looking for a motive. Occupational hazard tonight.”",
        next("celeste", 3),
        5,
        [
          belief(
            "celeste",
            "interpretation",
            "Knows they keep interpreting me",
            "Player admitted the habit",
          ),
          rel("celeste", 1),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    4,
    "What the\nclothes suggested.",
    `
A member asks Celeste whether you are from the board. It is an understandable mistake in this part of the room. Celeste corrects it before you can decide whether being mistaken for someone powerful would be useful.

When the member leaves, she says she should have let you answer. You ask what she thought when you first came in. She begins with the letter, then stops. That was what made you relevant. It was not the first thing she noticed.

C: You looked as though you had decided how you wanted to be received. I mistook that for knowing what you were walking into.

She admits she has also mistaken expensive shoes for financial security and a person's silence for agreement. One of those mistakes cost the person more than it cost her. She does not supply the name. You do not need it to hear the admission.

You look at the tape on her glasses. The woman who defines the room's terms has spent twenty minutes unable to read a menu without holding part of her face together. It has made her easier to like. That may be another unfair interpretation.

C: Tell me one thing I got wrong. About you. I can survive an answer that isn't flattering.

The question makes you unusually aware of her attention. You can correct her, refuse the inspection, or admit that being overestimated was briefly pleasant. Each answer would change the terms of this conversation more than your clothing ever could.
`,
    [
      c(
        "correct_impression",
        "“I wanted to look as if I belonged. That isn’t the same thing.”",
        next("celeste", 4),
        6,
        [
          belief(
            "celeste",
            "arrival",
            "Wanted to belong, did not know the room",
            "Player corrected my first impression",
          ),
          rel("celeste", 2),
        ],
      ),
      c(
        "enjoy_impression",
        "“I liked being overestimated. Briefly.”",
        next("celeste", 4),
        5,
        [
          belief(
            "celeste",
            "arrival",
            "Can admit enjoying apparent status",
            "Player said so directly",
          ),
          rel("celeste", 1),
        ],
      ),
      c(
        "decline_impression",
        "“I’d rather be allowed to remain unclear.”",
        next("celeste", 4),
        4,
        [
          belief(
            "celeste",
            "arrival",
            "Wants privacy even during a friendly conversation",
            "Player declined to explain",
          ),
          moral("autonomy"),
          rel("celeste", 1),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    5,
    "Relief for\none person.",
    `
Her telephone interrupts with a staffing request. Noor, an adult server finishing a double shift, wants to go home before the last bookings arrive. Celeste could cover the room herself. She could also call in a colleague who needs the hours and has already arranged childcare for tomorrow, not tonight.

C: There is a third possibility. We close the small room. Refund two bookings. Everybody tells me it was an overreaction by Monday.

You ask why she is telling you. She says because you have spent an evening hearing people describe her decisions after she has made them. This one is still undecided. She would like to know whether the advice sounds simpler from your side of the counter.

Noor has not asked you to advocate for her. The colleague has not agreed to come in. Closing a room will disappoint people who paid for privacy and arranged their own evenings around it. None of that makes an exhausted worker less exhausted.

C: If I cover it, I postpone a call I promised my sister. She will understand. She is tired of being the person who understands.

Celeste reads the request again. You can hear the attraction of giving her a decisive answer and being the person she listens to. You can also hear how quickly the satisfaction would become hers to pay for. She asks for your view, and makes it clear that the eventual decision will carry her name.
`,
    [
      c(
        "close_room",
        "Recommend closing the room and owning the refund.",
        next("celeste", 5),
        7,
        [
          flag("celesteStaff", "closed"),
          rel("celeste", 1),
          moral("protection"),
          later("celeste-refunds", 32, [
            msg(
              "CELESTE",
              "The small room is closed. One member thanked us. Another wants a written explanation. Noor has gone home.",
            ),
          ]),
        ],
      ),
      c(
        "cover_room",
        "Ask whether she can cover it herself this once.",
        next("celeste", 5),
        7,
        [
          flag("celesteStaff", "covered"),
          moral("responsibility"),
          later("celeste-sister", 32, [
            msg(
              "CELESTE",
              "I covered the room. My sister said she understood, then ended the call. Both statements are information.",
            ),
          ]),
        ],
      ),
      c(
        "ask_worker",
        "Suggest asking the colleague, with a real right to refuse.",
        next("celeste", 5),
        7,
        [
          flag("celesteStaff", "asked"),
          moral("autonomy"),
          later("celeste-cover", 32, [
            msg(
              "CELESTE",
              "The colleague declined. I accepted it and covered the room. Asking was worth doing; it did not create an obligation.",
            ),
          ]),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    6,
    "A seat\nheld open.",
    `
A small table becomes available as two guests collect their coats. Celeste puts her notebook down, then asks if you would like to sit. The offer is direct enough that refusing it would not require inventing somewhere else to be.

C: Ten minutes. I can promise ten minutes without making somebody else wait for me.

The table is slightly too small for a conversation that pretends to be formal. You move a water glass to make room for her notebook. She leaves the notebook shut. Beyond the screen, people pass in fragments: an elbow, a laugh, somebody looking for a chair. Here, being listened to feels less public.

You ask whether she ever comes to Velvet when she is not working. She says yes, but people remember that she can solve their problems. Once somebody asked her about an invoice in the middle of a goodbye. She had been angry enough to remember the invoice and embarrassed enough to forget what she had meant to say.

C: Being useful is convenient camouflage. You can spend a whole evening wanting company and claim you've been attending to business.

She looks at the notebook as though it has betrayed her. You could let the observation remain general. You could ask whether this is business. You could suggest a little ceremony of putting work away, if that is a dynamic you want to explore together. Whatever you choose, the ten minutes will end; a bounded offer is still an offer.
`,
    [
      c(
        "ask_chemistry",
        "“Is this business?” Hold her attention.",
        next("celeste", 6),
        10,
        [
          flag("celesteAttention"),
          engage("attention.private"),
          rel("celeste", 2, "affinity"),
          dim("heat", 10),
        ],
        { theme: "romance" },
      ),
      c(
        "offer_ritual",
        "Ask her to set the notebook aside; either of you may end the ritual.",
        next("celeste", 6),
        10,
        [
          engage("authority.negotiated"),
          mem(
            "celeste",
            "ritual",
            "Asked for a shared rule with an explicit exit",
          ),
          rel("celeste", 1),
        ],
        { theme: "powerExchange" },
      ),
      c(
        "stay_colleagues",
        "“Company counts even when it stays professional.”",
        next("celeste", 6),
        10,
        [
          mem("celeste", "company", "Welcomed professional company"),
          rel("celeste", 2),
          flag("celesteProfessional"),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    7,
    "Someone\nelse gets a turn.",
    `
The telephone vibrates against the notebook. Celeste looks at the name and her expression changes before she has decided what expression to use. It is her sister.

She asks you to excuse her. Not to stay exactly where you are, not to promise you will resume the sentence. Just to excuse her. When you stand, she catches the notebook before it slides off the table and laughs at herself for once again trying to hold too many things at once.

C: If we're both here later, I would like to finish talking. That is an invitation, not an appointment you have to keep at the expense of the rest of your evening.

You leave her enough distance for the call. The first thing you hear is an apology. The second is a complaint about a leaking washing machine. Whatever urgency you had imagined in the vibrating telephone turns out to involve a towel and a neighbour's ceiling.

At the end of the screen, a worker has placed a sign asking guests to keep the passage clear. You realise you are reading it while standing in the passage. Moving aside feels like returning to the ordinary scale of things.

Celeste is already listening to somebody else. She has not become less interesting because her attention has left you. You have, however, learned that it will leave you. Later, if you come back, you will be returning to a person whose evening continued in your absence.
`,
    finish("celeste"),
  ),
  arc(
    "celeste",
    8,
    "The refunds\nhave names.",
    `
The small-room sign has changed. Celeste is beside the till with a calculator that keeps turning itself off. Her taped glasses are back on. She recognises you, finishes the sum on paper, and asks for a minute rather than pretending she was doing nothing.

You wait. A guest complains that being offered a refund does not restore their evening. Celeste agrees. The agreement disarms neither of them; he wanted his booking and she cannot give him that version of the night. She offers another date. He declines and takes his coat.

C: There. A reasonable complaint. I still dislike being the person receiving it.

You ask what happened while you were elsewhere. She says she made the staffing decision, dealt with the immediate consequences, and called her sister back. None of those actions solved the other two. She has written tomorrow's follow-up on her hand because the notebook has become a place to forget things efficiently.

There is room beside the till if you want to stay. She does not return automatically to the tone of the small table. The room has asked more of her since then. If you want closeness, you will have to meet her where she actually is rather than where you left her.

She hands the calculator to a passing worker and asks him to buy a battery in the morning. He writes that on his own hand. For a moment management resembles a correspondence conducted entirely on skin.
`,
    [
      c(
        "ask_actual",
        "Ask how she is, now that the decision is real.",
        next("celeste", 8),
        6,
        [
          rel("celeste", 2),
          mem(
            "celeste",
            "return",
            "Asked about the actual outcome, not whether my advice won",
          ),
        ],
      ),
      c(
        "name_advice",
        "Ask whether your advice helped.",
        next("celeste", 8),
        5,
        [
          belief(
            "celeste",
            "advice",
            "Needs reassurance about their influence",
            "Asked whether their advice helped",
          ),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    9,
    "The favour\nwith a receipt.",
    `
Luca arrives carrying a broken case handle. He asks Celeste where to put the replacement receipt. She names a drawer. He says he would rather reimburse her. She says that was not the arrangement. The conversation is quiet, familiar and going badly.

He notices you and stops. Celeste asks whether he wants privacy. He says no, then corrects himself: yes, for the amount. He is willing to explain the rest. She paid for repairs to equipment he uses at several venues. Some people here assume that makes his work for her less independent.

L: I would like to be able to criticise an invoice without everybody asking who bought the screwdriver.

Celeste says she has never asked him to soften a criticism. Luca agrees. That is part of what makes the problem difficult to name. She can afford a generosity that costs him an explanation every time somebody discovers it.

You are not invited to inspect the receipt. You are invited to witness two people disagreeing about whether keeping a favour private protects dignity or produces suspicion. The answer might depend on who is doing the keeping.

Celeste asks Luca to propose a written arrangement tomorrow. He says he will, and takes the broken handle with him because throwing it away now would somehow feel like conceding the argument. She watches him leave with real affection and considerable irritation. Both survive the disagreement.
`,
    [
      c(
        "keep_amount",
        "Respect the private amount. Ask what an independent arrangement needs.",
        next("celeste", 9),
        7,
        [
          mem("celeste", "favour", "Respected Luca’s private amount"),
          moral("autonomy"),
          rel("celeste", 1),
        ],
      ),
      c(
        "name_leverage",
        "“Even a generous favour can make refusal harder.”",
        next("celeste", 9),
        7,
        [
          belief(
            "celeste",
            "favour",
            "Sees the unpriced pressure in a favour",
            "Player said this in my presence",
          ),
          moral("honesty"),
          rel("celeste", 1),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    10,
    "A useful\nthing to refuse.",
    `
Celeste offers you a car home. You look at her for long enough that she adds: a licensed car, ordered through the desk, no further conversation attached. She knows what the offer could sound like after the argument you just witnessed.

C: I don't want every useful thing I can do to become suspicious. I also understand that wanting that doesn't settle it.

You could accept because you are tired. You could decline because you want the walk. You could decline because leaving under your own steam matters more after an evening of being given terms. She cannot tell which from your face, and for once does not guess.

The desk phone rings. She lets a colleague answer it. You realise she is waiting for an actual answer rather than filling the space with a more persuasive version of the offer.

Outside, the rain has reduced to occasional drops from the awning. The streets between here and your apartment are familiar enough. The decision concerns comfort, pride and how you would like this conversation to end, not whether you will be stranded.

C: If you say no, I will still be pleased we talked. I would prefer not to make you demonstrate that by saying yes.

Her phrasing is careful. The care can be attractive and a little exhausting at the same time. You are allowed to tell her that too, though you might want to decide whether it is kindness or a parting shot before you do.
`,
    [
      c(
        "accept_car",
        "Accept a ride arranged through the desk.",
        next("celeste", 10),
        5,
        [
          flag("carHome"),
          mem(
            "celeste",
            "ride",
            "Accepted a practical ride without a further obligation",
          ),
        ],
      ),
      c(
        "decline_car",
        "“I want the walk. Thank you for asking once.”",
        next("celeste", 10),
        5,
        [
          mem("celeste", "ride", "Declined the ride; wanted the walk"),
          rel("celeste", 2),
          moral("autonomy"),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    11,
    "After the\npaper has moved.",
    `
You bring the conversation back to the document. Celeste folds the dinner bag, too neatly for a bag that is about to be thrown away. She says she knows the decision you brought back into the room. She is willing to discuss its consequences. She is not willing to pretend affection would have made a different decision correct.

C: People keep asking whether I am disappointed in them when what they mean is whether I will stop liking them. It makes a difficult conversation almost impossible.

You ask whether she can separate the two. She says not immediately. She can try to behave as though she knows the difference while the rest catches up.

A worker calls from the corridor to ask who has tomorrow's keys. Celeste gives an answer, checks it, then sends a correction. You watch her make a small mistake in public without collapsing into either authority or apology. It should not be remarkable. Tonight it is useful to see.

The document decision remains yours. The institution's conduct remains hers to answer for. Your growing interest in each other, whether personal or professional, makes that division less comfortable without making it disappear.

C: We can leave this unsettled. A conversation is allowed to end before either person has made the other feel innocent.

She holds the folded bag between two fingers. It is ready for the bin. She has been waiting for the sentence to finish before letting go.
`,
    [
      c(
        "own_document",
        "Acknowledge the costs of your decision without asking her to absolve you.",
        next("celeste", 11),
        7,
        [
          mem(
            "celeste",
            "documentTalk",
            "Owned the decision without asking for absolution",
          ),
          rel("celeste", 2),
        ],
      ),
      c(
        "ask_accountability",
        "Ask what she will personally answer for tomorrow.",
        next("celeste", 11),
        7,
        [
          mem(
            "celeste",
            "documentTalk",
            "Asked for a concrete account of my responsibility",
          ),
          moral("honesty"),
          rel("celeste", 1),
        ],
      ),
    ],
    {
      onEnter: [
        {
          type: "when",
          condition: { flag: "ending", value: "public" },
          then: [
            rel("celeste", -2),
            msg(
              "CELESTE",
              "The desk has the published account. Tomorrow I will answer it in writing. Tonight I can still speak to you.",
            ),
          ],
        },
      ],
    },
  ),
  arc(
    "celeste",
    12,
    "The answer\nbelongs to her.",
    `
The room is almost empty. Celeste removes the glasses and finally peels the tape away from her hair. You offer to hold them; she accepts. For a moment you are trusted with something that can be broken very easily and is worth very little to anyone else.

She asks whether you have enjoyed her company. It is a more exposed question than asking whether you found the evening useful. You could return it immediately, but that would let you hear her answer before risking your own.

C: I am not asking for a flattering answer. Or a large one. It has been a long night.

You have felt several things in her company and cannot yet put them in order. The taped glasses lie between you. She has stopped reaching for a practical task to soften the question, and you find yourself doing the same.

She has paid attention to how you handled disagreement, how you treated the people working here, and whether you could hear a small refusal without making her responsible for your embarrassment.

When you hand back the glasses, your fingers do not quite meet. The gap is brief and noticeable. She puts them in their case, shuts it, and gives you time to choose an answer that belongs to you.
`,
    [
      c(
        "name_attraction",
        "Say you are attracted to her; leave her room to answer.",
        next("celeste", 12),
        7,
        [
          engage("attention.private"),
          flag("celesteAsked"),
          dim("heat", 12),
          {
            type: "when",
            condition: {
              all: [
                { npc: "celeste", trust: 7 },
                { flag: "celesteAttention" },
                { not: { flag: "celesteProfessional" } },
              ],
            },
            then: [
              flag("celesteChemistry"),
              rel("celeste", 2, "affinity"),
              msg(
                "CELESTE",
                "Yes. I would like to see you when neither of us is conducting business. We can decide what that means then.",
              ),
            ],
            otherwise: [
              flag("celesteBounded"),
              msg(
                "CELESTE",
                "I have liked talking. I want to leave it there tonight. You have not embarrassed me by asking.",
              ),
            ],
          },
        ],
        { theme: "romance" },
      ),
      c(
        "name_uncertain",
        "“I enjoyed this. I don’t yet know what kind of interest it is.”",
        next("celeste", 12),
        6,
        [
          engage("attention.private", "uncertain"),
          mem(
            "celeste",
            "interest",
            "Interested and uncertain; did not promise an answer",
          ),
        ],
        { theme: "romance" },
      ),
      c(
        "name_professional",
        "“I would like us to be able to talk honestly again.”",
        next("celeste", 12),
        6,
        [
          flag("celesteProfessional"),
          rel("celeste", 2),
          mem(
            "celeste",
            "interest",
            "Wants an honest professional relationship",
          ),
        ],
      ),
    ],
  ),
  arc(
    "celeste",
    13,
    "One promise\nsmall enough to keep.",
    `
Celeste tears a blank corner from the dinner order and writes a time on it. Not an invitation to another secret room. The time tomorrow when she intends to send the staffing decision and payment arrangements to the people affected.

C: If I make that vague, it becomes something I meant well about. I would like it to become something I did.

She reads the note once, photographs it for herself and puts it in the notebook. You do not become responsible for reminding her. It matters that she has chosen a way of remembering which will work after you leave.

Her sister calls again. This time it is a message containing a photograph of the repaired washing machine and a very unconvincing thumbs-up. Celeste shows you the thumb and keeps the family kitchen to herself. You appreciate the distinction without needing to comment on it.

At the door she asks you to tell the desk whether you still need the car, if you requested it. Practical things are allowed to survive a complicated conversation. So is a goodbye without a promise of intimacy.

You take one last look at the closed glasses case. Tomorrow she will have three intact pairs available and will probably still misplace the one she wants. You know that about her now. It is not leverage. It is simply part of the person you will picture when her name appears on your phone.
`,
    close("celeste"),
    {
      onEnter: [
        later("celeste-goodnight", 25, [
          {
            type: "when",
            condition: { flag: "celesteDog" },
            then: [
              msg(
                "CELESTE",
                "My sister says the dog returns in episode six. This is the only information I am prepared to call reassuring tonight.",
              ),
            ],
          },
          {
            type: "when",
            condition: { flag: "celesteMeal", value: "toast" },
            then: [
              msg(
                "CELESTE",
                "Toast was the correct answer. The pickle has lost its appeal.",
              ),
            ],
          },
        ]),
      ],
    },
  ),
];
