import type { Scene } from "../../engine/types";
import {
  p,
  say,
  flag,
  rel,
  mem,
  moral,
  pull,
  item,
  dim,
  msg,
  know,
  c,
  s,
} from "./helpers";
export const consequencesScenes: Scene[] = [
  s(
    "exchange",
    "Your presence\nhas been recorded.",
    "upstairs",
    "THE EXCHANGE / PRIVATE ROOM",
    [
      p(
        "There is nothing theatrical about the upstairs room. A water stain above the window. Four chairs. One of them is the wrong height.",
      ),
      p(
        "Celeste sits opposite an empty seat. A board representative you have not met places a grey document box on the table and reads a date from a form. Mara stands near the door with her arms full of clean towels. She has given herself a reason to be here.",
      ),
      say(
        "celeste",
        "The independent witness is present under an alias. That does not invalidate an objection.",
      ),
      p(
        "The representative opens the box. The ledger inside is held together with elastic bands. Names and addresses run down the left margin; money runs down the right.",
        { reveals: ["tenantRisk"] },
      ),
      p(
        "You recognise your apartment number on an attached authorization. Celeste sees you recognise it.",
      ),
      say("celeste", "We will pause for questions."),
      p(
        "The representative says there is no procedural need. Celeste leaves the pen on the table.",
      ),
      say("celeste", "I did not say there was."),
      p(
        "In the corridor, somebody laughs at something happening in a different night from yours.",
      ),
    ],
    [
      c(
        "object",
        "Ask why your old signature is attached.",
        "objection",
        3,
        [
          know("signature", "Authorization attached to the transfer"),
          flag("objected"),
          moral("honesty"),
          dim("composure", -8),
        ],
        { approach: "honest" },
      ),
      c(
        "watch_transfer",
        "Watch the custody chain. Say nothing yet.",
        "objection",
        3,
        [flag("watchedCustody"), pull("curiosity"), dim("composure", 4)],
        { approach: "curious" },
      ),
      c(
        "leave_exchange",
        "Leave a written objection and step out.",
        "aftermath",
        4,
        [flag("objected"), moral("autonomy"), rel("celeste", 1)],
        { approach: "guarded" },
      ),
    ],
    {
      onEnter: [
        {
          type: "schedule",
          id: "exchange-close",
          delay: 1,
          effects: [
            msg(
              "VELVET / SERVICE",
              "The loading-bay witness has left. Upstairs attendance has been entered in the transfer record.",
            ),
          ],
        },
      ],
    },
  ),
  s(
    "objection",
    "Say it\nwhile they’re listening.",
    "upstairs",
    "THE EXCHANGE / ON THE RECORD",
    [
      p(
        "The representative gives the explanation you have already learned to expect: witness status was “inherited from a prior authorization.” Nobody at the table looks convinced by the wording.",
      ),
      p("The room seems smaller when everyone waits for you to answer.", {
        theme: "socialPressure",
        implied: "Everyone waits for your answer.",
        safe: "You have time to read the authorization before replying.",
      }),
      p("You have enough composure left to name the problem cleanly.", {
        when: { composure: 55 },
      }),
      p(
        "You lose the sentence halfway through forming it. You can still ask for a pause. You can still leave.",
        { when: { not: { composure: 55 } } },
      ),
      say(
        "celeste",
        "There is a duplicate with the board. Before you ask: I did not approve that either.",
        { reveals: ["boardCopy"] },
      ),
      p(
        "It is the first time she sounds less like the owner of the room than someone trying to keep it from being used against her. That does not make her safe. It makes her a participant.",
      ),
    ],
    [
      c(
        "call_bluff",
        "“Then my presence cannot make this legitimate.”",
        "aftermath",
        4,
        [
          flag("challengedBoard"),
          rel("celeste", 2),
          moral("honesty"),
          { type: "faction", id: "umbrella", amount: -2 },
        ],
        { when: { composure: 55 }, approach: "honest" },
      ),
      c(
        "recover",
        "Ask for water. Put the objection in writing.",
        "aftermath",
        5,
        [flag("challengedBoard"), dim("composure", 12), moral("autonomy")],
        { approach: "guarded" },
      ),
      c(
        "leverage",
        "“Give me a copy and I’ll stay quiet for now.”",
        "aftermath",
        3,
        [
          flag("boardDeal"),
          moral("opportunism", 2),
          { type: "faction", id: "umbrella", amount: 2 },
        ],
        { approach: "reckless" },
      ),
      c(
        "leave_room",
        "“I’m leaving. Record that too.”",
        "aftermath",
        2,
        [flag("leftExchange"), dim("composure", 8), pull("defiance")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "bay",
    "Someone has\na bus to catch.",
    "street",
    "LOADING BAY / LAST DEPARTURE",
    [
      p(
        "Inez waits beside a trolley with a woman in a fluorescent rain jacket. The woman introduces herself as Ruth, says she is forty-eight and too old for this shift, then asks if you are going to make her miss the bus.",
      ),
      say("inez", "No. Short version."),
      p(
        "Ruth opens a delivery docket on her phone. The archive box left storage at 00:19. The upstairs transfer was supposed to establish its first change of custody at 00:20. A minute is not much, but it is enough for the document to be wrong.",
        { reveals: ["witness"] },
      ),
      p(
        "“I signed for a trolley,” Ruth says. “Not a story. I want that understood.”",
      ),
      p(
        "You look at the printout she offers. Two sets of wheel marks run across the paper. Someone used the trolley as a desk.",
      ),
      say(
        "inez",
        "The invitation used an old signature the same way. Something practical becomes permission later.",
        { reveals: ["signature"] },
      ),
      p(
        "The bus driver flashes the interior lights. Ruth folds the docket once, sharply.",
      ),
    ],
    [
      c(
        "protect_witness",
        "“Your name stays off my copy.”",
        "bus",
        3,
        [
          flag("protectedWitness"),
          moral("protection", 2),
          rel("inez", 3),
          item("photo"),
          mem("inez", "witness", "Promised Ruth anonymity"),
        ],
        { approach: "honest" },
      ),
      c(
        "name_witness",
        "“Evidence needs an accountable source.”",
        "bus",
        4,
        [
          flag("namedWitness"),
          moral("honesty"),
          rel("inez", -2),
          item("photo"),
          msg(
            "Luca",
            "got a message from ruth. she says you wanted her name on it. i need to think about that.",
          ),
        ],
        { approach: "reckless" },
      ),
      c(
        "copy_dates",
        "Take only the dates and custody stamps.",
        "bus",
        2,
        [
          flag("protectedWitness"),
          moral("autonomy"),
          rel("inez", 1),
          item("photo"),
        ],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "bus",
    "A small,\nnon-symbolic kindness.",
    "street",
    "THE NIGHT BUS",
    [
      p(
        "Ruth cannot find her travel card. She checks the same pocket twice, becomes angry with the pocket, then remembers lending the card to her daughter.",
      ),
      p(
        "The driver looks away with the studied neutrality of someone who has seen this problem before and cannot officially solve it.",
      ),
      p(
        "Inez has a pocket full of keys and no coins. You have enough cash for the bus or a taxi home, not both.",
      ),
      p(
        "Ruth says she can walk. It is raining harder. You could give her the money without making it a statement about what kind of person you are.",
      ),
      p(
        "Behind you, a side door opens at Velvet. Someone wheels an empty document trolley out to the loading bay. The exchange has happened.",
      ),
    ],
    [
      c(
        "fare",
        "Pay her fare. Walk home later.",
        "aftermath",
        3,
        [
          flag("paidFare"),
          moral("compassion"),
          rel("inez", 2),
          mem("inez", "fare", "Paid Ruth’s fare without asking for anything"),
        ],
        { approach: "honest" },
      ),
      c(
        "arrange",
        "Ask the driver to log a deferred fare.",
        "aftermath",
        5,
        [
          flag("fareDeferred"),
          moral("autonomy"),
          pull("candour"),
          rel("inez", 1),
        ],
        { approach: "curious" },
      ),
      c(
        "keep_cash",
        "Keep your fare home. Let Inez sort it out.",
        "aftermath",
        2,
        [moral("selfPreservation"), rel("inez", -1)],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "missed",
    "An empty chair\nis still an answer.",
    "street",
    "AFTER THE DEADLINES",
    [
      p(
        "You wait under the awning until the upstairs lights change. A little later, the night bus pulls away. You have declined both invitations. Other people have made the decisions the invitations were meant to influence.",
      ),
      p(
        "A venue notice appears on your phone: “Transfer witnessed without external objection.” It does not mention that the external witness never agreed to attend.",
      ),
      p(
        "Another message follows. Luca says the loading-bay witness has gone. His next line arrives before you finish reading: “you could have said.”",
      ),
      p(
        "You could have. You also could have been given a choice that did not use two deadlines to manufacture urgency.",
      ),
      p(
        "The side door opens. Inez has left a sealed envelope with the cloakroom attendant. Your alias is on the outside. Whatever you missed, your night has not stopped producing mail.",
      ),
    ],
    [
      c(
        "return_after",
        "Take the envelope and go back inside.",
        "aftermath",
        3,
        [item("photo"), flag("fallbackEvidence")],
        { approach: "curious" },
      ),
      c(
        "keep_distance",
        "Ask the attendant to bring it outside.",
        "aftermath",
        4,
        [item("photo"), flag("fallbackEvidence"), pull("privacy")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "aftermath",
    "The first version\nis already circulating.",
    "velvet",
    "THE ROOM AFTER THE ROOM",
    [
      p(
        "The music has changed. It takes you a moment to notice what else has: the people at the stairs are no longer waiting for anything. A decision looks ordinary once it has happened.",
      ),
      p(
        "Your absence upstairs has been recorded as a lack of objection. The Umbrella has accepted the transfer.",
        { when: { flag: "missedExchange" } },
      ),
      p(
        "You hear that the witness caught the bus. Nobody can now ask her the question you did not get to ask.",
        { when: { flag: "missedWitness" } },
      ),
      p(
        "A group-chat notification attributes a position to you that you have not taken. Someone reacts with a little umbrella. Another person removes their reaction.",
      ),
      say(
        "mara",
        "Don’t read that here. Half of them are looking to see whether you read it.",
      ),
      p(
        "She is carrying the ledger in a brown service envelope. You ask why she has it.",
      ),
      say(
        "mara",
        "They transferred the account. They forgot the paper belongs downstairs. Same cupboard it’s lived in for twelve years.",
      ),
      p(
        "She places the envelope between you. You have access to the document, but not ownership of the people in it.",
      ),
      p(
        "Luca is looking directly at you. He has received a report from Inez about what you said at the door.",
        { when: { all: [{ flag: "liedLuca" }, { after: 1456 }] } },
      ),
    ],
    [
      c(
        "face_luca",
        "Speak to Luca about the door conversation.",
        "contradiction",
        4,
        [],
        {
          when: { all: [{ flag: "liedLuca" }, { after: 1456 }] },
          approach: "reckless",
        },
      ),
      c(
        "archive_now",
        "Ask to examine the service envelope.",
        "archive",
        4,
        [item("ledger"), pull("curiosity")],
        { approach: "curious" },
      ),
      c(
        "mara_private",
        "Ask Mara for a quiet place to read it.",
        "hidden",
        5,
        [item("ledger"), rel("mara", 1)],
        {
          when: { all: [{ npc: "mara", trust: 5 }, { flag: "fixedFan" }] },
          hint: "She remembers the repaired fan.",
          approach: "honest",
        },
      ),
      c(
        "outside_read",
        "Take the envelope to the vestibule.",
        "archive",
        5,
        [item("ledger"), pull("privacy")],
        { approach: "guarded" },
      ),
    ],
    {
      onEnter: [
        {
          type: "rumour",
          id: "outside-witness",
          text: "The outside witness has chosen a side. Nobody agrees which side.",
          faction: "umbrella",
        },
      ],
    },
  ),
  s(
    "contradiction",
    "A borrowed name\ncomes back.",
    "velvet",
    "LUCA / THE CORRIDOR",
    [
      say("luca", "So apparently I invited you."),
      p(
        "He has stopped trying to make his phone work. It is in his pocket, and his hands look uncertain without it.",
      ),
      say(
        "luca",
        "Inez told me. She asked if I needed a second pass. That’s how I found out. Not some underground surveillance network. A woman being helpful.",
      ),
      p("He waits for you to laugh. You don’t. He looks relieved."),
      say(
        "luca",
        "I need to know if that was a door excuse or if somebody told you to use my name. Those are pretty different problems.",
      ),
      p(
        "Mara is too far away to hear. She looks over, sees two people talking, and returns to her work. This conversation belongs to the people actually in it.",
      ),
      p(
        "You can explain. The original statement will still be something he remembers.",
      ),
    ],
    [
      c(
        "admit_lie",
        "“A door excuse. I’m sorry I used your name.”",
        "confession",
        3,
        [
          flag("admittedLie"),
          mem("luca", "lie", "Admitted falsely claiming my invitation"),
          rel("luca", 2, "suspicion"),
          rel("luca", 1),
          moral("honesty"),
        ],
        { approach: "honest" },
      ),
      c(
        "double_down",
        "“That’s what the message implied.”",
        "archive",
        3,
        [
          item("ledger"),
          flag("doubledDown"),
          mem(
            "luca",
            "contradiction",
            "Repeated invitation claim after being challenged",
          ),
          rel("luca", 6, "suspicion"),
          rel("luca", -3),
          moral("opportunism"),
        ],
        { approach: "reckless" },
      ),
      c(
        "refuse_explain",
        "“I’m not discussing it here.”",
        "archive",
        2,
        [
          item("ledger"),
          mem("luca", "contradiction", "Declined to explain the door claim"),
          rel("luca", 3, "suspicion"),
          pull("privacy"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "confession",
    "Repair isn’t\nerasure.",
    "velvet",
    "LUCA / THE SERVICE DOOR",
    [
      p(
        "Luca lets the apology sit for a moment. He seems to be considering a joke, then decides against it.",
      ),
      say(
        "luca",
        "Okay. That’s less bad than someone sending people in my name.",
      ),
      p("He checks the phone again. Still dead."),
      say(
        "luca",
        "Still bad, though. I have to say that or I’ll be annoyed later.",
      ),
      p(
        "You tell him that is fair. The conversation becomes briefly awkward in an ordinary way. Neither of you has a particularly good next line.",
      ),
      say(
        "luca",
        "There’s a carbon sheet in that envelope. Or a token. Inez said something flat. I wasn’t listening properly.",
      ),
      p(
        "He steps aside so you can reach the service table. He has not forgiven everything. He has decided to help you with something specific anyway.",
      ),
    ],
    [
      c(
        "accept_repair",
        "Thank him. Open the envelope.",
        "archive",
        3,
        [item("ledger"), rel("luca", 1), pull("candour")],
        { approach: "honest" },
      ),
    ],
  ),
  s(
    "archive",
    "An original\nwith missing pieces.",
    "velvet",
    "SERVICE TABLE / THE LEDGER",
    [
      p(
        "The ledger smells of dust and warmed paper. Its columns are ruled by hand. Someone started using a different pen halfway through 2011 and never returned to the first colour.",
      ),
      p(
        "You turn pages slowly. There are loans made into grants, grants described as advances, obligations inherited by people who did not sign the original entry. It is a useful record. That is part of what makes it dangerous.",
      ),
      p(
        "Eleven names have been cut from the earlier pages with a blade. The cuts predate tonight; the paper has yellowed at the edges.",
        { reveals: ["missingNames"] },
      ),
      p(
        "A smaller envelope is folded into the back cover. Printed on its face: WITNESS ROUTING / RETAIN WITH ORIGINAL. The old apartment signature appears again. Here, at least, it has a reference number.",
      ),
      p(
        "Mara has left a cup outside the reach of your elbow. She does not ask what you are finding. You notice the effort this takes.",
      ),
      p(
        "You have a choice about the document. First, you can finally get an answer about the invitation.",
      ),
    ],
    [
      c(
        "open_proof",
        "Open the routing envelope.",
        "proof",
        4,
        [pull("curiosity", 2)],
        { approach: "curious" },
      ),
      c(
        "ask_before",
        "Ask Mara whether the routing envelope is yours to open.",
        "proof",
        5,
        [rel("mara", 2), moral("autonomy"), pull("candour")],
        { approach: "honest" },
      ),
    ],
  ),
  s(
    "hidden",
    "Eleven empty lines.",
    "velvet",
    "THE REPAIRED FAN / HIDDEN SCENE",
    [
      p(
        "Mara takes you back to the kitchen. The fan you repaired is still running. She looks up at it with the satisfaction of someone whose work has stayed done.",
      ),
      say("mara", "There’s a reason I wanted the names left alone."),
      p("She opens the ledger at the cut pages."),
      say(
        "mara",
        "We removed eleven names years ago. People who needed to stop being findable. We kept the totals so nobody could say the fund was stealing.",
        { reveals: ["missingNames"] },
      ),
      p("You ask who decided which names to remove."),
      say(
        "mara",
        "We asked. Most of them. Two had already gone. I don’t know if we got those right.",
      ),
      p(
        "She does not offer you the list of the eleven. You realise you are relieved.",
      ),
      say(
        "mara",
        "You fixed a fan without making me explain why I hadn’t. I thought maybe you could hear this without deciding you’d have done it perfectly.",
      ),
      p(
        "She slides the routing envelope across the table. It is a small piece of trust with edges on it.",
      ),
    ],
    [
      c(
        "hold_history",
        "“I won’t pretend the choice was simple.”",
        "proof",
        4,
        [rel("mara", 3), moral("compassion"), flag("sawHidden")],
        { approach: "honest" },
      ),
      c(
        "ask_accountability",
        "“Who can check the totals now?”",
        "proof",
        4,
        [rel("mara", 1), moral("honesty"), flag("sawHidden")],
        { approach: "curious" },
      ),
    ],
  ),
  s(
    "proof",
    "The invitation\nhas a sender.",
    "velvet",
    "WITNESS ROUTING / AUTHENTICATED",
    [
      p(
        "Inside the envelope, the routing record matches the reference number on your invitation. The apartment signature was reused; it was never evidence that you had agreed to be here.",
      ),
      p(
        "A carbon impression carries Mara’s handwriting and the maintenance-queue override: M. VENN / 22:16. She scheduled the invitation a minute before the printer ran. She knew the old machine would produce an independent paper trail.",
        { when: { flag: "variantCarbon" } },
      ),
      p(
        "A brass proxy token is clipped to an authorization signed C. ARDENT. Its number matches your invitation. Celeste commissioned an outside witness before the board could appoint one of its own.",
        { when: { flag: "variantProxy" } },
      ),
      p(
        "A release slip signed I. VALE is tucked inside a forwarding register. The invitation was queued for your apartment’s previous tenant. Inez released it to see who had reused the authorization. The alias field was deliberately left open.",
        { when: { flag: "variantDeadletter" } },
      ),
      p("The name on the authenticated record is {sender}."),
      p("{motive}"),
      p(
        "You read it a second time, looking for something that would make the sender less responsible for your being here. The signature stays the same.",
      ),
      p("An explanation is a useful thing. It is not an apology."),
    ],
    [
      c(
        "confront_sender",
        "Ask the sender to account for it.",
        "sender",
        4,
        [flag("confrontedSender"), moral("honesty")],
        { approach: "honest" },
      ),
      c(
        "focus_ledger",
        "Keep the proof. Review the account before deciding.",
        "casework",
        3,
        [pull("privacy"), flag("keptProofPrivate")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "sender",
    "“You could\nhave asked.”",
    "velvet",
    "NO MORE UNKNOWN NUMBER",
    [
      p(
        "You put the routing record on the table. For the first time tonight, the question is small enough to answer: why involve you without asking?",
      ),
      say(
        "mara",
        "Because people I know have already picked sides. That’s the reason. It’s not a good enough reason.",
        { when: { flag: "variantCarbon" } },
      ),
      say(
        "mara",
        "I thought if you saw it first, you’d stay. Which is asking backwards. I know.",
        { when: { flag: "variantCarbon" } },
      ),
      say(
        "celeste",
        "I expected you to be sent the terms before the invitation. I delegated it. The responsibility remains mine.",
        { when: { flag: "variantProxy" } },
      ),
      say(
        "celeste",
        "I wanted a witness the board could not dismiss as staff. I should have considered what that would cost the witness.",
        { when: { flag: "variantProxy" } },
      ),
      say(
        "inez",
        "It was not meant for you. I thought the old tenant might still collect their post. I should have checked.",
        { when: { flag: "variantDeadletter" } },
      ),
      say(
        "inez",
        "I needed to find who was using the signature. Instead I found the person whose signature it was. That’s my mistake.",
        { when: { flag: "variantDeadletter" } },
      ),
      p(
        "They do not ask you to forgive them before the document decision. For once, two obligations remain separate.",
      ),
      p(
        "You can keep speaking to someone and still change what they are allowed to ask of you.",
      ),
    ],
    [
      c(
        "boundary_sender",
        "“You ask me next time. Before you act.”",
        "casework",
        3,
        [flag("senderBoundary"), moral("autonomy"), pull("candour")],
        { approach: "honest" },
      ),
      c(
        "debt_sender",
        "“Then you owe me something.”",
        "casework",
        3,
        [flag("senderDebt"), moral("opportunism"), dim("nerve", 10)],
        { approach: "reckless" },
      ),
      c(
        "distance_sender",
        "“We can discuss it when this is over.”",
        "casework",
        2,
        [flag("senderDistance"), pull("privacy")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "ledger",
    "What does\nthe truth cost?",
    "velvet",
    "THE ORIGINAL / FOUR WAYS OUT",
    [
      p(
        "The ledger is open. The evidence is not in doubt. What to do with it is.",
      ),
      p(
        "You can preserve the amounts and authorization trail while removing names. That protects people tonight, but the archive will have to find independent corroboration. The board gets time.",
      ),
      p(
        "You can give Luca the complete original. Public scrutiny could stop the transfer. People whose names are visible will lose control of their part of the story.",
      ),
      p(
        "You can surrender the original to Celeste in exchange for access to the board’s records. You may learn more. The institution gets to describe your cooperation as acceptance.",
      ),
      p(
        "Or you can keep it. Nobody can publish the original tonight. Nobody gets the reassurance or leverage they came for either.",
      ),
      p(
        "Mara sees your hand move toward the envelope. She remembers that you promised to protect the names.",
        { when: { flag: "promisedProtection" } },
      ),
      p(
        "Luca is expecting publication. You have not corrected his assumption.",
        {
          when: {
            all: [
              { flag: "lucaMisunderstood" },
              { not: { flag: "correctedLuca" } },
            ],
          },
        },
      ),
      p("Nobody puts a pen in your hand this time."),
    ],
    [
      c(
        "choose_redact",
        "Protect the names. Release the accounts.",
        "redact",
        12,
        [
          flag("ending", "protect"),
          moral("protection", 2),
          rel("mara", 4),
          rel("luca", -1),
          { type: "faction", id: "static", amount: 1 },
          { type: "item", id: "ledger", remove: true },
          item("redacted"),
          {
            type: "schedule",
            id: "redaction-cost",
            delay: 10,
            effects: [
              msg(
                "Luca",
                "without dates matched to names, it needs another source. board gets a week. i know why you did it. still a week.",
              ),
            ],
          },
        ],
        { hint: "Privacy now. Slower accountability.", approach: "honest" },
      ),
      c(
        "choose_publish",
        "Give Luca the complete original.",
        "publish",
        8,
        [
          flag("ending", "public"),
          moral("ambition", 2),
          rel("luca", 4),
          rel("mara", -5),
          { type: "faction", id: "static", amount: 4 },
          { type: "item", id: "ledger", remove: true },
          {
            type: "schedule",
            id: "publication-cost",
            delay: 8,
            effects: [
              msg(
                "VENUE GROUP",
                "The archive is public. A tenant has requested removal of their details. Copies are already circulating.",
              ),
              {
                type: "rumour",
                id: "published",
                text: "The outside witness exposed the club accounts and everyone named in them.",
                faction: "static",
              },
            ],
          },
        ],
        {
          hint: "Immediate scrutiny. Irreversible exposure.",
          approach: "reckless",
        },
      ),
      c(
        "choose_bargain",
        "Trade the original for board access.",
        "bargain",
        7,
        [
          flag("ending", "power"),
          moral("opportunism", 2),
          rel("celeste", 4),
          rel("mara", -3),
          { type: "faction", id: "umbrella", amount: 4 },
          { type: "item", id: "ledger", remove: true },
          item("pass"),
        ],
        { hint: "More access. Less independence.", approach: "curious" },
      ),
      c(
        "choose_withhold",
        "Keep the original. Walk away.",
        "withhold",
        4,
        [
          flag("ending", "ghost"),
          moral("selfPreservation", 2),
          rel("luca", -2),
          rel("celeste", -2),
          pull("privacy"),
        ],
        { hint: "Custody without allies.", approach: "guarded" },
      ),
    ],
  ),
  s(
    "redact",
    "Eleven lines\nbecome a method.",
    "velvet",
    "THE SERVICE COPIER",
    [
      p(
        "Redaction takes longer than you expected. Marker is not enough; held to a light, the names show through. Mara finds scissors. You cut copies, cover the gaps with clean paper, and copy the copies.",
      ),
      p(
        "Luca checks the dates left visible. Twice he asks for one to stay. Twice you ask whether it identifies someone. Once he agrees to remove it. The other time you remove it anyway.",
      ),
      say(
        "luca",
        "This is going to take another source. You understand that, right?",
      ),
      p("You do. Understanding a cost does not make it stop costing."),
      say("mara", "I’ll ask the people I can reach. Ask. Not sign for them."),
      p(
        "The originals go into separate sealed envelopes held by the people responsible for the fund. You keep the redacted copy and the routing proof. Evidence without a ready-made public spectacle.",
      ),
      p(
        "Outside the office, the board representative is calling a taxi. They have acquired time. You have made that trade deliberately.",
      ),
    ],
    [
      c(
        "redact_done",
        "Carry the redacted copy out.",
        "mirror",
        4,
        [flag("redactionFinished")],
        { approach: "honest" },
      ),
    ],
  ),
];
