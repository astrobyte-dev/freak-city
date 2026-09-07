import type { Scene } from "../../engine/types";
import {
  arc,
  next,
  c,
  flag,
  rel,
  mem,
  moral,
  dim,
  msg,
  belief,
  later,
  finish,
  close,
} from "./helpers";
export const inezArc: Scene[] = [
  arc(
    "inez",
    1,
    "Back for\none more hour.",
    `
Inez is back at the door. You thought she had finished. She had: she went to her sister's, delivered a bag of groceries, and was taking off her shoes when the relief worker called. His child was ill. She agreed to cover another hour and put the shoes back on.

I: My sister has kept the groceries. She says next time she will keep me as well.

She gives you a chair that seems to have been designed to discourage conversation. You sit anyway. The street has changed since you arrived. Delivery vans have replaced the taxis at the far kerb, and somebody has finally collected the collapsed umbrella beside the drain.

You ask whether she minds returning. She says yes. That is why she asked to be paid for it. Caring that a colleague has a problem does not make her time cease to be time.

A man emerges to ask whether the pharmacy is still open. Inez checks her phone before answering. You had expected her to know. She says the hours changed last week, and being confidently wrong would make his walk longer.

There is a thermos at her feet, two cups on the ledge and no suggestion that sitting here makes you part of the staff. She offers tea and asks what sort of conversation you want: something useful, something ordinary, or silence with another person in it. The last option sounds surprisingly inviting after the room upstairs.
`,
    [
      c(
        "ordinary_inez",
        "Ask for something ordinary. Accept the chair.",
        next("inez", 1),
        6,
        [
          rel("inez", 2),
          mem(
            "inez",
            "return",
            "Wanted an ordinary conversation after the first shift",
          ),
        ],
      ),
      c(
        "quiet_inez",
        "Choose a little quiet before talking.",
        next("inez", 1),
        7,
        [
          dim("composure", 10),
          mem(
            "inez",
            "return",
            "Could sit quietly without demanding an explanation",
          ),
          rel("inez", 1),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    2,
    "The missing\nblue mitten.",
    `
The lost-property box contains an adult-sized blue mitten, a charger with a bent plug and a book with no cover. Inez is trying to decide whether the mitten arrived tonight or has been living here since winter.

I: If I leave it loose, its owner won't see it. If I bag it, it looks important and everybody asks whether it is evidence. It is a mitten.

You suggest a sign. She asks what the sign should say beyond MITTEN. Neither of you finds a useful answer. The book has a page folded over at a recipe involving lemons. You resist the urge to decide that makes it a clue about the person who lost it.

A guest returns for a black scarf, finds it, and spends several minutes explaining how careful she usually is with scarves. Inez listens without taking the offered biography as payment. When the woman leaves, she says people dislike needing help with something they think should have been beneath them.

You ask whether she ever loses things. She holds up a glove from her own pocket. It is not the partner to the one on her other hand. She noticed an hour ago and has been hoping nobody would ask.

The confession changes the lost-property box from a display of other people's failures into a shared practical inconvenience. You move the mitten where its owner might actually see it. Inez tries on the mismatched glove again, decides it is warm enough and lets the issue rest.
`,
    [
      c(
        "mitten_visible",
        "Put the mitten on the ledge, well away from the rain.",
        next("inez", 2),
        5,
        [
          flag("inezMitten", "ledge"),
          mem("inez", "mitten", "Put the mitten where its owner could see it"),
          rel("inez", 1),
        ],
      ),
      c(
        "mitten_bag",
        "Label a clear bag with tonight’s date and “blue mitten”.",
        next("inez", 2),
        5,
        [
          flag("inezMitten", "bag"),
          mem(
            "inez",
            "mitten",
            "Dated the mitten bag without inventing a history",
          ),
          rel("inez", 1),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    3,
    "What plays\nbetween calls.",
    `
Inez's phone produces a few seconds of someone arguing about a cake. She turns it off and tells you it is a radio programme, not an emergency in the family. People send in their failed recipes. A patient woman asks what they changed. Usually the answer is everything.

I: Yesterday a man replaced the eggs with something he had read about once. Wouldn't say what. Wanted the presenter to solve it under those conditions.

You ask whether she cooks. She says she can feed herself and three other people without enjoying an audience. Her sister watches cooking competitions and shouts at contestants for using bowls inefficiently. Inez prefers the radio because she can disagree while doing something else.

She asks what you put on when a room feels too quiet. Music, familiar voices, nothing at all: she seems interested in the scale of the answer, not what it reveals about your childhood. You find yourself wanting to answer accurately because she is giving the question such a modest amount of space.

A taxi slows at the wrong door. Inez points the driver onward, then waits for you to finish. She has not forgotten where your sentence stopped. Being listened to by somebody who spends a working life listening can feel exposing. Here it feels mostly comfortable.

When you ask what happened to the cake, she says they never found out. The caller disconnected. There are unresolved mysteries she is entirely happy to leave unresolved.
`,
    [
      c(
        "radio_company",
        "Tell her you like familiar voices in the background.",
        next("inez", 3),
        6,
        [
          flag("inezRadio", "voices"),
          mem("inez", "homeSound", "Likes familiar voices in an empty room"),
          rel("inez", 2),
        ],
      ),
      c(
        "radio_music",
        "Tell her music makes the room feel like yours.",
        next("inez", 3),
        6,
        [
          flag("inezRadio", "music"),
          mem("inez", "homeSound", "Uses music to settle at home"),
          rel("inez", 2),
        ],
      ),
      c("radio_quiet", "“I like the quiet. Eventually.”", next("inez", 3), 5, [
        flag("inezRadio", "quiet"),
        mem("inez", "homeSound", "Likes quiet after taking time to settle"),
        rel("inez", 1),
      ]),
    ],
  ),
  arc(
    "inez",
    4,
    "The colour\nshe remembered.",
    `
A worker comes out looking for a red delivery trolley. Inez tells him it went through the side door. He comes back a minute later with a grey one. The red trolley is already inside, exactly where he first looked.

Inez checks the doorway, then the trolley, and says she was wrong. The worker shrugs. You realise you have treated her recollection as something more reliable than an ordinary person's memory because she delivers it without hesitation.

I: I remember a trolley. I remember red. Apparently I have introduced them without checking whether they met.

You ask whether that happens often. She says it happens to everybody. What matters is whether people feel able to bring the grey trolley back and tell her. Being known as accurate can make correction feel like an accusation, which is a foolish arrangement if accuracy is what you actually want.

She writes the correction on the shift pad. The original note remains legible beneath it. There is no reason to conceal a small error, but you understand how someone could begin with a small one and acquire the habit.

The streetlight changes from white to amber as its timer resets. For a moment everything in the doorway looks like a different colour. Inez watches you notice and smiles. She is not offering that as an excuse. It is simply useful to remember how many ordinary things can interfere with certainty.

You can tell her the admission makes her easier to trust, or admit that you had been making her into a person who never needed checking.
`,
    [
      c(
        "trust_correction",
        "“I trust the correction more than I trusted the certainty.”",
        next("inez", 4),
        6,
        [
          rel("inez", 2),
          belief(
            "inez",
            "accuracy",
            "Values a visible correction",
            "Player said so after the trolley mistake",
          ),
        ],
      ),
      c(
        "admit_pedestal",
        "Admit you had assumed she always remembered correctly.",
        next("inez", 4),
        6,
        [
          rel("inez", 1),
          belief(
            "inez",
            "accuracy",
            "Had mistaken my confidence for infallibility",
            "Player admitted the assumption",
          ),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    5,
    "Whose explanation\nis it to give?",
    `
The relief worker sends another message. His name is Tom. His child is now asleep, but he cannot leave until another adult gets home. A supervisor has written on the shared shift thread that Tom is unreliable again.

Inez knows why he is absent. He asked her to keep the child's health off the thread because colleagues have begun treating every request for flexibility as a family emergency they are entitled to inspect. The supervisor's remark is unfair. Correcting it with the full explanation would use exactly the information Tom asked her to protect.

I: I can say he arranged cover. That's true. It won't stop people deciding the reason must be bad if he won't publish it.

She could ask Tom for permission to say more. That would make him negotiate his privacy while tending a sick child. She could challenge the supervisor without supplying a reason, knowing the argument may then become about her tone. Or she could wait until morning, leaving the remark unopposed while people read it tonight.

You are not being asked to enter the staff thread. You are being asked what kind of loyalty survives having to choose between two things a friend needs. Tom needs the confidence kept. He also needs the people assigning his shifts to stop describing him as careless.

Inez turns the phone face down. She will choose what to write herself. Your advice may help, but it will not make you the person who has to work with the reply tomorrow.
`,
    [
      c(
        "challenge_thread",
        "Recommend challenging the claim using only the arranged cover.",
        next("inez", 5),
        7,
        [
          flag("inezThread", "challenged"),
          moral("protection"),
          rel("inez", 1),
          later("inez-thread-reply", 28, [
            msg(
              "INEZ",
              "I wrote that Tom arranged cover responsibly. Supervisor says we should discuss my tone tomorrow. Tom says thank you. Two replies, two problems.",
            ),
          ]),
        ],
      ),
      c(
        "ask_tom",
        "Suggest asking Tom what he wants shared.",
        next("inez", 5),
        7,
        [
          flag("inezThread", "asked"),
          moral("autonomy"),
          later("inez-tom-reply", 28, [
            msg(
              "INEZ",
              "Tom gave permission to say “family care”, nothing more. He also asked not to have any more decisions sent to him tonight. Fair.",
            ),
          ]),
        ],
      ),
      c(
        "wait_thread",
        "Recommend waiting to speak privately in the morning.",
        next("inez", 5),
        7,
        [
          flag("inezThread", "waited"),
          moral("privacy"),
          later("inez-wait-reply", 28, [
            msg(
              "INEZ",
              "I left the thread alone. Another worker has repeated the unreliable remark. Waiting kept the confidence and let the wrong account travel.",
            ),
          ]),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    6,
    "A lift\nis also a conversation.",
    `
Inez's sister has offered to collect her. Inez would prefer the bus. The sister's car is warm, reliable and likely to contain a conversation about whether she takes on too many extra shifts. The bus has none of those advantages or disadvantages.

I: She would be right. That is the irritating part. I would like to get home before agreeing with her.

You ask why she said yes to covering. Money, she says first. Then habit. Then because she remembers being the person who needed someone to answer. The reasons can coexist without turning the decision into an act of sainthood.

She asks whether you ever accept help slowly enough that people stop offering it. You could say no. You could describe a small example. The doorway is private enough for an honest answer without demanding a confession. She keeps her eyes on the street while you think, giving you the relief of not being watched assemble it.

A bus goes past in the wrong direction. Inez checks the display anyway. You tell her that seems optimistic. She says sometimes a useful bus is having a bad day too.

She has decided to accept the lift. The message she sends includes an explicit request not to discuss the extra shift until tomorrow. You do not see the answer, but you see her smile at it. There are relationships in her life where a small boundary already has a familiar place to land.
`,
    [
      c(
        "tell_help",
        "Tell her you sometimes make accepting help needlessly difficult.",
        next("inez", 6),
        7,
        [
          mem("inez", "help", "Admitted finding help difficult to accept"),
          rel("inez", 2),
        ],
      ),
      c(
        "keep_help_private",
        "“That’s one I would like to keep to myself.”",
        next("inez", 6),
        5,
        [
          mem("inez", "help", "Declined a personal question plainly"),
          rel("inez", 1),
          moral("autonomy"),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    7,
    "The end\nof the extra hour.",
    `
Her replacement is on the way. Inez asks whether you intend to be around at closing. She would appreciate a second pair of eyes while she checks the lost-property list, but if you have promised somebody else your time, that promise should keep its shape.

I: It is a list of umbrellas and a mitten. We can survive without an outside witness.

You laugh. She takes a moment to enjoy the fact that the joke has required neither a secret nor an insult. The room behind her sends out a burst of music as someone opens the inner door, then settles back to its muffled version.

She tells you where she will leave the shift pad. If you return and she has already gone, the person at the door can do the handover. Her usefulness to you does not require her remaining indefinitely available. You appreciate being told before your imagination can turn an empty chair into a disappointment with a personal meaning.

The relief worker sends his arrival time. She replies with the practical information he needs and leaves the argument about the thread for another conversation. Work continues even when the people doing it are cross with each other.

You stand carefully; the chair has been no kinder to your legs with time. Inez takes the empty cup and asks you to bring it back if you absent-mindedly take it. It belongs to her sister. Apparently lending cups is another family negotiation with a longer history than either of you has time for tonight.
`,
    finish("inez"),
  ),
  arc(
    "inez",
    8,
    "She has\nalready answered.",
    `
The chair is occupied by a different worker. Inez is inside the entrance, checking the shift pad before leaving. She sees you and moves a stack of folded coats off the bench. There is room, though not an entire evening left in it.

She has acted on the staffing message while you were elsewhere. Whatever advice you offered, she has had to put it into words she can defend tomorrow. She describes what she sent and what came back, keeping Tom's private details out of the public doorway.

I: You can give someone a good sentence. They still have to live in the room after saying it.

You ask whether she regrets replying. She says regret is too large a word for this stage. She has made one part of the problem clearer and another part less comfortable. Tomorrow may reveal whether that was useful.

The replacement asks where the spare umbrella bags are. Inez points, waits for him to find them, then returns to the conversation. She is not pleased to be interrupted. She is also unwilling to leave someone struggling with an avoidable problem just to demonstrate that her shift is over.

You are beginning to distinguish generosity from availability in her. The first survives the end of the second. She checks the time of her sister's arrival and tells you how long she actually has, then sits down without looking as though you must justify every minute.
`,
    [
      c(
        "ask_answer",
        "Ask how it felt to send her own answer.",
        next("inez", 8),
        6,
        [
          rel("inez", 2),
          mem(
            "inez",
            "followup",
            "Asked about living with the decision, not whether my advice won",
          ),
        ],
      ),
      c(
        "offer_handover",
        "Offer to finish the ordinary handover first.",
        next("inez", 8),
        6,
        [
          mem("inez", "followup", "Helped finish before asking for more time"),
          rel("inez", 1),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    9,
    "It belonged\nto the wrong hand.",
    `
The blue mitten has been claimed. Its owner came back for a charger, saw the mitten and recognised it immediately. Inez says your placement helped. Then she admits she had been looking for a person wearing the matching mitten, which would have required someone to come out for the night with one warm hand.

I: Apparently I wanted the solution to wear a label. Convenient for me. Unreasonable for the mitten.

The charger remains unclaimed. The book has been collected by a woman who says she only wanted the lemon recipe and might bring the book back for someone else. Nobody has asked for the unidentified button in the bottom of the box.

You help count the objects onto the shift list. The task is boring in a restful way. Inez reads the descriptions back before signing. When you correct a number, she changes it without defending the first version. The trolley mistake has become something you can remember together without using it against her.

She asks whether you found time for another conversation tonight. You can answer without reporting private details. She is interested in whether you have company, not entitled to know what anyone entrusted to it.

For a moment you picture returning to this doorway on an ordinary evening, with no letter in your pocket and nothing urgent to prove. The thought feels different from wanting to solve the place. It would require knowing someone well enough to come back when you needed nothing.
`,
    [
      c(
        "share_outline",
        "Tell her you spent time with someone, keeping their confidences.",
        next("inez", 9),
        6,
        [
          mem(
            "inez",
            "confidence",
            "Shared the shape of another conversation without its private details",
          ),
          rel("inez", 2),
        ],
      ),
      c(
        "stay_objects",
        "Keep the conversation with the lost property.",
        next("inez", 9),
        5,
        [
          mem(
            "inez",
            "confidence",
            "Preferred to leave other conversations private",
          ),
          rel("inez", 1),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    10,
    "An old\nargument changes hands.",
    `
Celeste comes to collect the shift pad. She thanks Inez for covering, then says the thread should have stayed professional. Inez asks which sentence was unprofessional. Celeste says she has not read the whole exchange. Both women hear the weakness of that answer.

C: Then I should read it before commenting. I'll do that.

Inez nods. The concession does not erase whatever previous versions of this argument they have had. Celeste asks whether the spare keys are ready; Inez says Luca labelled them. For a few seconds they conduct business with conspicuous accuracy.

When Celeste begins to leave, Inez asks her to stop thanking people for flexibility in front of workers who are never allowed any. Celeste puts the pad down again. This conversation, apparently, will not fit inside the handover after all.

I: You mean it kindly. They still hear who is expected to move.

Celeste says she will think about it. Inez says she would prefer an answer tomorrow to one assembled now because a guest is present. You realise the guest is you, and that your attentive silence has become part of the pressure.

You can offer them privacy. You can say that reading the exchange first seems fair, without appointing yourself mediator. You cannot settle years of working together by choosing the sentence which sounds wisest from the bench. Both women have earned the right to continue being difficult to each other after you go.
`,
    [
      c(
        "give_privacy",
        "Step outside while they finish the exchange.",
        next("inez", 10),
        7,
        [
          moral("autonomy"),
          rel("inez", 2),
          {
            type: "npcRelationship",
            a: "inez",
            b: "celeste",
            axis: "trust",
            amount: 1,
          },
        ],
      ),
      c(
        "read_first",
        "Support reading the exchange first, then leave them to it.",
        next("inez", 10),
        7,
        [
          moral("honesty"),
          rel("inez", 1),
          mem(
            "inez",
            "mediation",
            "Supported checking before judging; did not take over",
          ),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    11,
    "Concern can\nbecome an instruction.",
    `
When Inez returns, she asks how you are getting home. The question is practical. Her second question, about whether you know the route, makes you feel younger than you are. You tell her you know where you live.

I: Yes. That came out badly.

She says she has spent the shift checking whether people have what they need before leaving. Sometimes the habit follows her into conversations where it has not been invited. She can care whether you arrive safely without conducting an inspection of your competence.

You ask whether she finds that easy. She says no. It is why she tries to stop after asking once. Tonight she did not stop. The admission is small and unadorned, which makes it easier to say that the second question bothered you without escalating it into a fight.

Outside, her sister's car slows and pulls away again to find a legal space. Inez waves to show she has seen it. She has somewhere else to be and someone who will ask how the extra shift went. You do not need to become another person she must escort all the way through the consequences of their evening.

She waits for your answer. You can accept the concern while refusing supervision, welcome a practical check-in, or ask to keep your route private. She has already made room for all three. The warmth of the conversation depends less on which you choose than on whether each of you can hear the other's limit.
`,
    [
      c(
        "care_not_guard",
        "“Concern is welcome. I can manage the route.”",
        next("inez", 11),
        6,
        [
          flag("inezLimit", "clear"),
          rel("inez", 2),
          mem("inez", "departure", "Welcomed concern and declined supervision"),
        ],
      ),
      c(
        "welcome_check",
        "Accept one practical check-in later.",
        next("inez", 11),
        6,
        [
          flag("inezCheck"),
          rel("inez", 1),
          mem("inez", "departure", "Invited one later check-in"),
        ],
      ),
      c(
        "private_route",
        "Keep your route and arrival time private.",
        next("inez", 11),
        5,
        [
          flag("inezLimit", "private"),
          rel("inez", 1),
          moral("autonomy"),
          mem("inez", "departure", "Asked to keep travel private"),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    12,
    "An apology\nthat leaves you standing.",
    `
Inez apologises for the extra question. She does not explain it a second time. You realise how often apologies become another task for the person receiving them: reassure me, interpret me kindly, say the harm was small. She leaves you free simply to accept this one.

Her sister appears at the door holding a shopping bag with the empty thermos space visible inside. The two women discuss whether the groceries were put in the right cupboard. Apparently there is a wrong cupboard with consequences neither wants to explain to you.

Inez introduces you by your chosen name and nothing else. You are not described as the witness, the person with the letter, or somebody who needs looking after. Her sister says hello and asks whether Inez has remembered the cup. The introduction remains pleasantly unfinished.

You hand over the cup if it is still on the ledge. The sister puts it into the bag with more care than its appearance seems to warrant. It may be a favourite. You do not need to know why.

I: There. A successful operation involving crockery. We should stop while we're ahead.

The joke has the tired shape of a family joke. You have been allowed near it without being invited to claim a place in the family. That is a form of intimacy too: understanding the edge of something and being comfortable enough not to cross it.
`,
    [
      c(
        "accept_inez",
        "Accept the apology and wish them both a good night.",
        next("inez", 12),
        6,
        [
          flag("inezRepair"),
          rel("inez", 2),
          mem(
            "inez",
            "apology",
            "Accepted the apology without demanding more explanation",
          ),
        ],
      ),
      c(
        "keep_inez_limit",
        "Thank her, keeping the limit you set in place.",
        next("inez", 12),
        6,
        [
          flag("inezRepair"),
          moral("autonomy"),
          mem(
            "inez",
            "apology",
            "Accepted the apology while keeping the limit explicit",
          ),
          rel("inez", 1),
        ],
      ),
    ],
  ),
  arc(
    "inez",
    13,
    "A number\nfor ordinary things.",
    `
Inez checks that you have the public desk number. If you want her personally, you can leave a message there and she will decide when to answer. She gives the arrangement without making it sound either exclusive or dismissive.

I: People ask for a private number when what they need is a way to be remembered. The desk will remember. Badly spelled, sometimes, but it will.

She tells you the recipe programme is on in the late afternoon. If the unknown cake ever receives an explanation, she will pass it along. It is the first future contact anyone has offered you tonight which contains no implied task.

Her sister calls from the car. Inez lifts the bag, checks for the cup once, and decides that is enough checking. The new worker at the door asks a question about the pad. She answers from where she stands rather than returning to take the job back.

You watch her leave a place where she is useful. It seems like a more difficult skill than arriving at one. The door continues to function after she has gone. So, you expect, will the arguments she left for tomorrow.

There is an empty chair beside the ledge. You no longer mistake it for a promise that someone should always be sitting there for you. You do know who occupied it tonight, what she listens to at home, and which small error she was willing to correct. That feels like enough to carry out into the street.
`,
    close("inez"),
    {
      onEnter: [
        later("inez-home", 22, [
          {
            type: "when",
            condition: { flag: "inezCheck" },
            then: [
              msg(
                "INEZ",
                "Home. One check-in, as agreed: I hope you found what you needed before leaving. No reply required.",
              ),
            ],
          },
          {
            type: "when",
            condition: { flag: "inezRadio", value: "voices" },
            then: [
              msg(
                "INEZ",
                "The recipe programme is Second Helpings. Afternoon repeats. The mysterious egg substitute remains unidentified.",
              ),
            ],
          },
        ]),
      ],
    },
  ),
];
