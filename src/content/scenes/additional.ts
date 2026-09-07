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
  know,
  c,
  s,
} from "./helpers";
export const additionalScenes: Scene[] = [
  s(
    "salon",
    "The right\nto turn it over.",
    "velvet",
    "THE SALON / HOUSE PROTOCOL",
    [
      p(
        "The room beside the dance floor is quieter. Its door is propped open with a stack of books. At a long table, adults in formal clothes and carefully repaired clubwear pass small ceramic tokens from hand to hand.",
      ),
      p(
        "A guest wearing a narrow collar takes a token, reads the card beside it, and gives both back. The host nods. Nothing else is asked of them.",
        {
          theme: "symbolicOwnership",
          implied:
            "One guest returns a symbolic token. The host accepts the decision.",
          safe: "A guest declines an invitation to join the table. The host accepts the decision.",
        },
      ),
      p(
        "Celeste is near the doorway. She notices you trying to work out the rules without looking too closely at the people.",
      ),
      say(
        "celeste",
        "Introductions. The person holding the token decides how the next person is introduced. Within terms they have already agreed.",
      ),
      p(
        "The current holder looks at a man in a beautifully cut jacket. “May I say the embarrassing one?” The man thinks, then shakes his head. The holder chooses something else.",
        {
          theme: "humiliation",
          implied:
            "Someone asks permission before using a personal introduction and accepts a refusal.",
          safe: "Two guests agree on an introduction before their turn.",
        },
      ),
      say(
        "celeste",
        "The terms are private. You do not need to know them to respect the refusal.",
      ),
      p("You ask whether the arrangement always works that smoothly."),
      say(
        "celeste",
        "No. We have asked people to leave. Having rules is not proof that everyone follows them.",
      ),
      p(
        "A leather glove lies across the empty chair beside her. She picks it up and puts it in her pocket. The chair is now available, but she does not make the decision for you.",
        {
          theme: "fetishFashion",
          implied: "Celeste clears a personal item from the spare chair.",
          safe: "Celeste clears her bag from the spare chair.",
        },
      ),
      p(
        "Someone at the table is introduced as “the only person here who has returned my casserole dish.” The laugh that follows is not particularly elegant. It makes the room easier to read.",
      ),
    ],
    [
      c(
        "salon_observe",
        "Stay by the door. Learn how people say no.",
        "floor",
        5,
        [
          flag("salonDone"),
          engage("ritual.optOut"),
          engage("performance.observer"),
          pull("privacy"),
          dim("composure", 5),
        ],
        { approach: "curious" },
      ),
      c(
        "salon_join",
        "Ask Celeste whether she would give you the token.",
        "reversal",
        5,
        [
          flag("salonDone"),
          engage("authority.roleReversal"),
          engage("authority.negotiated"),
          rel("celeste", 1),
        ],
        {
          theme: "powerExchange",
          when: { npc: "celeste", trust: 2 },
          hint: "A private change in who sets the terms.",
          approach: "reckless",
        },
      ),
      c(
        "salon_leave",
        "Let the table continue without an audience.",
        "floor",
        1,
        [
          flag("salonDone"),
          engage("performance.observer", "avoid"),
          moral("autonomy"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "reversal",
    "An introduction\non your terms.",
    "upstairs",
    "THE ALCOVE / CELESTE",
    [
      p(
        "Celeste carries two chairs into the alcove. She does not ask a member of staff to do it. When you help, she thanks you with the slight distraction of someone who is planning a sentence.",
      ),
      say(
        "celeste",
        "You may introduce me using something you have actually observed. No personal histories. No guesses presented as knowledge. I may stop it at any point. So may you.",
      ),
      p("She places the ceramic token on your palm, then withdraws her hand.", {
        theme: "powerExchange",
        implied:
          "She gives you the token and the agreed right to lead the introduction.",
        safe: "She invites you to say what you have noticed about her.",
      }),
      p(
        "The rules are clear enough that you can notice the part they do not settle: she cares what you say. You would not have been certain of that a minute ago.",
      ),
      p(
        "You could introduce the proprietor. The negotiator. The woman who corrects a sentence before asking whether its speaker is all right. Each version would be defensible. None would be complete.",
      ),
      say("celeste", "You are taking longer than I expected."),
      p(
        "You point out that she did not set a time limit. She almost objects. Then her mouth changes before the rest of her face catches up.",
      ),
      say("celeste", "No. I did not."),
      p(
        "For a moment the quiet between you is unusually comfortable. She leaves it there instead of filling it with terms.",
        {
          theme: "romance",
          implied: "For a moment the formal conversation becomes personal.",
          safe: "You both take a moment to think before continuing.",
        },
      ),
      p(
        "From the other side of the wall comes an argument about who ordered too much ice. Celeste closes her eyes for a second, then opens them. Even here, someone has to own the building.",
      ),
    ],
    [
      c(
        "introduce_person",
        "“Celeste. She listens better when she isn’t deciding.”",
        "floor",
        4,
        [
          flag("celesteIntroduction", "person"),
          rel("celeste", 2, "affinity"),
          mem(
            "celeste",
            "introduction",
            "Player noticed I can listen without directing",
          ),
          engage("authority.roleReversal"),
          engage("attention.private"),
          dim("heat", 10),
        ],
        { theme: "romance", approach: "honest" },
      ),
      c(
        "introduce_terms",
        "“Celeste. She leaves room for an exception.”",
        "floor",
        3,
        [
          flag("celesteIntroduction", "terms"),
          rel("celeste", 2),
          engage("authority.negotiated"),
          moral("autonomy"),
        ],
        { approach: "curious" },
      ),
      c(
        "return_token",
        "“I don’t know you well enough yet.” Return the token.",
        "floor",
        2,
        [
          flag("celesteIntroduction", "declined"),
          rel("celeste", 2),
          engage("ritual.optOut"),
          pull("candour"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "listening",
    "One shared\ntrack.",
    "velvet",
    "LUCA / UNDER THE DEAD SPEAKER",
    [
      p(
        "Luca has a little music player with physical buttons. It looks too old to be fashionable and too carefully repaired to be ironic. One earpad on the headphones is held in place with a strip of black fabric.",
      ),
      say(
        "luca",
        "Phone dies, music survives. Priorities. Do you want to hear the track I was talking about?",
      ),
      p(
        "He holds out the headphones without moving closer. You take them. The first sound is someone opening a window. Then drums that seem to be recorded in the room you are standing in, until the song finally begins.",
      ),
      p(
        "It is quieter and less clever than you expected. Luca sees you noticing and starts to explain. You lift a finger. He stops.",
      ),
      p(
        "For three minutes he has to let something speak without interpreting it for you. At first he checks your expression after every change in the track. Then he looks at the floor and listens through the loose earcup.",
      ),
      p(
        "His shoulder is near yours. Neither of you closes the distance. The shared attention is enough for now.",
        {
          theme: "romance",
          implied: "The conversation becomes easier while you listen together.",
          safe: "You both concentrate on the track without talking over it.",
        },
      ),
      say(
        "luca",
        "That bit at the end. That’s the microwave door. The one he owes me. I’m in the credits as Additional Percussion.",
      ),
      p(
        "You ask whether he is joking. He takes the player back, opens a tiny text file, and shows you the credits. He is not.",
      ),
      say("luca", "I didn’t say it was a good grievance."),
      p(
        "When the next track begins, he stops it. This one small thing does not have to become the whole night.",
      ),
    ],
    [
      c(
        "track_again",
        "“Send me the track when your phone wakes up.”",
        "floor",
        4,
        [
          flag("heardTrack"),
          mem("luca", "track", "Asked for the shared track"),
          rel("luca", 2, "affinity"),
          engage("attention.private"),
          pull("connection"),
          {
            type: "schedule",
            id: "luca-track",
            delay: 35,
            effects: [
              msg(
                "Luca",
                "track is called Kitchen Window. he says thanks for listening. still no microwave.",
              ),
            ],
          },
        ],
        { theme: "romance", approach: "honest" },
      ),
      c(
        "track_credit",
        "“Additional percussion deserves half the royalties.”",
        "floor",
        3,
        [
          flag("heardTrack"),
          mem("luca", "track", "Joked about the microwave royalties"),
          rel("luca", 2),
          pull("candour"),
        ],
        { approach: "curious" },
      ),
      c(
        "track_thanks",
        "Thank him. Give the headphones back.",
        "floor",
        2,
        [
          flag("heardTrack"),
          rel("luca", 1),
          engage("attention.private", "uncertain"),
        ],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "casework",
    "Knowing who\nis a beginning.",
    "velvet",
    "THE SERVICE TABLE / SECOND READING",
    [
      p(
        "The routing envelope answers the first question. It does not tell you how much of the sender’s explanation you should accept. The distinction seems worth a few more minutes.",
      ),
      p(
        "Mara finds a second chair. Luca puts his now-charging phone face down on the table. Celeste asks whether the office should remain open. Inez leaves her number with the person covering the door. None of them is available in exactly the same way.",
      ),
      p(
        "The accounts are due to be copied into the board’s morning minutes. You can still decide their custody before then. You have more time than you had at the first pair of deadlines, and better questions to spend it on.",
      ),
      p(
        "The carbon record points to a dispute over who controlled the tenant archive. Mara’s account of inviting an outsider leaves out why her old friends were no longer acceptable witnesses.",
        { when: { flag: "variantCarbon" } },
      ),
      p(
        "The proxy token includes a board reference beside the witness number. Celeste’s “procedural error” may have changed who could break a tied vote. An independent witness could have become a very useful proxy.",
        { when: { flag: "variantProxy" } },
      ),
      p(
        "The release slip gives your address but a different addressee. Inez made a mistake she has admitted. The register may tell you whether the other person is still waiting for the letter.",
        { when: { flag: "variantDeadletter" } },
      ),
      p(
        "Or you can decide you have enough evidence to act. Investigation can become a way of delaying a decision, too.",
      ),
    ],
    [
      c(
        "investigate_carbon",
        "Ask Mara why she needed an outsider.",
        "carbon_case",
        5,
        [pull("curiosity")],
        { when: { flag: "variantCarbon" }, approach: "curious" },
      ),
      c(
        "investigate_proxy",
        "Ask Celeste about the board reference.",
        "proxy_case",
        5,
        [pull("curiosity")],
        { when: { flag: "variantProxy" }, approach: "curious" },
      ),
      c(
        "investigate_letter",
        "Call Inez about the intended recipient.",
        "letter_case",
        5,
        [pull("curiosity")],
        { when: { flag: "variantDeadletter" }, approach: "curious" },
      ),
      c(
        "decide_now",
        "I have enough to make the document decision.",
        "ledger",
        2,
        [flag("declinedCasework")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "carbon_case",
    "The person\nshe didn’t ask.",
    "velvet",
    "MARA / CARBON CAMPAIGN",
    [
      say(
        "mara",
        "Luca would have come if I’d asked. I know that. He’d also have brought the archive group into it before I finished asking.",
      ),
      p(
        "Mara has stopped tidying. Her hands rest on the edge of the table. You can see how often she wants to give them a task.",
      ),
      say(
        "mara",
        "When we took those eleven names out, we disagreed about the originals. I wanted the people named to hold their pages. He wanted a sealed copy with the collective. In case someone needed proof later.",
      ),
      p("You ask what they did."),
      say(
        "mara",
        "Both. Bad compromise. He gave out the pages. I kept a carbon. I didn’t tell him.",
      ),
      p(
        "The cups have been cleared. There is no practical interruption coming. She carries on.",
      ),
      say(
        "mara",
        "Then he published a list of gaps. Not names. Gaps. People worked out two of them from the dates. We each did the thing we told the other one not to do.",
      ),
      p(
        "This is the missing part of the invitation. She did not only want someone unconnected to the institution. She wanted a relationship with no previous argument inside it.",
      ),
      say(
        "mara",
        "That wasn’t fair to you. Or him, probably. I didn’t need someone innocent. I needed someone I hadn’t let down yet.",
      ),
      p(
        "Luca is still in the corridor. You could tell him about the carbon, with her agreement or without it. It would give him a more accurate history. It could also become the same argument with you holding the information.",
      ),
      p(
        "Mara asks you to wait while she decides how to tell him herself. Tonight has given you several reasons to distrust a request for patience. It has also given you reasons to understand one.",
      ),
    ],
    [
      c(
        "mara_tells",
        "Give her five minutes to tell Luca herself.",
        "source_call",
        6,
        [
          flag("carbonReconciled"),
          moral("autonomy"),
          rel("mara", 3),
          {
            type: "belief",
            npc: "luca",
            key: "carbon",
            value: "Mara kept a carbon after agreeing to return the originals.",
            source: "Mara directly admitted it after the player gave her time",
          },
          rel("luca", 1),
          msg(
            "Luca",
            "mara told me. i need a minute. thanks for not making it a group announcement.",
          ),
        ],
        { approach: "honest" },
      ),
      c(
        "tell_luca",
        "Tell Luca yourself. He deserves the accurate record.",
        "source_call",
        3,
        [
          flag("carbonExposed"),
          moral("honesty"),
          rel("mara", -3),
          {
            type: "belief",
            npc: "luca",
            key: "carbon",
            value: "Mara concealed a carbon copy.",
            source: "Player reported Mara’s admission",
          },
          rel("luca", 2),
        ],
        { approach: "reckless" },
      ),
      c(
        "stay_out",
        "Leave the old argument between them.",
        "assembly",
        2,
        [flag("carbonUnresolved"), moral("selfPreservation")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "proxy_case",
    "A witness\nwith a casting vote.",
    "upstairs",
    "CELESTE / PROXY CAMPAIGN",
    [
      p(
        "Celeste reads the reference you point to. She does not remove her glasses. For once you cannot use that tell to decide what is coming.",
      ),
      say(
        "celeste",
        "The board can designate a neutral witness as a procedural proxy when a vote is tied. The designation requires the witness’s separate consent.",
      ),
      p("You ask whether anyone had prepared that separate consent."),
      p(
        "She takes a second page from the folder. It is unsigned. Your alias has been typed at the top.",
      ),
      say(
        "celeste",
        "Yes. I wanted the option. The vote on custody was expected to split equally.",
      ),
      p(
        "The explanation is compatible with what she told you before. It is also substantially more than what she told you before.",
      ),
      p(
        "You ask whether the missing signature would have stopped anyone using your name.",
      ),
      say("celeste", "I would have stopped them."),
      p(
        "You look down at the invitation authorization, which used an old signature and a missing page. She follows your gaze.",
      ),
      say("celeste", "That is not a satisfactory answer. No."),
      p(
        "She offers to attach an explicit refusal to the board minutes. It would remove the option she hoped to keep. It would also leave the tied vote unresolved, giving the existing custodian another week.",
      ),
      p(
        "You could use the proxy yourself. One vote could secure access to records or require a review. It would mean accepting a role created before you agreed to have one.",
      ),
      p(
        "Celeste puts the unsigned page within reach and then moves her hand away. You wonder whether doing it correctly this time matters. It matters enough to give you a choice. It cannot make the earlier choice hers to have made.",
      ),
    ],
    [
      c(
        "refuse_proxy",
        "Write an explicit refusal. Let the tie remain.",
        "source_call",
        4,
        [
          flag("proxyRefused"),
          moral("autonomy", 2),
          rel("celeste", 1),
          mem("celeste", "proxy", "Explicitly refused the casting vote"),
          { type: "faction", id: "umbrella", amount: -1 },
        ],
        { approach: "honest" },
      ),
      c(
        "use_proxy",
        "Accept the vote only for an independent audit.",
        "source_call",
        5,
        [
          flag("proxyAudit"),
          moral("ambition"),
          rel("celeste", 2),
          { type: "faction", id: "umbrella", amount: 1 },
          msg(
            "BOARD / RECORD",
            "Your request for an independent audit has been entered with the casting vote. Approval of the transfer remains a separate matter.",
          ),
        ],
        { approach: "curious" },
      ),
      c(
        "keep_option",
        "Leave the page unsigned. Keep the option.",
        "assembly",
        2,
        [flag("proxyOpen"), moral("opportunism")],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "letter_case",
    "The person\nbefore you.",
    "velvet",
    "INEZ / DEAD LETTER CAMPAIGN",
    [
      p(
        "Inez answers from a room with a television in it. Someone is describing the weather in a much more optimistic voice than the weather deserves.",
      ),
      say("inez", "Got off the bus. My sister’s. Keep going."),
      p(
        "You ask about the previous tenant. Whether they are alive. Whether they still want the invitation. Whether any of this was supposed to happen to you.",
      ),
      say("inez", "Alive. I don’t know about the invitation. And no."),
      p("She asks which question you want answered properly first."),
      p(
        "The previous tenant helped reconcile the fund’s addresses with its payment records. They left the Quarter after discovering that a forwarding list had been used to find someone who did not want to be found. The invitation was queued before they left. The queue never received the new address.",
      ),
      say(
        "inez",
        "They didn’t vanish. They moved. People here do like making a departure sound more expensive than it was.",
      ),
      p("You ask whether she can put you in contact."),
      say("inez", "I can ask. You cannot have the number before I do."),
      p(
        "There is no trick in the wording. If the former tenant refuses, you will not hear their account. The release slip will remain evidence of a mistaken recipient, with no convenient confession attached.",
      ),
      p(
        "Inez gives you one fact she has permission to share: the forwarding convention is Motel 27. A key can represent a stored object, a room, or a request to be contacted. The number is not proof that everyone has been in the same building.",
      ),
      say("inez", "They left records, not obligations. You can decline both."),
      p(
        "On the television, the forecast changes to rain. Inez’s sister says she could have told them that for free.",
      ),
    ],
    [
      c(
        "ask_contact",
        "Ask Inez to request permission to contact them.",
        "source_call",
        4,
        [
          flag("tenantContactRequested"),
          rel("inez", 3),
          moral("autonomy"),
          {
            type: "schedule",
            id: "tenant-response",
            delay: 12,
            effects: [
              msg(
                "Inez",
                "They have agreed to send their account in writing. No call. That is what they are comfortable with.",
              ),
            ],
          },
        ],
        { approach: "honest" },
      ),
      c(
        "demand_contact",
        "Press her for the number. You’ve already been involved.",
        "source_call",
        3,
        [
          flag("tenantContactRefused"),
          rel("inez", -3),
          moral("control"),
          msg(
            "Inez",
            "No. Your right to an explanation does not give me permission to share their number.",
          ),
        ],
        { approach: "reckless" },
      ),
      c(
        "no_contact",
        "Let the former tenant stay out of this night.",
        "assembly",
        2,
        [flag("tenantLeftAlone"), moral("protection"), rel("inez", 1)],
        { approach: "guarded" },
      ),
    ],
  ),
  s(
    "source_call",
    "Someone says no.\nThe story has to bear it.",
    "velvet",
    "A CALL WITH PERMISSION",
    [
      p(
        "Mara asks one former tenant whether they would speak to an outside witness. She explains what the ledger decision could do before mentioning that you are waiting. You hear the care she takes with the order.",
      ),
      p(
        "The person agrees to a short call. They choose the name Ellis, say they are thirty-seven, and ask if anyone is recording. You put your phone away. Mara says hers is only on speaker because she asked permission to use it that way.",
      ),
      p(
        "Ellis remembers the fund. Remembers an advance becoming a grant. Remembers signing a form they could not read properly while exhausted. They do not remember the date. They are annoyed with themselves for that.",
      ),
      p(
        "You tell them dates can be checked. The problem is that the records used the old address, so the most useful piece of corroboration would connect their current identity to an address they left deliberately.",
      ),
      p(
        "Ellis gets quiet. You can hear a child’s television programme in another room; Ellis asks someone to turn it down. They return to the call and say no.",
      ),
      p(
        "Not “perhaps.” Not “convince me.” They do not want their account used publicly.",
      ),
      say("mara", "Okay. We won’t use it."),
      p(
        "Ellis asks whether that means the board gets away with the transfer. Mara says it may mean the challenge takes longer. She does not pretend there is no cost, and does not ask Ellis to pay it anyway.",
      ),
      p(
        "You could ask whether a private signed statement would be acceptable. It is a different request, but it still comes after a refusal. Or you could end the call and let the evidence remain incomplete.",
      ),
      p(
        "Whatever you do, the ledger does not become less important because somebody declined to become part of its public explanation.",
      ),
    ],
    [
      c(
        "sealed_trust",
        "Offer to hold a sealed account without publishing it.",
        "assembly",
        5,
        [
          flag("sealedStatement"),
          moral("protection"),
          rel("mara", 2),
          mem(
            "mara",
            "source",
            "Offered private custody with a history of keeping confidence",
          ),
        ],
        {
          when: { trait: "Keeps a confidence" },
          hint: "Your habit of keeping confidences offers another approach. The account remains unavailable to the public.",
          approach: "honest",
        },
      ),
      c(
        "respect_no",
        "“Thank you for talking. We won’t use your account.”",
        "assembly",
        4,
        [
          flag("sourceRefused"),
          moral("autonomy", 2),
          rel("mara", 2),
          mem("mara", "source", "Accepted Ellis’s refusal without bargaining"),
        ],
        { approach: "honest" },
      ),
      c(
        "private_statement",
        "Ask once about a sealed statement, with room to refuse.",
        "assembly",
        5,
        [
          flag("sealedStatement"),
          moral("compassion"),
          rel("mara", 1),
          msg(
            "Mara",
            "ellis agreed to a sealed statement for an independent reviewer only. not the archive. please keep that distinction.",
          ),
        ],
        { approach: "curious" },
      ),
      c(
        "press_source",
        "“Without a source, this will happen to someone else.”",
        "assembly",
        3,
        [
          flag("sourcePressured"),
          moral("control"),
          rel("mara", -3),
          msg(
            "Mara",
            "ellis ended the call. do not contact them again. i will find another way.",
          ),
        ],
        { approach: "reckless" },
      ),
    ],
  ),
  s(
    "assembly",
    "Put the pieces\nwhere they belong.",
    "velvet",
    "YOUR WORKING ACCOUNT",
    [
      p(
        "The service table is almost clear. You place the invitation beside the routing proof and the page that reused your signature. Three objects connected by a reference number. That connection is solid.",
      ),
      p(
        "The invitation’s 23:41 header was a delivery slot. It was printed earlier, before Inez disconnected the machine. The apparent impossibility was a misleading label, helped along by everybody’s appetite for a good story.",
      ),
      p(
        "The identity of the sender is also solid. The motive is an account given by someone with a reason to make their actions understandable. It can be sincere and incomplete at the same time.",
      ),
      p(
        "The witness saw the archive box move before the recorded custody transfer. That proves an inconsistency in the record. It does not prove who ordered it, and it does not make every entry in the ledger false.",
        { when: { fact: "witness" } },
      ),
      p(
        "You missed the live witness. The dated delivery photograph corroborates movement, but it cannot answer what someone carrying the box was told. This gap remains a gap.",
        { when: { not: { fact: "witness" } } },
      ),
      p(
        "Eleven names were removed years before tonight. You know the gaps are deliberate. You do not have the right, or enough evidence, to fill them by guessing.",
      ),
      p(
        "Luca offers to turn your account into a broadcast statement. Celeste offers to enter it in the minutes. Mara offers to make another pot of tea. Each offer would put a different frame around the same facts.",
      ),
      p(
        "You have spent enough of tonight being made into a role. Before deciding who holds the ledger, you can decide whether any of those frames should hold your account.",
      ),
      p(
        "A printer in the office starts up. An ordinary one, plugged in and doing its job. Nobody looks at it until you do. Then you all look faintly embarrassed for a different reason.",
      ),
    ],
    [
      c(
        "stand_account",
        "Put your alias on a formal objection.",
        "ledger",
        4,
        [
          flag("wroteAccount"),
          flag("publicObjector"),
          moral("honesty"),
          rel("celeste", 1),
          {
            type: "rumour",
            id: "named-objector",
            text: "The outside witness has become a named objector in the board record.",
            faction: "umbrella",
          },
        ],
        {
          when: { trait: "On the record" },
          hint: "Your consistent account is accepted quickly. Your alias becomes public.",
          approach: "honest",
        },
      ),
      c(
        "write_account",
        "Write a factual account, keeping witnesses anonymous.",
        "ledger",
        6,
        [
          flag("wroteAccount"),
          moral("honesty"),
          moral("protection"),
          know("header", "Compared delivery header with routing timestamp"),
        ],
        { approach: "honest" },
      ),
      c(
        "record_account",
        "Record a statement in your own words for the archive.",
        "ledger",
        5,
        [
          flag("recordedAccount"),
          moral("ambition"),
          rel("luca", 2),
          { type: "faction", id: "static", amount: 1 },
        ],
        { approach: "curious" },
      ),
      c(
        "private_account",
        "Keep your notes private for now.",
        "ledger",
        3,
        [flag("privateAccount"), pull("privacy"), moral("selfPreservation")],
        { approach: "guarded" },
      ),
    ],
  ),
];

// A boundary changed during a scene immediately replaces that whole optional encounter.
for (const [id, required] of [
  ["salon", ["powerExchange", "performance"]],
  ["reversal", ["powerExchange"]],
  ["listening", ["romance"]],
] as const) {
  const scene = additionalScenes.find((s) => s.id === id)!;
  scene.boundaryGate = {
    themes: [...required],
    summary:
      "You let the moment pass and return your attention to the rest of the night. Nothing about the invitation depends on staying here.",
    exit: "boundary_exit",
  };
  scene.choices.push(
    c("boundary_exit", "Return to the main room.", "floor", 0, [
      flag(id === "listening" ? "heardTrack" : "salonDone"),
    ]),
  );
}
