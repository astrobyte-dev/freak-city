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
  dim,
  msg,
  c,
  unseen,
  s,
} from "./helpers";
export const openingScenes: Scene[] = [
  s(
    "arrival",
    "An address.\nNot an explanation.",
    "taxi",
    "FRIDAY / 11:48 PM",
    [
      p(
        "Rain on the taxi window. A red light drags itself across the glass, then breaks into pieces.",
      ),
      p(
        "The driver checks the address again. Slows down. Checks you in the mirror.",
      ),
      p("“You sure?”"),
      p(
        "Your phone lights up against your knee. No name. No photograph. Just the message that brought you out of an apartment you had already locked for the night.",
      ),
      p("COME ALONE.\nDON’T GIVE THEM YOUR REAL NAME.", {
        theme: "surveillance",
        implied:
          "An unsigned message asks you to come to Velvet under an alias.",
        safe: "An unsigned invitation gives the side entrance of Velvet and asks for an alias.",
      }),
      p(
        "You have never been to Velvet. You know that much. Yet the address was already in your maps, saved beneath a name you don’t recognise.",
      ),
      p(
        "The meter adds another dollar. The driver waits for an answer. Somewhere beyond the window, a queue of people is pretending not to feel the rain.",
      ),
    ],
    [
      c(
        "enter",
        "“This is the place.”",
        "door",
        3,
        [pull("curiosity"), dim("nerve", 5)],
        {
          hint: "Step out. Keep the invitation to yourself.",
          approach: "curious",
        },
      ),
      c(
        "ask_driver",
        "“Has anyone else asked you to come here?”",
        "door",
        5,
        [
          flag("driverWarning"),
          pull("candour"),
          msg(
            "DRIVER / RECEIPT",
            "Keep the cab receipt. The side entrance closes before the front. And don’t take their replacement taxi.",
          ),
        ],
        { hint: "A little context costs a little time.", approach: "honest" },
      ),
      c(
        "circle",
        "“Go around the block first.”",
        "street",
        6,
        [flag("circled"), dim("composure", 8), pull("privacy")],
        { hint: "See the street before they see you.", approach: "guarded" },
      ),
    ],
  ),
  s(
    "door",
    "A name you can\nafford to lose.",
    "street",
    "VELVET / SIDE ENTRANCE",
    [
      p(
        "The taxi leaves a dry rectangle in the rain. Then that is gone too. You stand beneath a narrow awning with a closed umbrella that belongs to someone else.",
      ),
      p(
        "A woman in a grey coat sits inside the doorway. No velvet rope. A portable heater ticks beside her chair. She is repairing a paper bag with transparent tape.",
      ),
      say("inez", "Side door. Good. The front steps are flooded."),
      p(
        "She notices the invitation when you turn your phone around. Stops pressing the tape.",
      ),
      say("inez", "That says delivery. Not printing.", { reveals: ["header"] }),
      p(
        "Her finger taps 23:41 once. She returns to the bag, but she has lost her place.",
      ),
      say("inez", "I need a name for the book. The one you want used in here."),
      p(
        "Inside, the bass is less a sound than a faulty second heartbeat. You can still leave. That is worth remembering.",
      ),
    ],
    [
      c(
        "truth",
        "“Someone sent this. I don’t know who.”",
        "vestibule",
        3,
        [
          flag("doorHonest"),
          mem("inez", "invitation", "Player admitted the sender was unknown"),
          moral("honesty"),
          rel("inez", 2),
          pull("candour"),
        ],
        { approach: "honest" },
      ),
      c(
        "lie",
        "“Luca invited me.”",
        "vestibule",
        3,
        [
          flag("liedLuca"),
          mem("inez", "claimedSender", "Luca"),
          moral("opportunism"),
          {
            type: "schedule",
            id: "door-report",
            delay: 25,
            effects: [
              {
                type: "belief",
                npc: "luca",
                key: "playerClaim",
                value: "The player said I invited them.",
                source: "Inez directly reported the door conversation",
              },
              {
                type: "memory",
                npc: "luca",
                key: "doorReport",
                value: "Inez heard the player claim my invitation",
              },
              {
                type: "message",
                from: "Luca",
                text: "inez says i invited you. funny. come find me.",
              },
            ],
          },
        ],
        { hint: "She writes it down.", approach: "reckless" },
      ),
      c(
        "private",
        "“Just the alias. Is that enough?”",
        "vestibule",
        2,
        [
          mem("inez", "boundary", "Asked to give only an alias"),
          rel("inez", 1),
          pull("privacy"),
          moral("autonomy"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "vestibule",
    "Nothing here\nis quite private.",
    "velvet",
    "THE VESTIBULE",
    [
      p(
        "Warm air. Wet wool. A narrow corridor painted the colour of dried wine. A handwritten notice says the toilets on the left are the working ones. Someone has added CURRENTLY.",
      ),
      p(
        "Inez draws a line through an empty space in the book. Your alias sits above it.",
      ),
      say(
        "inez",
        "If somebody asks for your full name, you can say no. If they say I need it, they are wrong.",
      ),
      p(
        "She slides the book beneath her chair. Beyond her, a tall woman is trying to convince a door closer to work. It answers with a metallic cough.",
      ),
      say("mara", "That’s twice this week. Sorry. Not you. The door."),
      p(
        "Her gaze takes in your dripping coat, then the blank wristband Inez has given you.",
      ),
      say(
        "mara",
        "New? There’s a place for wet things by the bar. Except the speakers. We found that out.",
      ),
      p(
        "A man passing with two empty glasses starts to laugh. Mara points at the door. He holds it without being asked again.",
      ),
    ],
    [
      c(
        "bar",
        "Follow her to the bar.",
        "bar",
        2,
        [flag("metMara"), rel("mara", 1)],
        { approach: "neutral" },
      ),
      c(
        "wardrobe",
        "Stop at the cloakroom first.",
        "coat",
        3,
        [pull("ritual")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "bar",
    "Something ordinary.",
    "velvet",
    "AT THE BAR / MARA",
    [
      p(
        "Mara puts a folded towel on the counter before you can rest your elbows there. She has a pencil tucked behind her ear and another in her hand. She seems annoyed to discover the second one.",
      ),
      say(
        "mara",
        "Water? Tea? Coffee’s technically coffee. That’s about all I can promise.",
      ),
      p(
        "Behind her are shelves of bottles, many labelled in marker. She pours a glass for someone without interrupting your conversation.",
        {
          theme: "substanceUse",
          implied:
            "Mara finishes another order without interrupting your conversation.",
          safe: "Behind her are mismatched cups and a kettle with a repaired handle.",
        },
      ),
      p("You ask if she always starts this late."),
      say(
        "mara",
        "Started at four. Fan died at six. It’s had a more reasonable shift than me.",
      ),
      p("She checks the room, then looks back at you properly."),
      say("mara", "Sorry. What did you say you wanted?"),
      p(
        "This might be the first question tonight with no hidden second question inside it.",
      ),
    ],
    [
      c(
        "tea",
        "“Tea. No sugar.”",
        "floor",
        3,
        [
          flag("drink", "tea"),
          mem("mara", "drink", "Tea, no sugar"),
          pull("connection"),
          flag("barDone"),
        ],
        { approach: "honest" },
      ),
      c(
        "coffee",
        "“The technically coffee.”",
        "floor",
        3,
        [
          flag("drink", "coffee"),
          mem("mara", "drink", "Coffee, despite the warning"),
          rel("mara", 1),
          flag("barDone"),
        ],
        { approach: "reckless" },
      ),
      c(
        "water",
        "“Water’s good. Long night?”",
        "floor",
        3,
        [
          flag("drink", "water"),
          mem("mara", "drink", "Water; asked about my shift"),
          rel("mara", 2),
          moral("compassion"),
          flag("barDone"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "coat",
    "Choose your armour.",
    "velvet",
    "CLOAKROOM / NO RETURNS AFTER 03:00",
    [
      p(
        "The cloakroom attendant is absent. A brass bell has a strip of tape across it: PLEASE DON’T. Three rails divide the room into weather, work, and an expensive approximation of danger.",
      ),
      p(
        "Your apartment is a ten-minute walk away, but tonight you brought options folded in a tote. You had told yourself this was practical. Now it looks like preparation.",
      ),
      p(
        "An open shelf holds a plain black jacket offered for guests. Beside it, a mirror has been covered with an old club flyer.",
      ),
      p(
        "A member in a very good suit leaves through the staff door carrying a sack of ice. On his way past, he says the jacket is clean. His voice makes it sound like a confession.",
      ),
      p(
        "Choose what people will assume first. You can change it later in your inventory; an impression already made will still have happened.",
      ),
    ],
    [
      c(
        "keep_coat",
        "Keep the raincoat. Stay an outsider.",
        "bar",
        2,
        [
          flag("outfit", "coat"),
          mem("inez", "coat", "Kept the raincoat"),
          dim("composure", 5),
        ],
        { approach: "guarded" },
      ),
      c(
        "formal",
        "Borrow the black jacket.",
        "bar",
        3,
        [
          flag("outfit", "formal"),
          flag("formalAccess"),
          engage("fashion.materials"),
          rel("celeste", 1),
          { type: "attractor", key: "tailoring", amount: 1 },
        ],
        {
          hint: "The upstairs host notices formal dress.",
          approach: "reckless",
        },
      ),
      c(
        "workwear",
        "Roll up your sleeves.",
        "bar",
        2,
        [flag("outfit", "workwear"), rel("mara", 1), dim("nerve", 4)],
        { approach: "honest" },
      ),
    ],
  ),
  s(
    "floor",
    "Everybody came\nfor something.",
    "velvet",
    "VELVET / MAIN ROOM",
    [
      p(
        "The club reveals itself in pieces: a low red ceiling, an unoccupied booth, the slow rotation of a floor fan that moves almost no air. A woman laughs hard enough to forget who she is with.",
      ),
      p(
        "There is music, but nobody seems to agree on whether this is a place for dancing. The small patch of floor nearest the speakers belongs to three strangers with their eyes closed.",
      ),
      p(
        "Mara is catching up with orders. Near the stairs, a woman with reading glasses on a chain closes a folder. A man in a repaired jacket is arguing gently with a wall socket.",
      ),
      p(
        "You catch someone’s attention across the room. They smile, then look away, leaving you free to do the same.",
        {
          theme: "romance",
          implied:
            "There are glances across the room. You can choose whether to return them.",
          safe: "Two people across the room make space for a friend arriving late.",
        },
      ),
      p(
        "Your phone shows a new venue notice: “Witness reception, upstairs, 00:20.” Beneath it, someone has sent a second location: “Loading bay. Last bus, 00:26.”",
      ),
      p(
        "There is time to talk. There is not time to know everyone before choosing.",
      ),
    ],
    [
      c(
        "find_mara",
        "Ask Mara about the invitation.",
        "mara",
        4,
        [flag("maraTalk"), pull("connection")],
        {
          when: unseen("maraTalk"),
          hint: "The bar manager / about 8 minutes",
          approach: "honest",
        },
      ),
      c(
        "find_celeste",
        "Approach the woman by the stairs.",
        "celeste",
        4,
        [flag("celesteTalk"), pull("ritual")],
        {
          when: unseen("celesteTalk"),
          hint: "The proprietor / about 8 minutes",
          approach: "reckless",
        },
      ),
      c(
        "find_luca",
        "Help the man with the dead phone.",
        "luca",
        4,
        [flag("lucaTalk"), pull("curiosity")],
        {
          when: unseen("lucaTalk"),
          hint: "The radio archivist / about 8 minutes",
          approach: "curious",
        },
      ),
      c(
        "find_inez",
        "Find the custodian and her book.",
        "inez",
        4,
        [flag("inezTalk"), pull("privacy")],
        {
          when: unseen("inezTalk"),
          hint: "The custodian / about 8 minutes",
          approach: "guarded",
        },
      ),
      c(
        "toilet",
        "Take a minute away from the room.",
        "washroom",
        3,
        [flag("washroomDone"), dim("composure", 8)],
        { when: unseen("washroomDone"), approach: "neutral" },
      ),
      c(
        "salon",
        "Look into the room beside the dance floor.",
        "salon",
        3,
        [engage("performance.observer")],
        {
          theme: "powerExchange",
          when: {
            all: [
              { not: { flag: "salonDone" } },
              { before: 1455 },
              { theme: "performance" },
            ],
          },
          hint: "A social ritual with an explicit right to refuse.",
          approach: "curious",
        },
      ),
      c(
        "private_token",
        "Ask about a different kind of introduction.",
        "reversal",
        3,
        [flag("salonDone")],
        {
          theme: "powerExchange",
          when: {
            all: [
              { interest: "authority.negotiated", minimum: 2 },
              { npc: "celeste", trust: 2 },
              { not: { flag: "salonDone" } },
            ],
          },
          hint: "A possibility suggested by what you have chosen to explore.",
          approach: "reckless",
        },
      ),
      c("listen_track", "Ask Luca about the track.", "listening", 3, [], {
        theme: "romance",
        when: { all: [{ flag: "lucaTalk" }, { not: { flag: "heardTrack" } }] },
        hint: "A quieter moment / about 6 minutes",
        approach: "honest",
      }),
      c("commit", "Decide where to be at twenty past.", "decision", 1, [], {
        hint: "Two invitations. One night.",
        approach: "neutral",
      }),
    ],
    {
      onEnter: [
        msg(
          "VELVET / SERVICE",
          "Witness reception. Upstairs. 00:20. Attendance is not compulsory.",
        ),
        msg(
          "UNKNOWN",
          "Loading bay. Last bus at 00:26. You cannot make this if you attend the exchange.",
        ),
      ],
    },
  ),
];
