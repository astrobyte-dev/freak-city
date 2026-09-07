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
  know,
  c,
  unseen,
  s,
} from "./helpers";
export const encountersScenes: Scene[] = [
  s(
    "mara",
    "The names\nare the problem.",
    "velvet",
    "MARA / END OF THE BAR",
    [
      say(
        "mara",
        "Don’t put your phone down there. It’s wet underneath the mat.",
      ),
      p(
        "You keep hold of it while she reads the invitation. She does not ask to touch the screen. For a moment she seems about to say something she has already rehearsed. Then an order comes in and she writes it on her wrist instead.",
      ),
      say(
        "mara",
        "There’s a ledger going upstairs tonight. Tenant relief fund. Dates, amounts. Names.",
        { reveals: ["tenantRisk"] },
      ),
      p("She puts a plate over a chipped mug and carries on speaking."),
      say(
        "mara",
        "People got help after the flood. Some didn’t use the names they use now. I don’t want those names traded with the debt.",
      ),
      p("You ask who would do that."),
      say(
        "mara",
        "Someone who thinks a file is less messy than a person. Look, I used to keep the file. I’m not pretending I was better.",
      ),
      p(
        "She has asked you for nothing yet. It makes the next silence heavier.",
      ),
    ],
    [
      c(
        "protect_mara",
        "“I’ll keep their names out of it.”",
        "kitchen",
        3,
        [
          flag("promisedProtection"),
          rel("mara", 3),
          mem("mara", "promise", "Promised to protect tenant names"),
          moral("protection"),
          pull("candour"),
        ],
        { approach: "honest" },
      ),
      c(
        "no_promise",
        "“I need to see it before I promise.”",
        "kitchen",
        3,
        [rel("mara", 1), moral("autonomy"), pull("curiosity")],
        { approach: "curious" },
      ),
      c(
        "trade_mara",
        "“What do I get for helping?”",
        "floor",
        2,
        [rel("mara", -2), moral("opportunism"), flag("pricedMara")],
        { approach: "reckless" },
      ),
    ],
  ),
  s(
    "kitchen",
    "Salt. No revelation.",
    "velvet",
    "STAFF KITCHEN / 00:00 ISH",
    [
      p(
        "Mara takes you through a door marked DRY STORE. The room behind it is neither dry nor a store. A fan stands dismantled on a table, its screws laid out on a takeaway lid.",
      ),
      say("mara", "There were eight. I’ve got seven. Don’t step back."),
      p(
        "You find the eighth under your shoe. She takes it with an expression of disproportionate relief.",
      ),
      say(
        "mara",
        "Thank you. Honestly. I was going to have to move the fridge.",
      ),
      p(
        "A carton of chips sits beside the sink. They have gone soft in their paper. She nudges them toward the space between you.",
      ),
      say("mara", "Staff dinner. Prestigious."),
      p(
        "For a little while the only decisions are whether to use the salt and which of you should hold the casing steady. Mara tells you about a neighbour who keeps leaving an entire exercise bike in the stairwell. You cannot work out how the bike gets used.",
      ),
      say("mara", "Neither can I. That’s what bothers me."),
      p(
        "The fan starts. Both of you stop talking to hear whether it will stay started.",
      ),
    ],
    [
      c(
        "chips",
        "Share the chips. Hold the casing steady.",
        "quiet",
        3,
        [
          mem("mara", "chips", "Shared cold chips and repaired the fan"),
          rel("mara", 2),
          flag("fixedFan"),
          moral("compassion"),
        ],
        { approach: "honest" },
      ),
      c(
        "thanks",
        "Thank her and give her a quiet minute.",
        "floor",
        2,
        [rel("mara", 1), pull("privacy"), dim("composure", 8)],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "quiet",
    "A seat left open.",
    "velvet",
    "STAFF KITCHEN / MARA",
    [
      p(
        "Mara sits down for what looks like the first time in hours. She moves the broken casing from the other chair without looking at you.",
      ),
      say("mara", "You can sit. If you want."),
      p(
        "You sit close enough to hear her over the noise from the hall. She asks whether she can use your alias, even though she already heard it at the door.",
        {
          theme: "romance",
          implied:
            "She asks permission to use your alias and makes room for you.",
          safe: "She asks which name you want used when she introduces you to the staff.",
        },
      ),
      say("mara", "{alias}. Okay. I’ll remember."),
      p(
        "The radio above the fridge starts an advert for a sofa sale. Mara reaches to turn it off, misses the switch, and has to stand up again.",
      ),
      say("mara", "Ruined my dramatic moment. I don’t have many."),
      p(
        "She smiles before you do. The kitchen door opens. Someone needs the ice bucket. Whatever the moment was, it becomes a little less private.",
      ),
      p("You do not owe it a name."),
    ],
    [
      c(
        "stay_close",
        "“Save me this chair later.”",
        "floor",
        3,
        [
          rel("mara", 2, "affinity"),
          engage("attention.private"),
          mem("mara", "chair", "Asked to sit together again"),
          pull("connection", 2),
          dim("heat", 12),
          { type: "attractor", key: "practical-warmth", amount: 1 },
        ],
        { theme: "romance", approach: "honest" },
      ),
      c(
        "friends",
        "“I’m glad I met someone normal.”",
        "floor",
        2,
        [rel("mara", 2), dim("composure", 10), pull("candour")],
        { approach: "guarded" },
      ),
      c(
        "leave_quiet",
        "Leave the chair open. Go back to the room.",
        "floor",
        1,
        [dim("composure", 6), pull("privacy")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "celeste",
    "Terms of entry.",
    "velvet",
    "AT THE STAIRS / CELESTE",
    [
      p(
        "The woman at the stairs finishes reading before acknowledging you. There is no attempt to make the delay seem accidental.",
      ),
      say(
        "celeste",
        "Celeste Ardent. I own the building. On nights like this, people make the distinction between that and owning the business.",
      ),
      p("She looks at your invitation. Then at a small list in her folder."),
      say(
        "celeste",
        "You are listed as an independent witness. That should have been explained before you arrived.",
      ),
      p("You tell her that it was not."),
      say(
        "celeste",
        "Then someone has made a procedural error. You are not obliged to repair it for them.",
      ),
      p(
        "She closes the folder. You notice her thumb holding one page separate from the others.",
      ),
      say(
        "celeste",
        "I can give you access upstairs. What happens there will be recorded as a transfer witnessed by those present. You may object on the record. You may also decline.",
      ),
      p(
        "From across the room, Mara watches the folder close. Celeste notices where you looked.",
      ),
      say(
        "celeste",
        "You can ask her opinion. It will be different from mine.",
      ),
    ],
    [
      c(
        "read_terms",
        "“Show me what I’m agreeing to.”",
        "terms",
        4,
        [
          engage("authority.negotiated"),
          rel("celeste", 2),
          pull("ritual"),
          moral("autonomy"),
        ],
        { approach: "curious" },
      ),
      c(
        "take_pass",
        "Take the pass. Decide upstairs.",
        "floor",
        2,
        [
          item("pass"),
          flag("acceptedWitness"),
          engage("authority.negotiated"),
          rel("celeste", 1),
          moral("ambition"),
          dim("heat", 8),
        ],
        { approach: "reckless" },
      ),
      c(
        "decline_status",
        "“I didn’t agree to be your witness.”",
        "floor",
        2,
        [
          flag("refusedWitness"),
          engage("ritual.optOut"),
          rel("celeste", 1),
          pull("defiance"),
          moral("autonomy"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "terms",
    "The small print\nis still a choice.",
    "upstairs",
    "A FOLDER, OPEN",
    [
      p(
        "Celeste lays out the form on the stair ledge. It is an ordinary sheet with a crease down the centre. At the bottom is a reproduction of your signature.",
      ),
      p(
        "You know exactly where you wrote it. Your apartment lobby. A delivery driver. An envelope for someone upstairs who was not home.",
      ),
      p(
        "The form calls that signature an authorization to witness future transfers. A handwritten reference points to a clause on a page that is missing.",
        { reveals: ["signature"] },
      ),
      say("celeste", "That is insufficient. I will note your objection."),
      p(
        "She says it quickly enough that you suspect she is relieved to have a defect she can name.",
      ),
      p("You ask whether insufficient means the transfer stops."),
      say(
        "celeste",
        "It means there is an objection. Those are unfortunately different things.",
      ),
      p(
        "She offers you a pen. The space for your legal name is blank. So is the line for your signature. Tonight, at least, you get to decide whether to fill it.",
      ),
    ],
    [
      c(
        "annotate",
        "Write: “Presence is not consent.” Use the alias.",
        "floor",
        2,
        [
          item("pass"),
          flag("objectedTerms"),
          engage("authority.negotiated"),
          mem("celeste", "terms", "Annotated presence is not consent"),
          rel("celeste", 2),
          moral("honesty"),
          pull("defiance"),
        ],
        { approach: "honest" },
      ),
      c(
        "sign_alias",
        "Sign the alias and keep the pass.",
        "floor",
        2,
        [
          item("pass"),
          flag("acceptedWitness"),
          moral("ambition"),
          rel("celeste", 2),
        ],
        { approach: "reckless" },
      ),
      c(
        "refuse_pen",
        "Put the pen down.",
        "floor",
        1,
        [flag("refusedWitness"), pull("privacy"), moral("autonomy")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "luca",
    "No signal.\nPlenty to say.",
    "velvet",
    "BY THE SPEAKERS / LUCA",
    [
      say("luca", "This socket’s fake. Has to be. Decorative electricity."),
      p(
        "The man crouched by the wall wiggles his charger. You point out the switch. He considers it for a second.",
      ),
      say("luca", "Right. We’re not telling anyone that happened."),
      p(
        "He stands, brushes something from his knees, then offers the hand he just used for brushing. Changes his mind. Waves instead.",
      ),
      say(
        "luca",
        "Luca. I run a little radio thing. Archive, mostly. The music’s there so people don’t notice the archive.",
      ),
      p("He sees the wristband."),
      say(
        "luca",
        "Oh. You’re the outside witness. Listen, someone’s leaving from the loading bay at twenty-six past. They saw a box move that wasn’t supposed to move. We need someone the board can’t call an employee.",
      ),
      p("A bass change swallows his next sentence. He repeats it too loudly."),
      say(
        "luca",
        "DO YOU LIKE— sorry. Do you like this track? It’s my ex-housemate’s. He owes me a microwave.",
      ),
    ],
    [
      c(
        "listen_luca",
        "“Tell me about the box.”",
        "radio",
        3,
        [rel("luca", 2), item("matchbook"), pull("curiosity")],
        { approach: "curious" },
      ),
      c(
        "sympathy",
        "“I understand what you’re trying to do.”",
        "radio",
        3,
        [
          flag("lucaMisunderstood"),
          {
            type: "belief",
            npc: "luca",
            key: "publication",
            value: "The player agreed to help publish.",
            source: "Misinterpreted sympathetic wording",
          },
          rel("luca", 2),
          moral("compassion"),
        ],
        {
          hint: "He may hear more agreement than you mean.",
          approach: "honest",
        },
      ),
      c(
        "no_radio",
        "“I’m not a source.”",
        "floor",
        2,
        [
          mem("luca", "boundary", "Declined to become a source"),
          rel("luca", 1),
          pull("privacy"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "radio",
    "Everybody’s archive.\nSomebody’s name.",
    "velvet",
    "LUCA / THE DEAD PHONE",
    [
      p("Luca turns his phone over, apparently forgetting it is still dead."),
      say(
        "luca",
        "I’ve got statements. Rent records. A recording of the board pretending they didn’t know the names were in there. What I haven’t got is the original.",
        { reveals: ["tenantRisk"] },
      ),
      p(
        "You ask whether publishing the original means publishing those names.",
      ),
      say("luca", "We blur them."),
      p("You wait."),
      say(
        "luca",
        "Okay, people can sometimes work it out from dates. I know. We’re figuring it out.",
      ),
      p("He looks past you toward the bar. Mara has her back to him."),
      say(
        "luca",
        "She thinks I’m turning people into a story. I think somebody already did that and charged interest.",
      ),
      p(
        "A second passes. He rubs a thumb over the cracked corner of the phone.",
      ),
      say(
        "luca",
        "That sounded rehearsed. It was. I’ve had this argument a lot. I don’t know if that makes me right.",
      ),
    ],
    [
      c(
        "correct_luca",
        "“Understanding isn’t permission. Ask the people named.”",
        "floor",
        2,
        [
          flag("correctedLuca"),
          {
            type: "belief",
            npc: "luca",
            key: "publication",
            value: "The player requires consent before publication.",
            source: "Player explicitly corrected me",
          },
          rel("luca", 1),
          moral("autonomy"),
          pull("candour"),
        ],
        { approach: "honest" },
      ),
      c(
        "promise_publish",
        "“Get me evidence. I’ll get it out.”",
        "floor",
        2,
        [
          flag("promisedLuca"),
          rel("luca", 3),
          moral("ambition"),
          pull("defiance"),
        ],
        { approach: "reckless" },
      ),
      c(
        "reserve",
        "“I’ll hear the witness first.”",
        "floor",
        2,
        [rel("luca", 1), pull("curiosity")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "inez",
    "Paper remembers\nthe wrong things.",
    "velvet",
    "SERVICE CORRIDOR / INEZ",
    [
      p(
        "Inez is replacing a bulb in a wall light. There is no ladder. She uses a small stool with a sticker warning against standing on it.",
      ),
      say("inez", "Hold that. Please."),
      p(
        "She hands you the old bulb, climbs down, and puts a tick in a notebook. Beside the light is a covered printer with its cable wound around the handle.",
      ),
      say(
        "inez",
        "Disconnected it at twenty-two nineteen. It printed before that. Your time is the delivery slot.",
        { reveals: ["header"] },
      ),
      p(
        "You ask why someone would schedule an invitation through an obsolete printer.",
      ),
      say("inez", "Same reason people use an old key. It still fits."),
      p("She hears herself and looks irritated."),
      say(
        "inez",
        "That wasn’t meant to sound grand. The replacement system charges per message.",
      ),
      p(
        "She asks whether you signed for an envelope at your building. When you say yes, she closes the notebook.",
      ),
      say(
        "inez",
        "Someone used that signature as authorization. They shouldn’t have.",
        { reveals: ["signature"] },
      ),
    ],
    [
      c(
        "help_inez",
        "“What can I do about it?”",
        "register",
        3,
        [rel("inez", 2), moral("autonomy"), pull("candour")],
        { approach: "honest" },
      ),
      c(
        "accuse_inez",
        "“You know more than you’re saying.”",
        "register",
        3,
        [rel("inez", -1), dim("nerve", 5), pull("defiance")],
        { approach: "reckless" },
      ),
      c(
        "leave_inez",
        "Give back the bulb. Leave her to her shift.",
        "floor",
        1,
        [rel("inez", 1), pull("privacy")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "register",
    "The price of\nan ordinary favour.",
    "velvet",
    "INEZ / THE LOST PROPERTY SHELF",
    [
      p(
        "Inez takes a paper bag from the shelf. The repaired corner has already split again.",
      ),
      say("inez", "Hold this while I get a better one."),
      p(
        "Inside are a sandwich, an umbrella handle without an umbrella, and a little blue register. A page has slipped loose. Your apartment number is at the top.",
      ),
      p("Inez sees you see it. She does not take the bag away."),
      say("inez", "There is a name on that page. It is not yours."),
      p("You ask whether it belongs to the person who invited you."),
      say(
        "inez",
        "It belongs to someone who used to live where you live. Those can be different people.",
      ),
      p(
        "She brings back a stronger bag. You have had enough time to photograph the page. You have also had enough time to decide not to.",
      ),
      say(
        "inez",
        "The person leaving tonight can help with the dates. Loading bay. Please don’t make them miss the bus.",
      ),
    ],
    [
      c(
        "return_bag",
        "Hand over the bag without looking further.",
        "floor",
        2,
        [
          flag("respectedRegister"),
          rel("inez", 3),
          mem("inez", "register", "Returned the open register unread"),
          moral("protection"),
          pull("privacy"),
        ],
        { approach: "honest" },
      ),
      c(
        "photo_page",
        "Photograph the page while she changes bags.",
        "floor",
        2,
        [
          flag("copiedPage"),
          rel("inez", -2),
          moral("opportunism"),
          pull("curiosity", 2),
          know("signature", "Apartment reference in the register"),
        ],
        { approach: "reckless" },
      ),
      c(
        "ask_copy",
        "Ask for a copy with the name covered.",
        "floor",
        3,
        [
          flag("respectedRegister"),
          rel("inez", 2),
          moral("autonomy"),
          know("signature", "Inez’s redacted register copy"),
        ],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "washroom",
    "Out of order.\nMostly.",
    "velvet",
    "THE WORKING TOILETS",
    [
      p(
        "The hand dryer sounds like a small aircraft losing an argument. A man in a dinner jacket is drying one sock beneath it. You both silently agree not to discuss why.",
      ),
      p(
        "Someone has written YOU LOOK FINE on the mirror in the kind of pen that requires commitment. Beneath it: CALL YOUR SISTER. Beneath that: NOT YOURS, DAVE.",
      ),
      p(
        "You wash your hands. The tap runs cold, then hot, then seems to remember its job.",
      ),
      p(
        "From a stall, two voices argue about an envelope. One says it belongs to the tenants. The other says the tenants are not a legal entity. You recognise neither voice.",
      ),
      p(
        "A name is mentioned. You catch enough to understand that someone’s membership has been paid from the same account as the relief fund.",
      ),
      p(
        "The man under the dryer looks at you in the mirror. He has heard it too. Then the dryer stops, and the silence tells both of you how quiet you should have been.",
      ),
    ],
    [
      c(
        "hear_more",
        "Stay long enough to hear the rest.",
        "overhear",
        4,
        [pull("curiosity"), dim("composure", -7)],
        { approach: "curious" },
      ),
      c(
        "leave_toilet",
        "Let a private conversation stay private.",
        "floor",
        1,
        [moral("protection"), pull("privacy"), dim("composure", 6)],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "overhear",
    "A story you\ndon’t own.",
    "velvet",
    "OUTSIDE THE WASHROOM",
    [
      p(
        "A woman leaves the stall and sees you before she sees the door. She is carrying a cracked compact mirror and a hospital parking ticket.",
      ),
      p(
        "“Please don’t repeat the name. My dad doesn’t know I asked the fund.”",
      ),
      p(
        "She is neither the villain nor the informant your night seems to be looking for. Just someone whose private arithmetic has become audible.",
      ),
      p(
        "The second woman comes out behind her. “It was a membership credit. The accountants use one category for everything. I said that.”",
      ),
      p(
        "You do not have enough information to know whether that is true. You have enough to make a convincing accusation. The difference is uncomfortable.",
      ),
      p(
        "The first woman folds the parking ticket until the paper gives way at the centre. She leaves it in the bin and goes back to the dance floor.",
      ),
    ],
    [
      c(
        "keep_secret",
        "Keep her name out of tonight.",
        "floor",
        2,
        [flag("protectedStranger"), moral("protection", 2), pull("privacy")],
        { approach: "honest" },
      ),
      c(
        "spread",
        "Send the allegation to the venue group.",
        "floor",
        2,
        [
          flag("exposedStranger"),
          moral("opportunism", 2),
          {
            type: "rumour",
            id: "fund-name",
            text: "A guest says relief money paid for a private membership. The account is unverified.",
            faction: "static",
          },
          msg(
            "VENUE GROUP",
            "Your post has been forwarded. The named guest has left the group.",
          ),
        ],
        { hint: "A rumour can outlive its correction.", approach: "reckless" },
      ),
      c(
        "anonymize",
        "Report the accounting concern without a name.",
        "floor",
        3,
        [
          flag("protectedStranger"),
          moral("honesty"),
          moral("protection"),
          msg(
            "VENUE GROUP",
            "The treasurer has been asked to explain the shared accounting category.",
          ),
        ],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "street",
    "The city\nwithout you.",
    "street",
    "VELVET QUARTER / SERVICE ROAD",
    [
      p(
        "Behind Velvet, the rain comes down without flattering light. A delivery driver is eating in the cab of a stationary van. The loading-bay shutter is open to knee height.",
      ),
      p(
        "You hear a trolley rolling over the concrete inside. A box emerges before the person pushing it. Then both disappear into a side passage.",
      ),
      p(
        "There are ordinary explanations for ordinary objects. You take a photograph anyway. The corner of the frame catches a clock above the shutter.",
      ),
      p(
        "Across the road, a kiosk is still serving food. The board offers three things and has crossed out two. A night bus idles further down the street.",
      ),
      p(
        "Your phone vibrates. An unknown number has sent a photograph of the same bus, taken from the inside. “If you’re coming, don’t get stuck upstairs.”",
      ),
    ],
    [
      c(
        "street_door",
        "Go to the side entrance.",
        "door",
        3,
        [item("photo"), flag("sawTrolley")],
        { when: unseen("barDone"), approach: "guarded" },
      ),
      c(
        "street_kiosk",
        "Get something warm at the kiosk.",
        "kiosk",
        5,
        [item("photo"), flag("sawTrolley")],
        { when: unseen("kioskDone"), approach: "honest" },
      ),
      c(
        "street_choose",
        "Choose which invitation to follow.",
        "decision",
        2,
        [item("photo"), flag("sawTrolley")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "kiosk",
    "The last thing\non the menu.",
    "street",
    "NIGHT WINDOW / OPEN UNTIL WE AREN’T",
    [
      p(
        "The last thing on the menu is soup. The vendor tells you this before you can read the board, then tells the next person while pouring yours.",
      ),
      p(
        "A taxi driver complains about the blocked service road. The vendor says it has been blocked every Friday for six years. The driver says he knows. They have the easy irritation of people who use each other to mark time.",
      ),
      p("You ask about the night bus. The vendor points with a spoon."),
      p("“Twenty-six past. Driver’s got a connection to make. Doesn’t wait.”"),
      p(
        "At the other end of the counter, Inez’s paper bag sits beside a second cup. She is not there. The soup has a skin on it.",
      ),
      p(
        "You could ask who she is waiting for. Instead you look at the clock and recognise that you have been treating other people’s deadlines like atmosphere.",
      ),
    ],
    [
      c(
        "kiosk_back",
        "Finish the soup. Make a decision.",
        "decision",
        3,
        [
          flag("kioskDone"),
          mem("inez", "soup", "Player left a paid soup at the night window"),
          rel("inez", 1),
          dim("composure", 10),
        ],
        { approach: "honest" },
      ),
      c(
        "kiosk_rush",
        "Leave the soup for Inez. Go.",
        "decision",
        1,
        [flag("kioskDone"), rel("inez", 2), moral("compassion")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "decision",
    "You cannot be\nin both places.",
    "velvet",
    "TWO INVITATIONS / ONE NIGHT",
    [
      p(
        "Upstairs, a chair has been set out for an independent witness. At 00:20 the ledger will change hands whether or not you occupy it.",
      ),
      p(
        "Outside, someone who saw the archive move is leaving on the 00:26 bus. The transfer is timed so that a person attending one cannot make the other.",
      ),
      p(
        "Nobody says this aloud. Nobody needs to. The architecture has done the discouraging for them.",
      ),
      p(
        "The service door stands open. The stairs are close enough to reach before the next track starts. The invitation feels very small in your hand.",
      ),
      p("You have an upstairs pass.", { when: { item: "pass" } }),
      p(
        "Your borrowed jacket gets a nod from the host. It is an assumption you can use.",
        { when: { flag: "formalAccess" } },
      ),
      p(
        "The upstairs transfer has already happened. Your time elsewhere was not empty time.",
        { when: { after: 1460 } },
      ),
      p(
        "The last bus has departed. The person on it has gone on having a life.",
        { when: { after: 1466 } },
      ),
    ],
    [
      c(
        "upstairs",
        "Attend the ledger exchange.",
        "exchange",
        16,
        [
          flag("attendedExchange"),
          { type: "lock", scene: "bay" },
          dim("heat", 12),
          dim("composure", -8),
        ],
        {
          when: {
            all: [{ before: 1460 }, { not: { flag: "refusedWitness" } }],
          },
          hint: "Commits you until after 00:26. The witness will leave.",
          lockedText: "The exchange is over, or you declined witness status.",
          approach: "reckless",
        },
      ),
      c(
        "loading_bay",
        "Meet the departing witness.",
        "bay",
        16,
        [
          flag("metWitness"),
          { type: "lock", scene: "exchange" },
          rel("inez", 2),
          pull("curiosity"),
        ],
        {
          when: { before: 1466 },
          hint: "You will miss the upstairs transfer.",
          lockedText: "The last bus has left.",
          approach: "curious",
        },
      ),
      c(
        "neither",
        "Decline both. Wait outside.",
        "missed",
        30,
        [flag("choseNeither"), moral("selfPreservation"), dim("composure", 10)],
        { hint: "Both events will proceed without you.", approach: "guarded" },
      ),
      c(
        "one_more",
        "Return to the floor for another conversation.",
        "floor",
        2,
        [],
        {
          when: { before: 1455 },
          hint: "The clock keeps moving.",
          approach: "honest",
        },
      ),
    ],
  ),
];
