import type { Scene } from "../../engine/types";
import {
  p,
  say,
  flag,
  rel,
  mem,
  moral,
  pull,
  engage,
  item,
  dim,
  msg,
  c,
  s,
} from "./helpers";
export const endingsScenes: Scene[] = [
  s(
    "publish",
    "A file leaves\nyour hands.",
    "velvet",
    "THE STATIC / UPLOAD QUEUE",
    [
      p(
        "Luca finds a working charger in the office. The battery icon appears with ridiculous cheer. He photographs each page against the dark desk.",
      ),
      say("luca", "Last chance to take it back."),
      p(
        "He means the upload. You think of every smaller chance that led here. Then the progress bar finishes.",
      ),
      p(
        "The first response is a question about an amount. The second names a tenant. The third asks why someone’s address is different from the one in the file.",
      ),
      p("Mara stands in the door. She does not look at the phone."),
      say("mara", "I have calls to make."),
      p(
        "If you promised her protection, the betrayal is not abstract. It is an action you can trace to a sentence she believed.",
        { when: { flag: "promisedProtection" } },
      ),
      p(
        "Luca has stopped smiling at the upload. He starts writing a removal policy into a blank note. It is late to begin, but he begins.",
      ),
      p(
        "The board announces an emergency meeting before you reach the stairs. Something has moved. So have the consequences.",
      ),
    ],
    [
      c(
        "publish_done",
        "Leave Luca to the responses.",
        "mirror",
        4,
        [flag("publicationFinished")],
        { approach: "reckless" },
      ),
    ],
  ),
  s(
    "bargain",
    "A place\nat someone’s table.",
    "upstairs",
    "CELESTE / THE SECOND AGREEMENT",
    [
      p(
        "Celeste reads the terms you propose. She asks for one change: access to current board records, not personnel files. You agree on a date. She writes it herself.",
      ),
      say(
        "celeste",
        "Keep your copy of the invitation record. It would be unreasonable for me to ask otherwise.",
      ),
      p(
        "You are relieved, then annoyed that something so basic produces relief.",
      ),
      p(
        "The original ledger goes into a lockbox. A second upstairs pass goes into your pocket. One object is much lighter than the other.",
      ),
      say(
        "celeste",
        "This will be described as cooperation. I cannot promise you control of the description.",
      ),
      p("You ask if she will correct it when people call it approval."),
      say("celeste", "Yes. I expect that will matter less than it should."),
      p(
        "At the bottom of the stairs, Mara notices the pass. She does not need to know the precise terms to know which institution is holding the paper.",
      ),
    ],
    [
      c(
        "bargain_done",
        "Keep the agreement. Leave the building.",
        "mirror",
        4,
        [flag("bargainFinished")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "withhold",
    "Possession\nis its own obligation.",
    "street",
    "THE SIDE ENTRANCE",
    [
      p(
        "The ledger fits in your tote. It looks like an old exercise book someone has forgotten to return. Nobody stops you putting it there.",
      ),
      p(
        "Luca asks whether you will answer his calls. Celeste asks whether the document will be stored securely. Mara asks whether you have a dry bag. The questions tell you what each person thinks you have taken.",
      ),
      p(
        "You say you will decide when you have slept. This is reasonable. It is also a way of ensuring the decision belongs to you alone.",
      ),
      p(
        "Outside, your phone begins receiving requests for a document that several people have already started describing as theirs.",
      ),
      p(
        "You turn the screen off. For a few seconds the rain is the only thing asking anything of you.",
      ),
      p("Then you remember paper can get wet and put the bag under your coat."),
    ],
    [
      c(
        "withhold_done",
        "Take the long way home.",
        "mirror",
        6,
        [flag("withholdingFinished")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "mirror",
    "For your\nown protection.",
    "street",
    "ANOTHER MESSAGE",
    [
      p(
        "Inez has forwarded a message dated yesterday. Someone contacted her asking whether the witness still lived at your apartment. She chose not to pass it on.",
      ),
      p(
        "Her explanation arrives in a second line: “I thought you would be better off not answering.”",
      ),
      p(
        "Earlier you kept another person’s information private. Now someone has decided what information you should be allowed to have.",
        { when: { flag: "protectedStranger" } },
      ),
      p(
        "Earlier you passed on a stranger’s name because the concern seemed public. Inez has made the opposite decision about you.",
        { when: { flag: "exposedStranger" } },
      ),
      p(
        "You asked the sender to give you a choice before acting. This is another person who thought they could spare you that choice.",
        { when: { flag: "senderBoundary" } },
      ),
      p(
        "The withheld message contains no revelation about the sender; you already have that answer. It contains something smaller and harder to resolve: one more person deciding on your behalf.",
      ),
      p(
        "Inez does not defend herself in advance. You can answer without proving a theory about yourself.",
      ),
    ],
    [
      c(
        "mirror_ask",
        "“Please ask me next time.”",
        "walk",
        4,
        [
          mem(
            "inez",
            "mirror",
            "Asked to receive information before decisions are made",
          ),
          moral("autonomy"),
          rel("inez", 1),
          pull("candour"),
        ],
        { approach: "honest" },
      ),
      c(
        "mirror_accept",
        "“I understand why. Send the rest now.”",
        "walk",
        4,
        [
          mem(
            "inez",
            "mirror",
            "Accepted intention but requested remaining information",
          ),
          moral("compassion"),
          rel("inez", 2),
        ],
        { approach: "curious" },
      ),
      c(
        "mirror_angry",
        "“You don’t get to decide what I can handle.”",
        "walk",
        3,
        [
          mem("inez", "mirror", "Angry about the withheld message"),
          dim("nerve", 6),
          pull("defiance"),
        ],
        { approach: "reckless" },
      ),
      c(
        "mirror_silence",
        "Put the phone away. Answer tomorrow.",
        "walk",
        3,
        [moral("selfPreservation"), pull("privacy")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "walk",
    "The way home\nis still the way home.",
    "street",
    "VELVET QUARTER / AFTER THE RAIN",
    [
      p(
        "The rain has stopped being dramatic. Water runs along the kerb carrying a torn flyer, a leaf, and the small white stick from someone’s takeaway.",
      ),
      p(
        "Your phone lights up. Mara has sent a message that begins “unrelated.”",
      ),
      p(
        "“tea no sugar, right? you left before it cooled. don’t buy the stuff from the machine by your building. it’s awful.”",
        { when: { flag: "drink", value: "tea" } },
      ),
      p(
        "“i found actual coffee after you left. naturally. yours was mostly an apology in a cup.”",
        { when: { flag: "drink", value: "coffee" } },
      ),
      p(
        "“forgot to say thanks for asking about the shift. fourteen hours, if you wanted the depressing answer.”",
        { when: { flag: "drink", value: "water" } },
      ),
      p("Then: “fan’s still running.”", { when: { flag: "fixedFan" } }),
      p(
        "The message does not settle what happened with the ledger. She has remembered an ordinary thing about you at the same time as whatever else she feels. People seem inconveniently capable of that.",
      ),
      p(
        "A bus passes on the opposite side of the street. You wonder whether Ruth is home yet. The city has more journeys in progress than the one you can see.",
      ),
    ],
    [
      c(
        "home",
        "Go home. Put the kettle on.",
        "apartment",
        10,
        [dim("composure", 15), dim("heat", -10)],
        { approach: "guarded" },
      ),
      c(
        "reply_mara",
        "Reply: “Glad it’s still running. Get some sleep.”",
        "apartment",
        11,
        [
          rel("mara", 1),
          engage("care.checkIn"),
          mem(
            "mara",
            "aftercare",
            "Asked me to get some sleep after the shift",
          ),
          dim("composure", 15),
          dim("heat", -10),
        ],
        { approach: "honest" },
      ),
    ],
  ),
  s(
    "apartment",
    "Your own\nside of the door.",
    "apartment",
    "HOME / THE APARTMENT",
    [
      p(
        "The key sticks in exactly the same way it always does. You lift the handle, turn, and step into the apartment. Nothing here knows what sort of night you have had.",
      ),
      p(
        "A mug in the sink. A shirt drying over the chair. The faint refrigerator click you keep meaning to record for the landlord. The room is small enough that arriving home and crossing it are almost the same action.",
      ),
      p(
        "You empty your pockets onto the table. The invitation, the evidence, something from Velvet that you did not have when you left. Objects look different under a kitchen light.",
      ),
      p(
        "Your old delivery signature was copied from this building. Tomorrow you can ask the property manager how. Tonight you lock the door and check the latch because it is a thing you can finish.",
      ),
      p(
        "A flat envelope lies underneath the pile of takeaway menus by the door. On the outside: FOR THE PERSON WHO ACTUALLY LIVES HERE. Inside is a room key and a bus timetable.",
      ),
      p(
        "The key tag reads MOTEL 27. Room 06. Inez has written her number beneath it.",
      ),
      p(
        "Before you decide what that means, you have a moment to decide what tonight meant to you.",
      ),
    ],
    [
      c(
        "reflect",
        "Sit down with what happened.",
        "reflection",
        4,
        [
          item("key27"),
          msg(
            "Inez",
            "The key is an offer, not an appointment. You can call before you come.",
          ),
        ],
        { approach: "neutral" },
      ),
    ],
  ),
  s(
    "reflection",
    "What stays\nwith you?",
    "apartment",
    "A PRIVATE REFLECTION",
    [
      p(
        "For the first time all night, nobody is waiting for the useful version of your answer.",
      ),
      p(
        "There was the invitation. The lie in the paperwork. A cup at the bar. The place you went and the place you missed. A person who used your name with permission and others who treated a signature as a standing invitation.",
      ),
      p(
        "Some part of you wants to return. Some part is already rehearsing what you should have done differently. Neither has to win before morning.",
      ),
      p(
        "This answer belongs to the character you are playing. It adjusts which ordinary details the narration notices later. It is stored only on this device, and you can clear or disable that adaptation in Settings.",
      ),
      p(
        "You can also decline to turn the night into a preference. Uncertainty is an answer.",
      ),
    ],
    [
      c(
        "reflect_connection",
        "The person who remembered something small.",
        "dawn",
        5,
        [
          pull("connection", 2),
          flag("reflection", "connection"),
          engage("attention.private"),
        ],
        { theme: "romance", approach: "honest" },
      ),
      c(
        "reflect_truth",
        "The moment the evidence finally made sense.",
        "dawn",
        5,
        [pull("curiosity", 2), flag("reflection", "truth")],
        { approach: "curious" },
      ),
      c(
        "reflect_control",
        "I want to choose my involvement next time.",
        "dawn",
        5,
        [pull("privacy", 2), pull("defiance"), flag("reflection", "autonomy")],
        { approach: "guarded" },
      ),
      c(
        "reflect_unknown",
        "I don’t know yet.",
        "dawn",
        5,
        [
          flag("reflection", "uncertain"),
          engage("attention.private", "uncertain"),
        ],
        { approach: "neutral" },
      ),
      c(
        "reflect_never",
        "I don’t want personal attention like that again.",
        "dawn",
        5,
        [
          pull("connection", -5),
          flag("reflection", "distance"),
          engage("attention.private", "avoid"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "dawn",
    "The morning\nhas other plans.",
    "apartment",
    "FIRST LIGHT / CONSEQUENCES",
    [
      p(
        "Dawn finds the apartment before you have slept. The window turns from black to an unhelpful grey. Somewhere in the building, a shower starts.",
      ),
      p(
        "The redacted accounts have reached the Static. The board has seven days to respond, and seven days to prepare. Mara is calling people one at a time for permission to corroborate.",
        { when: { flag: "ending", value: "protect" } },
      ),
      p(
        "The complete ledger is public. An emergency board meeting is scheduled. Two tenants have asked to have their names removed from copies that can no longer be recalled.",
        { when: { flag: "ending", value: "public" } },
      ),
      p(
        "Celeste has sent the date of your first records appointment. The board announcement calls you a cooperating witness. Your objection to that wording has been attached as a note.",
        { when: { flag: "ending", value: "power" } },
      ),
      p(
        "The original ledger is under your table, wrapped in a dry bag. The board proceeds with its own copy. Luca has begun looking for another source. Custody has given you responsibility without stopping the city.",
        { when: { flag: "ending", value: "ghost" } },
      ),
      p(
        "You know who sent the invitation: {sender}. What remains uncertain is whether they have understood why the method mattered.",
      ),
      p(
        "The key to Motel 27 lies on the bus timetable. It does not expire today. For once, you are being offered time.",
      ),
    ],
    [
      c(
        "motel_hook",
        "Call Inez about Motel 27.",
        "motel",
        2,
        [pull("curiosity")],
        { approach: "curious" },
      ),
      c(
        "end_protected",
        "Put the key away. End the night.",
        "end_protect",
        0,
        [],
        { when: { flag: "ending", value: "protect" }, approach: "honest" },
      ),
      c(
        "end_published",
        "Put the key away. End the night.",
        "end_public",
        0,
        [],
        { when: { flag: "ending", value: "public" }, approach: "reckless" },
      ),
      c(
        "end_bargained",
        "Put the key away. End the night.",
        "end_power",
        0,
        [],
        { when: { flag: "ending", value: "power" }, approach: "neutral" },
      ),
      c(
        "end_withheld",
        "Put the key away. End the night.",
        "end_ghost",
        0,
        [],
        { when: { flag: "ending", value: "ghost" }, approach: "guarded" },
      ),
    ],
  ),
  s(
    "motel",
    "A room\nfor the next question.",
    "motel",
    "MOTEL 27 / ROOM 06",
    [
      p(
        "Inez answers on the fourth ring. You hear the indicator of a bus and a plastic bag being moved from one seat to another.",
      ),
      say("inez", "I’m not there. If that’s what you’re asking."),
      p("You ask where “there” is."),
      say(
        "inez",
        "Motel 27 is a forwarding address. People use it when they leave the Quarter. Sometimes there is a room. You call first.",
        { reveals: ["motel"] },
      ),
      p(
        "You turn the key over. On the back is a strip of paper bearing the reference from your old delivery signature.",
      ),
      say(
        "inez",
        "The previous tenant left something. They asked me to make sure it reached whoever had to deal with the mistake.",
      ),
      p(
        "You tell her that sounds like another invitation without an explanation.",
      ),
      say("inez", "Yes. You’re right. I’ll send an inventory first."),
      p(
        "A minute later: “One cassette. Two receipts. A photograph of your building before the flood. No appointment required.”",
      ),
      p(
        "The photograph arrives last. The building is familiar. Beside it is a lit doorway where your window is now. On the glass, barely visible: ROOM 06.",
      ),
      p("That is a question for a night when you have slept."),
    ],
    [
      c(
        "motel_protect",
        "Keep the inventory. Close the phone.",
        "end_protect",
        0,
        [flag("motelCalled")],
        { when: { flag: "ending", value: "protect" }, approach: "honest" },
      ),
      c(
        "motel_public",
        "Keep the inventory. Close the phone.",
        "end_public",
        0,
        [flag("motelCalled")],
        { when: { flag: "ending", value: "public" }, approach: "reckless" },
      ),
      c(
        "motel_power",
        "Keep the inventory. Close the phone.",
        "end_power",
        0,
        [flag("motelCalled")],
        { when: { flag: "ending", value: "power" }, approach: "curious" },
      ),
      c(
        "motel_ghost",
        "Keep the inventory. Close the phone.",
        "end_ghost",
        0,
        [flag("motelCalled")],
        { when: { flag: "ending", value: "ghost" }, approach: "guarded" },
      ),
    ],
  ),
  s(
    "end_protect",
    "Some names\nstay unwritten.",
    "apartment",
    "ENDING 01 / THE CAREFUL COPY",
    [
      p(
        "You preserved the accounts and protected the names. The people who can corroborate the ledger now get to decide whether they will. That is slower than a leak. The board is making use of every hour.",
      ),
      p(
        "Mara sends a list of times when she is free to talk. Luca sends a list of gaps in the evidence. Neither is a thank-you note. Both assume you are still involved.",
      ),
      p(
        "The original invitation sits beneath your redacted copy. You arrived as someone else’s unasked-for witness. You leave having made the next invitation conditional on an answer.",
      ),
      p(
        "Elsewhere, a meeting you will never see begins with a person asking whether their name has to be written down. This time, the answer is no.",
      ),
    ],
    [],
    { ending: true },
  ),
  s(
    "end_public",
    "The truth\nhas an audience.",
    "apartment",
    "ENDING 02 / OPEN CIRCUIT",
    [
      p(
        "You made the original public. The board cannot quietly describe the transfer as routine. The fund is under scrutiny, and its members are answering questions they avoided for years.",
      ),
      p(
        "People named in the ledger are answering questions too. Mara stops responding after her first message. Luca’s broadcast begins with a correction and a request not to contact the tenants.",
      ),
      p(
        "You have changed the night for people who were not there. Some needed the change. Some did not consent to your version of it.",
      ),
      p(
        "Your alias appears in the credits of the archive. Beneath it, a stranger has added a comment: “Who is this person?”",
      ),
    ],
    [],
    { ending: true },
  ),
  s(
    "end_power",
    "Your name\nis on the list.",
    "upstairs",
    "ENDING 03 / TERMS ACCEPTED",
    [
      p(
        "You traded custody for access. The agreement is real. So is the board’s use of it: an independent witness has entered a constructive relationship with the institution.",
      ),
      p(
        "Celeste corrects “approval” to “cooperation” in the announcement. The correction occupies a small line beneath a large headline.",
      ),
      p(
        "Your pass opens a door that remained closed to Mara and Luca. Behind it are records they have wanted for years. You may yet do something useful with the compromise.",
      ),
      p(
        "When you look again at the invitation, its paper no longer seems cheap. It seems like the first document in a file that is going to get thicker.",
      ),
    ],
    [],
    { ending: true },
  ),
  s(
    "end_ghost",
    "You keep\nthe original.",
    "apartment",
    "ENDING 04 / PRIVATE PROPERTY",
    [
      p(
        "You kept the paper and declined the available alliances. Nobody gets to call your silence consent without an objection from you. Nobody has the original evidence to use against that claim either.",
      ),
      p(
        "The board continues. Luca investigates another route. Mara returns to the shift with the repaired fan, or the broken one, depending on what you made time for.",
      ),
      p(
        "The ledger under your table has not become harmless by becoming private. You still have to decide where it belongs. Sleep is a postponement you have chosen with open eyes.",
      ),
      p(
        "Your phone is quiet. In the next apartment, someone picks up a delivery at the door. You hear the driver ask for a signature.",
      ),
    ],
    [],
    { ending: true },
  ),
];
