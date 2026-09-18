# FREAK // CITY — Corey’s scene-by-scene creator’s guide

**Full spoilers · companion to the [creator story bible](CREATOR-STORY-BIBLE.md) · 17 September 2026**

Use this as an editing map. The story bible supplies the flowing synopsis, objective truths, character dossiers and ending explanations. This guide accounts for every one of the **117 registered scenes** without reproducing every line or choice. The newer envelope-safekeeping situation and general flavour interactions are listed separately.

**Implemented** means the prose and rules exist. An **authored scene** can still have a weak or broken connection through the current text parser. **Documented plan** identifies design-only material; **Unresolved** identifies an undecided question or implementation/story mismatch; **New suggestion** identifies an opportunity proposed here. Dramatic-purpose descriptions are editorial readings of the existing material, not new world facts.

A **location** is somewhere the player can remain, move through and return to. A **scene** is a particular encounter or development which may happen there. A **flavour interaction** is a smaller response such as touching cold glass, watching a work routine or making a joke. It need not start a plot branch. The 117 scenes are not 117 rooms or 117 compulsory stops.

## Reading the map

The current world has 17 rooms: taxi, side-entrance street, vestibule, bar, cloakroom, washroom, kitchen, stage, salon, upstairs landing, office, exchange room, archive/service table, loading bay, kiosk, apartment and Motel 27. The scene called `register` is an Inez encounter, distinct from the physical forwarding-register evidence object. `archive` means a service-table scene/location here; the larger Static organisation is not a newly playable district.

The original authored progression goes from a first-impressions hub to competing deadlines, proof, a document decision and aftermath. Optional later relationships broaden that spine. The parser separates walking from conversation: a dialogue choice does not automatically transport the player to its next setting. Present speakers, current object custody, scene availability and theme boundaries still matter.

**Implemented — shared timing:** begin at 23:48; exchange at 00:20; Ruth departs at 00:26; service evidence becomes available from 00:27. Inez returns to the vestibule at 00:38. The side entrance locks at 02:40, with the front route retained. Celeste goes off duty at 02:20, Inez at 03:00, Luca at 03:10 and Mara at 03:30. Reading displayed prose and deciding what to type are untimed; submitted actions can advance time. Do not use old “reading never costs time” prose as a universal rule for the READ command.

**Unresolved — staging:** many original scenes presume a cast assembled in one broad “Velvet” location. The current parser filters absent named speakers, but surrounding narration can still describe them. The map also calls Mara’s kitchen repair a door closer while the scene describes a fan. These are presentation/content contradictions, not evidence of secret transfers or extra actors.

Sources: [physical rooms and scene mapping](../src/content/spaces.ts), [parser routing](../src/content/parser-content.ts), [current timing, presence and transactions](../src/engine/parser.ts), [initial events](../src/content/world.ts).

## A. Arrival and first impressions

### 1. The invitation meets the doorway

**Implemented — authored opening; current text entry differs.** Dramatic purpose: introduce an unsolicited role, then offer a first small choice about identity. Entry: a fresh night begins in the taxi; Inez’s first conversation is currently triggered in the vestibule. The present text opening shows the room description rather than automatically performing the entire taxi manuscript.

| Scene                                       | What happens and what the player can choose                                                                                                                               | Consequences and next connection                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `arrival` — An address. Not an explanation. | The driver waits for an answer; the unsigned invitation and unexpectedly saved address create unease. Confirm arrival, ask whether others came here, or circle the block. | The driver question produces the receipt/replacement-taxi warning; circling takes extra time and leads toward the service road. Normal progression reaches Inez. |
| `door` — A name you can afford to lose      | Inez handles an arrivals book and a failing paper bag. Admit ignorance, claim Luca sent you, or give only an alias.                                                       | The false Luca claim schedules an explicit report to him 25 minutes later. Honesty/privacy record different memories. Continue to the vestibule.                 |
| `vestibule` — Nothing here is quite private | Inez explains the right to refuse a full name. Mara and a failing door provide a less mysterious welcome. Choose the bar or cloakroom.                                    | Leads to ordinary hospitality and first impressions; the dialogue does not establish a consensual witness contract.                                              |

**Unresolved:** ordinary typed name replies fail; the prototype’s typed alias transaction is not wired into the main command conversation. The greeting can replay exterior taxi/umbrella staging indoors. The alias continuation describes an untracked wristband and people whose schedules may place them elsewhere. The saved-map name and replacement-taxi warning lack a developed payoff.

**New suggestion — humour/private voice/development:** let the player’s first private observation be about one specific failed practical object, then allow Inez’s literal answer to puncture the protagonist’s noir expectations. Keep the offered name genuinely answerable before adding another mystery prompt.

**Corey’s notes / requested additions**

Sources: [opening scenes](../src/content/scenes/opening.ts), [parser prose corrections](../src/content/parser-passages.ts), [current opening findings](TEXT-LED-TRANSITION.md).

### 2. A drink, a coat and a room full of alternatives

**Implemented — authored introduction hub.** Dramatic purpose: give the player a reason to enjoy being here and a choice about whom to approach. Entry: bar/cloakroom after arrival; the first visit to the bar delivers the two timed invitations.

| Scene                                  | What happens and what the player can choose                                                                     | Consequences and next connection                                                                                                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bar` — Something ordinary             | Mara offers tea, questionable coffee or water, talks about the failed fan and asks what the player wants.       | The drink and manner of reply become memories and later messages. Leads to the main-room hub.                                                                                                                                                                        |
| `coat` — Choose your armour            | Choose raincoat, borrowed formal jacket or rolled sleeves. The cloakroom bell says PLEASE DON’T.                | Clothing establishes impressions; formal dress marks access in the authored structure. The physical jacket still has custody and wear rules. Return to the bar.                                                                                                      |
| `floor` — Everybody came for something | Approach Mara, Celeste, Luca or Inez; withdraw to the washroom; consider salon/music scenes; choose a deadline. | Each early thread costs time. Original hub flags restrict repeated introductions. The salon option requires the relevant allowed themes and an early visit; the direct role-reversal option also requires learned negotiated-authority interest and Celeste’s trust. |

**Unresolved:** the drink choices exist, but reasonable text such as “say tea please to Mara” can fail. The broad hub describes several people together while the physical map separates them. Clothes must not silently grant permission, custody or knowledge.

**New suggestion — humour/private voice/development:** use the two pencils, awful coffee and overconfident outfit as recurring jokes whose meanings change with familiarity. Let an ordinary drink answer finish a satisfying exchange before the plot interrupts.

**Corey’s notes / requested additions**

Source: [opening scenes](../src/content/scenes/opening.ts).

## B. Early character threads and optional encounters

### 3. Mara: the names, the fan and the chair

**Implemented.** Dramatic purpose: attach the ledger’s danger to a person, then allow non-investigative company. Entry: approach present Mara about the invitation; the kitchen/quiet beats follow the authored conversation and require appropriate local access.

| Scene                              | What happens and what the player can choose                                                                                                          | Consequences and next connection                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `mara` — The names are the problem | Mara explains tenant exposure. Promise protection, reserve judgment until seeing evidence, or ask what helping pays.                                 | Protection is a remembered promise; mercenary wording damages trust and returns to the hub. The other approaches open the kitchen beat. |
| `kitchen` — Salt. No revelation.   | Chips, a missing screw and an ordinary neighbour story. Help hold the fan casing or leave her a quiet minute.                                        | Helping records the repaired fan and shared food. That repair plus sufficient trust later permits the hidden-history scene.             |
| `quiet` — A seat left open         | Mara offers company and asks about using the alias; a sofa advert spoils her dramatic moment. Ask to sit together later, choose friendship or leave. | Optional affinity/private attention or ordinary trust. None is required for the mystery. Return to the hub.                             |

**New suggestion — humour/private voice/development:** preserve the fan as genuinely mundane. A later hum can recall kindness without becoming a clue; let the player enjoy the interruption without narrating that they must be attracted.

**Corey’s notes / requested additions**

Source: [encounters](../src/content/scenes/encounters.ts).

### 4. Celeste: terms, access and a missing page

**Implemented.** Dramatic purpose: turn the invitation into an institutional problem with a human representative. Entry: meet Celeste near the stairs while present; following the discussion can open the terms scene.

| Scene                                       | What happens and what the player can choose                                                                                                                                           | Consequences and next connection                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `celeste` — Terms of entry                  | She calls the player an independent witness and offers upstairs access. Ask for terms, take a pass or reject the role.                                                                | Witness acceptance/refusal and trust are recorded. Access is not proof the original invitation was valid.                     |
| `terms` — The small print is still a choice | An old delivery signature has been stretched into continuing authorization; the referenced clause is missing. Annotate “Presence is not consent,” sign an alias, or put down the pen. | Signature knowledge and different witness-status memories; a pass can be acquired. Return toward the hub and deadline choice. |

**Unresolved:** the exact missing clause and who reused it are not exposed later. Celeste’s initial knowledge does not include every fact her scene card’s generic disclosure list suggests; rely on actual passages and rules.

**New suggestion — humour/private voice/development:** use her precise correction of an absurdly ordinary inconvenience before the terms become threatening. Make the specific obligation legible enough for the player to have a real objection.

**Corey’s notes / requested additions**

Source: [encounters](../src/content/scenes/encounters.ts).

### 5. Luca: publication, misunderstanding and music

**Implemented.** Dramatic purpose: make the archive’s advocate likable while showing that good publicity can injure private people. Entry: present Luca at the stage or his scheduled location; the authored listening branch follows meeting him and is optional under romance boundaries.

| Scene                                           | What happens and what the player can choose                                                                                                                         | Consequences and next connection                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `luca` — No signal. Plenty to say.              | A socket defeats him; he introduces the archive and departing witness. Ask about the box, express sympathy or refuse to be a source.                                | Sympathy can become his false belief that publication was agreed. A more direct inquiry supplies a matchbook/contact detail.           |
| `radio` — Everybody’s archive. Somebody’s name. | Blurring names may still leave identifying dates. Require consent, promise publication or reserve judgment until hearing Ruth.                                      | Corrects or strengthens expectations; explicit promises remain distinct from an inferred agreement. Return to the hub.                 |
| `listening` — One shared track                  | Shared listening gives him a chance to stop interpreting. The microwave appears in the credits as percussion. Ask for the track, joke about royalties or thank him. | A remembered exchange and possible delayed track message. The scene has a neutral boundary exit and is not evidence-gated progression. |

**New suggestion — humour/private voice/development:** let a joke genuinely fail once, without the narrator immediately turning it into a lesson. The silence can distinguish embarrassment from danger and give a sincere line somewhere to land.

**Corey’s notes / requested additions**

Sources: [encounters](../src/content/scenes/encounters.ts), [listening](../src/content/scenes/additional.ts).

### 6. Inez: signature, register and an optional practical promise

**Implemented.** Dramatic purpose: demystify the machine while making access to records a question of discretion. Entry: present Inez and her invitation conversation. The newer safekeeping situation is separate from these manuscript scenes.

| Scene or situation                                                                | What happens and what the player can choose                                                                                                                              | Consequences and next connection                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inez` — Paper remembers the wrong things                                         | Inez explains the printer disconnection and reused signature while working on a light. Ask for help, accuse her of withholding information or leave.                     | Header/signature disclosures; the first two approaches continue to the register.                                                                                                                                                      |
| `register` — The price of an ordinary favour                                      | A bag exposes the apartment entry under another person’s name. Return it, photograph it or ask for a covered-name copy.                                                  | Trust/discretion, a signature source and a lead to Ruth. The name need not be the invitation sender.                                                                                                                                  |
| Envelope safekeeping — **separate local situation, not one of the 117 scene IDs** | Ask Inez to watch the closed black envelope on the dry ledge. Review terms; accept, refuse, negotiate an earlier deadline, request one acknowledged extension or cancel. | The existing envelope changes custody only through the action. Current shift limits are before 00:15 or, after her return, before 03:00. Collection, missed time, claims, observations and repair remain distinct and survive reload. |

**Unresolved:** the bulb scene supplies an uncommanded handover and player answers. The paper-bag topic still receives a generic rejection through a reasonable typed question. Do not treat safekeeping as permission to read the envelope or romantic interest.

**New suggestion — humour/private voice/development:** make a returned paper bag or missed small promise emotionally legible before extending the story’s promise system. Inez can be funny, irritated and forgiving without becoming a dispenser of wisdom.

**Corey’s notes / requested additions**

Sources: [encounters](../src/content/scenes/encounters.ts), [safekeeping scope](design/INEZ-ENVELOPE-IMPLEMENTATION.md), [authored situation wording](../src/content/commitments/inez-envelope.ts).

### 7. The washroom: a funny room with somebody else’s problem inside it

**Implemented — authored optional encounter; local person support unresolved.** Dramatic purpose: turn overhearing into a choice about an allegation’s owner. Entry: the washroom visit triggers the first beat; staying to hear more leads to the second.

| Scene                              | What happens and what the player can choose                                                                                                                                                            | Consequences and next connection                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `washroom` — Out of order. Mostly. | A man dries a sock; the mirror offers contradictory advice; two voices discuss relief money and membership. Stay or leave the conversation private.                                                    | Staying opens an ethical encounter, not proof of fraud.                                                                                                               |
| `overhear` — A story you don’t own | A guest with a hospital parking ticket asks that her name not be repeated. Another person offers an accounting explanation. Protect her, share the named allegation or report the concern anonymously. | Named sharing creates an explicitly unverified rumour and a guest leaves the group. Protection/anonymisation changes the later mirror’s resonance. Return to the hub. |

**Unresolved:** the man is not a local actor; `speak to man` selects absent Luca. Automatic handwashing and silent mutual agreement also overstate player actions. The allegation’s truth is not decided by overhearing it.

**New suggestion — humour/private voice/development:** keep the sock joke as a real comic encounter, with a bounded response if addressed. Let the mood change when the frightened guest speaks, instead of explaining the moral in advance.

**Corey’s notes / requested additions**

Source: [encounters](../src/content/scenes/encounters.ts).

### 8. The street and kiosk: other people’s clocks

**Implemented — authored optional scene pair.** Dramatic purpose: show the external movement of the archive and make the bus deadline concrete. Entry: the street thread or circling the block; the original kiosk branch is limited by its completed-visit flag.

| Scene                                | What happens and what the player can choose                                                                                                                               | Consequences and next connection                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `street` — The city without you      | A trolley and box move behind Velvet. A clock and bus provide context. Return to the side door, visit the kiosk or choose a deadline.                                     | Original choices grant a photograph and record seeing the trolley. Current parser photography requires an explicit supported action. A photo alone does not prove custody. |
| `kiosk` — The last thing on the menu | Only soup remains; vendor and driver repeat an old argument. Inez’s abandoned soup and the bus reminder put a human cost on waiting. Finish the soup or leave it for her. | Small care/trust changes and time spent before the deadline choice. No soup choice solves the mystery.                                                                     |

**Unresolved:** original choices sometimes grant a photograph or an NPC memory without matching the newly edited prose’s action/observation. Preserve the scene’s small scale while reconciling those effects.

**New suggestion — humour/private voice/development:** the crossed-out menu can be funny first and useful second. Avoid making the vendor an all-knowing guide; the one thing they know is when the bus leaves.

**Corey’s notes / requested additions**

Source: [encounters](../src/content/scenes/encounters.ts).

### 9. The salon and private introduction

**Implemented — optional adult-cultural scenes.** Dramatic purpose: show negotiated participation actually working, providing a contrast to the institutional misuse of consent. Entry: the early hub’s salon branch requires allowed power exchange/performance; the token request needs Celeste’s trust of at least 2. An alternate authored entry uses learned negotiated-authority interest of at least 2 and the same trust floor. Both remain optional. In the physical parser, a normal first salon scene also depends on Celeste being present; that connection needs a route review.

| Scene                                      | What happens and what the player can choose                                                                                                                                         | Consequences and next connection                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `salon` — The right to turn it over        | Adults exchange introduction tokens; someone refuses an embarrassing introduction and is heard. Watch, ask Celeste for the token, or leave.                                         | Observational/participatory interests and trust; joining leads to reversal, leaving returns to the main room. Boundary skip gives a neutral exit. |
| `reversal` — An introduction on your terms | Celeste permits an introduction based on observation, without invented history; either may stop. Describe her as a person, name an exception, or admit not knowing her well enough. | Distinct personal/authority memories and possible affinity. No disclosure of sender identity. Return to the hub.                                  |

**New suggestion — humour/private voice/development:** keep the casserole-dish introduction. Develop a specific pleasure or awkwardness in the agreed role change, rather than making the scene only an explanation of house rules. Any added kink specificity is a new authorial decision.

**Corey’s notes / requested additions**

Source: [additional scenes](../src/content/scenes/additional.ts).

## C. The deadline fork and the central revelations

### 10. Official exchange, live witness, or neither

**Implemented.** Dramatic purpose: make time and attention consequential without making a missed event a failed game. The original choice fork locks the alternative scene. The current parser instead uses where the player is when scheduled events happen: attend the exchange at 00:20, or reach the bay during the live witness window from 00:21 until before 00:26 without having attended the exchange.

| Scene                                        | What happens and what the player can choose                                                                                                                                     | Consequences and next connection                                                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decision` — You cannot be in both places    | Choose upstairs before the exchange, the bay before departure, neither, or one more early conversation.                                                                         | Authored attendance has time commitments and mutual exclusion. Refused witness status blocks the original upstairs choice. The physical map does not use that choice as its sole access rule. |
| `exchange` — Your presence has been recorded | A board representative and Celeste formalise a transfer; the attached authorization includes the apartment. Question the signature, watch custody or leave a written objection. | Signature/tenant-risk evidence and witnessed conduct; continue to objection or aftermath.                                                                                                     |
| `objection` — Say it while they’re listening | Celeste discloses the board duplicate. Challenge legitimacy, request water and write, bargain for a copy or leave.                                                              | The direct challenge needs composure 55; written objection remains available below that. Records an objection, board challenge/deal or departure.                                             |
| `bay` — Someone has a bus to catch           | Ruth shows the 00:19 docket against the 00:20 account. Promise anonymity, insist on a named source or retain only dates/stamps.                                                 | Live witness/signature facts; different trust and privacy consequences. Leads to the bus.                                                                                                     |
| `bus` — A small, non-symbolic kindness       | Ruth lacks her travel card. Pay, seek a deferred fare or keep your own fare.                                                                                                    | Specific kindness and practical cost, without a new revelation. Leads to aftermath.                                                                                                           |
| `missed` — An empty chair is still an answer | Both events proceed. The absence becomes a public account; an envelope still awaits collection.                                                                                 | A fallback path continues to aftermath. Loss of the live witness remains real.                                                                                                                |

**Unresolved:** “who transferred what to whom” needs a firmer answer. Ruth’s docket proves the recorded order wrong, not an identified conspiracy. The guide does not infer one.

**New suggestion — humour/private voice/development:** retain the wrong-height chair and pocket searched twice. Give Ruth one ordinary desire beyond evidence, then honour her departure. Humour can make institutional pressure more believable without dissolving it.

**Corey’s notes / requested additions**

Sources: [encounters](../src/content/scenes/encounters.ts), [scheduler and parser entry](../src/engine/parser.ts), [scheduled consequences](../src/engine/game.ts).

### 11. Public versions and a private correction

**Implemented — authored aftermath, with parser connections requiring attention.** Dramatic purpose: show descriptions circulating independently of the player and let a specific lie return to its subject. Entry: either event or the missed-events route. The current service evidence delivery also proceeds independently from 00:27.

| Scene                                                  | What happens and what the player can choose                                                                                                             | Consequences and next connection                                                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aftermath` — The first version is already circulating | A rumour claims the player chose a side. Mara places the service envelope within reach. Examine it, read outside, ask for a quieter place or face Luca. | Hidden scene requires repaired fan and Mara trust 5. The Luca branch requires the earlier lie and the authored time gate; his actual report has its own delivery history. |
| `contradiction` — A borrowed name comes back           | Luca says Inez reported the claimed invitation. Admit the excuse, double down or refuse discussion.                                                     | Apology records the original lie rather than erasing it. Doubling down raises suspicion. Continue to confession or archive.                                               |
| `confession` — Repair isn’t erasure                    | Luca accepts that the lie was a door excuse and chooses to help with one specific thing.                                                                | A small repair and access toward the routing envelope; not instant complete forgiveness.                                                                                  |

**New suggestion — humour/private voice/development:** let Luca consider a joke and abandon it. Give the corrected story a later modest callback, so an apology changes behavior as well as a score.

**Corey’s notes / requested additions**

Source: [consequences](../src/content/scenes/consequences.ts).

### 12. The cut pages, proof and sender

**Implemented.** Dramatic purpose: answer the invitation question firmly while leaving accountability open. Entry: service-table evidence after 00:27. The current parser requires opening the visible routing envelope and reading its actual seeded proof; a bare scene name cannot authenticate hidden evidence.

| Scene                                       | What happens and what the player can choose                                                                                                                              | Consequences and next connection                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `archive` — An original with missing pieces | Examine obligations, eleven old cuts and the routing reference. Open the routing envelope or ask first.                                                                  | Missing-name context and a route to proof. In the text parser, merely walking into the archive room does not guarantee this full scene plays.                   |
| `hidden` — Eleven empty lines               | Mara explains why the old group removed names, including two people not asked. Hear the difficulty or ask who can check the totals.                                      | Requires the earlier fan repair and trust through the authored route. Records seeing the hidden history; does not reveal the eleven identities. Leads to proof. |
| `proof` — The invitation has a sender       | The matching carbon/token/register identifies Mara/Celeste/Inez respectively and establishes the unauthorized signature link. Confront the sender or keep proof private. | Verified sender and matching evidence; reading is distinct from showing it to another person. Continue toward sender/casework.                                  |
| `sender` — You could have asked             | The relevant sender gives a branch-specific account and admits responsibility. Demand future permission, assert a debt or defer the reckoning.                           | A boundary, debt claim or distance; does not change the sender or settle custody. Leads to casework.                                                            |

**Unresolved:** the text parser can suggest checking routing evidence but reject “where is the routing record?” Shared confrontation prose also needs to follow the actual speaker/location rather than imply everyone is available.

**New suggestion — humour/private voice/development:** give the proof its full serious beat. A later ordinary printer noise can release the tension; it need not immediately undercut the admission.

**Corey’s notes / requested additions**

Sources: [consequences](../src/content/scenes/consequences.ts), [physical proof](../src/content/spaces.ts), [reading and conversation rules](../src/engine/parser.ts).

### 13. Three further investigations and one person’s right to refuse

**Implemented — authored optional casework.** Dramatic purpose: deepen the sender’s motivation without changing the answer, and distinguish a usable record from entitlement to testimony. Entry: authenticated proof; a seed-appropriate follow-up or the authored casework scene. The original phone framing of the Dead Letter branch is not the same as the parser’s ordinary CALL handler.

| Scene                                         | What happens and what the player can choose                                                                                                     | Consequences and next connection                                                                                                                                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `casework` — Knowing who is a beginning       | Decide whether to investigate the sender’s incomplete account or proceed to custody.                                                            | Opens only the appropriate version’s case; skipping records enough evidence to decide.                                                                                                                                                              |
| `carbon_case` — The person she didn’t ask     | Mara admits the concealed historical carbon; Luca’s published gaps exposed two identities. Let her tell him, disclose it yourself or stay out.  | Different legitimate sources for Luca’s new belief; trust/strain, or unresolved history. Continue to source call or assembly.                                                                                                                       |
| `proxy_case` — A witness with a casting vote  | Celeste shows the unsigned proxy page. Refuse, accept only for an independent audit, or retain the option unsigned.                             | Refusal/audit/open-option records. The audit request is entered; there is no enacted next-week audit. Continue to source call or assembly.                                                                                                          |
| `letter_case` — The person before you         | Inez explains the former tenant’s departure after a forwarding list was abused. Request permitted contact, demand a number or leave them alone. | Permission request leads to a delayed offer of a written account, not a call. Demanding contact gets refusal. Continue to source call or assembly.                                                                                                  |
| `source_call` — Someone says no               | Ellis declines public use of their account. Respect the refusal, ask once about a sealed statement, or pressure them.                           | A sealed statement is restricted to an independent reviewer; pressure ends contact and harms trust. A confidence trait opens another authored sealed-custody approach. Ellis is a separate supporting person, not established as the former tenant. |
| `assembly` — Put the pieces where they belong | Review solid evidence and remaining gaps. Make a named objection, write anonymously, record for the archive or keep notes private.              | The named formal approach requires the “On the record” trait. Other approaches remain. Leads to the ledger decision.                                                                                                                                |

**Unresolved:** the requested former-tenant written account is announced but not supplied as a developed new testimony scene. The sealed account is principally a flag/message permission, not a fully realised evidence document to inspect. Do not treat either as a secret answer to all missing questions.

**New suggestion — humour/private voice/development:** give the weather forecast and embarrassed glance at a perfectly ordinary printer space to breathe. An honest gap in evidence can finish a scene; it need not immediately reveal another secret.

**Corey’s notes / requested additions**

Source: [additional scenes](../src/content/scenes/additional.ts).

## D. Time with people, not just sources

### 14. The shared bridge into longer relationships

**Implemented — five authored shared beats.** Dramatic purpose: turn “the people affected” into people the player knows before deciding the ledger’s fate. Entry: the ledger’s optional “spend time” bridge before the expansion has begun, or the parser’s later company topics. The parser allows company starts from 00:27, tracks at most two full leads, and requires presence. The designed seven-beat first visit / six-beat return structure is subject to real departures; it is not permission to summon the cast.

| Scene                                             | What happens and what the player can choose                                                                          | Consequences and next connection                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `late_room` — The room after the rush             | Choose a first companion among the four.                                                                             | Starts the expansion and marks the first lead. No romance requirement.                                                                                                      |
| `late_second` — Time belongs to someone else, too | Choose one unchosen second lead or return to the document.                                                           | At most two deep arcs; one is allowed. The others remain partly unknown.                                                                                                    |
| `late_table` — The last ordinary table            | Staff divide remaining food and almost collide over a spoon. Help clear or eat quietly.                              | Restores composure; schedules unchosen people’s ordinary plans and supplies the front-door notice.                                                                          |
| `late_accounts` — What company does not settle    | Recognise that liking someone changes the stakes, not the facts. Decide, or explore the rare staffing overlap.       | Returns to the ledger; optional overlap has precise prerequisites.                                                                                                          |
| `crossed_shift` — The same small pool of hours    | Mara and Inez compare staffing-budget policy without sharing confidences. Leave their joint question in their hands. | Requires both first arcs completed, emergency leave sought for Sera and the unfair Tom claim challenged. Builds their mutual trust; the budget answer remains for tomorrow. |

**Unresolved:** a default first company conversation can occur before Inez’s 00:38 return, and long paired conversations can run into closing schedules. The prose’s shared table assumes more simultaneous presence than the room model guarantees.

**New suggestion — humour/private voice/development:** keep the food-ownership joke and almost-collision; resist making every connection reveal a conspiracy. Let deciding whom not to know tonight feel like a real artistic choice, not a completion checklist.

**Corey’s notes / requested additions**

Sources: [shared relationship scenes](../src/content/relationships/shared.ts), [registry bridges](../src/content/scenes.ts), [parser company rules](../src/engine/parser.ts).

### 15. Mara’s longer arc — from useful company to asking what help means

**Implemented — thirteen authored beats.** Entry: select Mara or ask a compatible company topic while she is present and the later phase is available. Beats 1–7 form the first visit; 8–13 require that visit completed and a document outcome. The mapped relationship setting is the kitchen, although prose ranges across bar and doorway. Return after intervening events rather than assuming she waited unchanged.

| Scene                                         | What happens and meaningful choice                                                                                                                                                            | Consequence / dramatic connection                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `mara_r1` — The things that need doing        | Count glasses using her system or propose improvements prematurely.                                                                                                                           | Records how the player works with her; asks whether helping can respect expertise.                               |
| `mara_r2` — A completely unnecessary argument | Crisps spill; a brush has an inexplicable hiding place. Choose vinegar, salt or company without food.                                                                                         | Stores an ordinary snack preference for later, without making it evidence.                                       |
| `mara_r3` — The space between shifts          | Her lamp and tiny flat lead to a question about home. Describe the fridge, mug or a private boundary.                                                                                         | A specific remembered detail can return at home.                                                                 |
| `mara_r4` — Help can arrive badly             | She assumes the player intends to supervise a repair. Explain, push back or offer to take over.                                                                                               | Establishes her belief about the player’s help and the conflict to revisit.                                      |
| `mara_r5` — Someone gets the late shift       | Sera’s emergency absence conflicts with a cleaner’s accurate hours. Leave the false hours, ask for emergency leave with minimal disclosure, or correct the record and address pay separately. | Delayed consequences expose the cost of each option; none makes both privacy and fairness effortless.            |
| `mara_r6` — Without a useful excuse           | She says the player need not find jobs to stay. Admit personal interest, welcome friendship or ask for space.                                                                                 | Affinity or trust and a remembered intention; romance is optional.                                               |
| `mara_r7` — A break with an actual end        | She offers a later ten-minute break. Return to the room or take a quiet pause.                                                                                                                | Marks the first visit complete; a later phone invitation and independent break plans can follow.                 |
| `mara_r8` — The counter after midnight        | Return to a changed shift and Mara’s own note on the timesheet. Ask what happened or let her begin.                                                                                           | Establishes return as attention to reality, rather than asking whether the player’s advice won.                  |
| `mara_r9` — The right kind of ordinary        | The snack and domestic complaint return. Accept without a speech or ask whether she can let others finish work.                                                                               | Shows memory and the possibility of unproductive rest.                                                           |
| `mara_r10` — An argument with a history       | Luca’s wrong drawer and correct replacement fuses expose their old conflict. Leave their repair alone or interpret it for her.                                                                | Different trust/mediation impressions; no complete reconciliation is awarded.                                    |
| `mara_r11` — The choice that came back        | Discuss the ledger’s cost to people who must answer tomorrow’s calls. Own the cost or insist her preferred choice also had costs.                                                             | Publication can damage trust; agreeing to disagree does not require approval.                                    |
| `mara_r12` — Ask what she means               | Revisit the unwanted-help assumption. Agree to ask, bound the player’s availability or choose distance.                                                                                       | Records repaired, bounded or distant relationship.                                                               |
| `mara_r13` — Not another shift                | A tentative breakfast possibility, timetable and coat provide a goodbye. End or thank her.                                                                                                    | Marks closure; repaired relations can produce a later goodnight. No breakfast appointment is automatically made. |

**Unresolved:** some shared chores and replies are asserted before player action; the breakfast invitation’s tone needs to respect the selected distance outcome. NPC-pair narration must respect Luca’s actual presence.

**New suggestion — humour/private voice/development:** vary Mara’s pace. Let one domestic story ramble because she enjoys telling it, and let a snack simply be good. A later adult scene should arise from mutually wanted company, not as a reward for doing enough labour.

**Corey’s notes / requested additions**

Sources: [Mara arc](../src/content/relationships/mara.ts), [phone](../src/content/phone.ts), [parser adaptations](../src/content/parser-passages.ts).

### 16. Celeste’s longer arc — attention without buying the answer

**Implemented — thirteen authored beats.** Entry and first/return requirements follow the shared rules above. The mapped relationship room is the office. Her 02:20 departure particularly constrains long routes.

| Scene                                               | What happens and meaningful choice                                                                                                  | Consequence / dramatic connection                                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `celeste_r1` — A screw no bigger than a seed        | Lost glasses screw defeats the proprietor. Hold the arm or laugh when invited and find better light.                                | A practical memory without performative rescue.                                                                                         |
| `celeste_r2` — Dinner has been here for hours       | Cold sandwich, pickle and an unhelpfully persuasive note to herself. Recommend soup, trust toast or decline food.                   | Stores taste/company memories rather than status.                                                                                       |
| `celeste_r3` — The programme with the bad wallpaper | Her sister, television and a wallpaper-stealing dog resist symbolic interpretation. Ask about the dog or admit looking for motives. | A mundane callback or an acknowledged interpretive habit.                                                                               |
| `celeste_r4` — What the clothes suggested           | She admits misreading presentation as preparation. Correct her, admit enjoying overestimation or remain private.                    | Changes her first-impression belief from a sourced player answer.                                                                       |
| `celeste_r5` — Relief for one person                | Noor wants relief. Recommend closure/refunds, Celeste covering, or asking another worker with a real refusal.                       | A delayed result: refunds, family disappointment, or a colleague declining and Celeste covering anyway.                                 |
| `celeste_r6` — A seat held open                     | Ten minutes of chosen company. Ask whether it is personal, agree a bounded ritual of putting work aside, or keep it professional.   | Records personal attention, negotiated ritual or professional direction.                                                                |
| `celeste_r7` — Someone else gets a turn             | Her sister’s call interrupts. Return to the room.                                                                                   | Completes the first visit and schedules an invitation; she has a life beyond this attention.                                            |
| `celeste_r8` — The refunds have names               | Return to her dealing with real complaints. Ask how she is or whether the advice helped.                                            | Shows the cost of her decision; the refund staging currently needs branching for non-closure choices.                                   |
| `celeste_r9` — The favour with a receipt            | Luca disputes the meaning of repair funding while keeping the amount private. Respect that boundary or name unpriced pressure.      | Neither generosity nor independence is automatically disproved.                                                                         |
| `celeste_r10` — A useful thing to refuse            | A licensed car home is offered without further obligation. Accept or prefer the walk.                                               | Records a practical ride or a respected refusal; it does not buy intimacy.                                                              |
| `celeste_r11` — After the paper has moved           | Discuss the ledger decision separately from liking each other. Own the cost or ask what she will answer for.                        | Publication may harm trust; responsibility remains distinct from affection.                                                             |
| `celeste_r12` — The answer belongs to her           | Explicitly express attraction, uncertainty or a wish for honest professional contact.                                               | Reciprocated attraction needs trust 7, earlier personal attention and no professional-route flag; otherwise she gives a bounded answer. |
| `celeste_r13` — One promise small enough to keep    | She writes a concrete staffing follow-up for tomorrow; family and ordinary preferences return.                                      | Closure and delayed dog/toast callbacks. The actual next-day meeting is not written.                                                    |

**Unresolved:** the fixed refund return and some generic narration about mutual interest can overstate the chosen path. Refusing or choosing professional company should remain a complete relationship result.

**New suggestion — humour/private voice/development:** allow her to be delighted by a trivial thing she cannot justify efficiently. If expanding power exchange, decide what she personally enjoys about negotiated control; do not equate her job with a predetermined erotic role.

**Corey’s notes / requested additions**

Sources: [Celeste arc](../src/content/relationships/celeste.ts), [registry additions](../src/content/scenes.ts).

### 17. Luca’s longer arc — a warm conversation is not a booking

**Implemented — thirteen authored beats.** Shared first/return requirements apply; the mapped setting is the stage. A full first visit supplies the specific later correction story, separate from his earlier misunderstanding about publishing.

| Scene                                               | What happens and meaningful choice                                                                                                                                | Consequence / dramatic connection                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `luca_r1` — The wrong end of the cable              | Find the adapter beneath his seat. Hold the light or tease geometry.                                                                                              | Establishes patient company and a comic memory.                                                                        |
| `luca_r2` — What you actually ordered               | Duplicate sandwiches and a corrected assumption. Choose coriander, plain or no food.                                                                              | A precise preference replaces his guess.                                                                               |
| `luca_r3` — Music for getting home                  | Discuss a playlist without demanding its absent person’s history. Choose familiar, new or silence.                                                                | Later recommendation respects the actual answer, including quiet.                                                      |
| `luca_r4` — A smaller version of your sentence      | Someone thanks the player for tomorrow’s help, never agreed. Demand correction now, ask for a private written correction later or let it stand without promising. | Records his mistaken availability account and how it is challenged.                                                    |
| `luca_r5` — Who paid for the tools                  | Celeste’s repair gift complicates his complaint. Disclose terms without amount, seek a joint account or delay until repayment.                                    | Later messages show scrutiny, awkwardness or a maintenance worker paying for the delay.                                |
| `luca_r6` — From this side of the room              | Choose to watch a small performance, enjoy private attention or rest quietly.                                                                                     | Observer/attention memories and optional affinity; no compulsory participation.                                        |
| `luca_r7` — A message can wait                      | He asks to message after returning equipment. Leave for another conversation.                                                                                     | Completes the first visit; messages and key-labelling plans continue without the player.                               |
| `luca_r8` — He was doing something else             | Return to labelled keys, including UNKNOWN. Ask about ordinary work or funding.                                                                                   | Shows a person doing something meaningful outside the player’s view; a voice note is text, not recorded audio.         |
| `luca_r9` — The account and the person              | Discuss the document choice. Hear his hardest cost or explain the player’s cost too.                                                                              | Bargaining with Celeste can reduce his trust; neither person must claim universal approval.                            |
| `luca_r10` — The correction needs a subject         | His inaccurate commitment reaches another audience. Require “I misunderstood,” permit limited accurate wording or correct it personally.                          | Different correction ownership; the plain admission can produce a delayed inconvenient response.                       |
| `luca_r11` — No joke at the end                     | He admits making being liked more urgent than accuracy. Accept with a limit or request distance.                                                                  | Records repair or distance without erasing the mistake.                                                                |
| `luca_r12` — Company with an ending                 | His father’s call limits a walk to the corner. Ask for a date, accept the brief walk or go alone.                                                                 | Date acceptance needs trust 6, prior attention, accepted repair and no distance flag. Friendship is not a failed date. |
| `luca_r13` — A recommendation without an assignment | A second adapter makes the initial search absurd. Finish the goodbye.                                                                                             | Stores closure, respects the music preference and lets his father have his attention.                                  |

**Unresolved:** if the initial mistaken commitment was corrected in front of the player, the later audience should have a clear reason still to misunderstand. Some prose assumes the player helps before asking; preserve the character’s improvement without performing consent on the player’s behalf.

**New suggestion — humour/private voice/development:** distinguish his genuinely funny improvisation from the jokes he uses to escape accountability. Let a potential date contain an actual shared interest as well as a successfully repaired error.

**Corey’s notes / requested additions**

Source: [Luca arc](../src/content/relationships/luca.ts).

### 18. Inez’s longer arc — caring is not endless availability

**Implemented — thirteen non-romantic authored beats.** Shared first/return requirements apply; the mapped setting is the vestibule. First availability on her returned shift begins at 00:38. Her fixed 03:00 departure and the text’s “one more hour” require reconciliation for long routes.

| Scene                                            | What happens and meaningful choice                                                                                                          | Consequence / dramatic connection                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `inez_r1` — Back for one more hour               | She returned from her sister’s to cover a colleague. Choose ordinary conversation or shared quiet.                                          | Establishes a paid worker with mixed motives, not a saint available forever.                                   |
| `inez_r2` — The missing blue mitten              | Lost property and mismatched gloves. Put the adult mitten somewhere visible or label a clear bag accurately.                                | A small practical memory; the actual mitten placement should follow custody rules.                             |
| `inez_r3` — What plays between calls             | Failed-recipe radio and a caller’s secret egg substitute. Share a preference for voices, music or eventual quiet.                           | An ordinary home-sound memory and possible later programme recommendation.                                     |
| `inez_r4` — The colour she remembered            | A grey/red trolley recollection proves wrong. Value the visible correction or admit treating her as infallible.                             | A sourced belief about accuracy; not proof that her entire mystery account is false.                           |
| `inez_r5` — Whose explanation is it to give?     | Tom’s cover is misdescribed as unreliability. Challenge using only arranged cover, ask Tom what may be shared or wait.                      | Tone criticism, a limited disclosure permission, or an unfair account spreading while privacy stays intact.    |
| `inez_r6` — A lift is also a conversation        | She accepts her sister’s lift with a limit on discussing work. Share difficulty accepting help or keep it private.                          | Personal familiarity without compulsory disclosure.                                                            |
| `inez_r7` — The end of the extra hour            | She offers a closing lost-property check with an alternative handover if absent. Leave for another conversation.                            | Completes the first visit and offers a later phone check-in; no obligation to wait for her.                    |
| `inez_r8` — She has already answered             | Return after she handled the staff issue. Ask how it felt or help finish the ordinary handover.                                             | Advice becomes her own action and consequence; the “wait” branch needs appropriately different return wording. |
| `inez_r9` — It belonged to the wrong hand        | The mitten was claimed; the book and charger have different fates. Share only the outline of other company or keep to objects.              | Rewards ordinary continuity and discretion without demanding other people’s confidences.                       |
| `inez_r10` — An old argument changes hands       | Celeste judges the thread before reading it; Inez challenges unequal flexibility. Give privacy or support checking first without mediating. | Can improve their mutual trust; no guest solves their whole employment relationship.                           |
| `inez_r11` — Concern can become an instruction   | Her route questions feel supervisory. Welcome concern with a limit, accept one check-in or keep travel private.                             | Records the chosen departure boundary.                                                                         |
| `inez_r12` — An apology that leaves you standing | She apologises and introduces the player to her sister by chosen name, not role. Accept while retaining any limit.                          | Repair without demanding reassurance or family membership.                                                     |
| `inez_r13` — A number for ordinary things        | A public desk contact and recipe programme can sustain ordinary future contact. Finish the goodbye.                                         | Closure; an invited check-in and appropriate radio callback can arrive later. Inez leaves.                     |

**Unresolved:** scene prose can imply a substantive reply to the staff thread even when the player advised waiting; sister/cup staging also needs current presence/custody. The public-desk emphasis coexists with earlier personal-number/Motel access and should be intentional.

**New suggestion — humour/private voice/development:** let her be mildly silly about a practical mystery, and let the player see her enjoy her sister’s company. Protect the story’s substantial non-romantic intimacy instead of adding a romance route by default.

**Corey’s notes / requested additions**

Source: [Inez arc](../src/content/relationships/inez.ts).

## E. Climax, return and endings

### 19. The four custody decisions

**Implemented — current parser outcomes verified.** Dramatic purpose: make the player act on information that can harm and help at once. Entry: the held original; authentication is required for release/redaction/bargain, but not withholding. Present Luca/Celeste are required for their respective handovers. See the [bible’s exact ending conditions](CREATOR-STORY-BIBLE.md#5-endings).

| Scene                                         | What happens and meaningful choice                                                                                       | Consequences and next connection                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger` — What does the truth cost?          | Review four custody options, with reminders of promises and Luca’s assumptions. Optionally spend time with people first. | The document decision, not the preferred companion, selects the named ending.                                                            |
| `redact` — Eleven lines become a method       | Make copies that do not reveal names under light; dates may also identify people.                                        | Protect outcome: privacy improves, corroboration slows. Player keeps redacted material; the current parser assigns the original to Mara. |
| `publish` — A file leaves your hands          | Luca publishes; scrutiny rapidly includes tenant identities.                                                             | Public outcome: emergency board response, exposure and removal requests. A prior protection promise sharpens the betrayal.               |
| `bargain` — A place at someone’s table        | Celeste agrees access to board records, excluding personnel files.                                                       | Power outcome: genuine access and institutional claims of cooperation. No enacted records appointment follows this night.                |
| `withhold` — Possession is its own obligation | Keep the original while others ask what will happen to it.                                                               | Ghost outcome: responsibility and requests continue. The board has another copy.                                                         |

The authored continuations go toward `mirror`; ordinary parser play can physically leave and use sleep instead. **Unresolved:** redaction prose describes several sealed originals, while the simulation retains one original with one custodian. The bargain/withhold prose also assumes questions, a tote or objects not necessarily supplied by current actions.

**New suggestion — humour/private voice/development:** place humour around the labour of copying or the absurdly cheerful upload icon, not in a way that makes tenant exposure weightless. Give the player enough concrete stakes to regret a cost without declaring an objectively correct ending.

**Corey’s notes / requested additions**

Sources: [ledger/redaction](../src/content/scenes/consequences.ts), [publication/bargain/withholding](../src/content/scenes/endings.ts), [custody handlers](../src/engine/parser.ts).

### 20. The mirror and the ordinary journey home

**Implemented — authored aftermath; partially bypassed by direct parser completion.** Dramatic purpose: bring the treatment of other people’s information back to the player, then let the night become personal memory.

| Scene                                       | What happens and meaningful choice                                                                                                                    | Entry, consequences and next connection                                                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mirror` — For your own protection          | Inez forwards yesterday’s withheld message. Ask her to seek permission next time, understand but request the rest, object angrily or defer answering. | Follows the authored custody aftermath. Earlier stranger/sender choices colour the comparison. Records different Inez memories; goes to walk.             |
| `walk` — The way home is still the way home | The rain, Ruth’s journey and Mara’s remembered drink/fan message reduce the scale of the evening. Go home or reply.                                   | After an expanded route, a bridge offers closing conversations before departure. Some prose assumes Ruth or Mara was met and needs gating.                |
| `apartment` — Your own side of the door     | Familiar domestic objects, the misused signature and a Motel key await attention.                                                                     | Authored reflection follows; the parser’s room entry separately places the key when a custody outcome exists. Going home alone is not custody commitment. |
| `reflection` — What stays with you?         | Choose connection, evidence, autonomy, uncertainty or distance from personal attention.                                                               | A private adaptation choice, not a revelation to NPCs. Leads to dawn in authored flow; normal parser sleep does not automatically ask it.                 |
| `dawn` — The morning has other plans        | The custody outcome produces a particular morning and possibly verified sender acknowledgement. Call about Motel or finish.                           | Ending-specific final choices; parser sleep supplies dawn plus the matching terminal scene. Unverified sender text is filtered.                           |

**Unresolved:** `mirror` says the sender is already known, which need not be true for a parser withholding route. Sleep’s direct completion can omit this whole emotional passage. Reflection contains player-facing system explanation rather than entirely in-character prose.

**New suggestion — humour/private voice/development:** let the refrigerator be irritating without turning it into symbolism every time. Decide whether the player’s private voice chooses what to make of the night through a conversation, a thought or the final action, instead of requiring a preference questionnaire for closure.

**Corey’s notes / requested additions**

Sources: [endings and aftermath](../src/content/scenes/endings.ts), [registry bridges](../src/content/scenes.ts), [sleep/entry](../src/engine/parser.ts).

### 21. Returning before goodbye

**Implemented — four shared return/home beats.** Dramatic purpose: make time apart visible and permit an unfinished relationship rather than forcing complete closure. Entry: the expansion was chosen; after the document decision, return to previously completed first visits while the people are available.

| Scene                                          | What happens and meaningful choice                                                                   | Consequences and next connection                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `closing_room` — Before you disappear          | Choose a previously completed, not-yet-closed companion’s return, or leave conversations unfinished. | Starts beats 8–13 or goes to the departure table.                                         |
| `closing_second` — One more proper goodbye     | After one closing visit, return to another eligible lead or end.                                     | Limits closing material to relationships actually begun; no four fresh arcs at departure. |
| `closing_table` — The things you take with you | Coats, chargers and other people’s plans accompany departure.                                        | Conditional snack, ride and family callbacks; marks closing complete and returns to walk. |
| `home_callback` — Ordinary things, returned    | At home, a chosen mug/fridge or familiar-voices memory returns beside the night’s messages.          | Available through the expanded apartment bridge; adds composure and leads to reflection.  |

**New suggestion — humour/private voice/development:** give an unfinished goodbye a recognisable tone of its own. Do not make “complete both arcs” the only way to leave with a satisfying story.

**Corey’s notes / requested additions**

Source: [shared scenes](../src/content/relationships/shared.ts).

### 22. The end of the first night and the next question

**Implemented — five authored scenes.** Dramatic purpose: state the consequences of the chosen custody, then offer a future mystery without pretending it has already been written.

| Scene                                     | What happens                                                                                                                                                                          | Conditions and limits                                                                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `motel` — A room for the next question    | Inez explains a forwarding convention, promises an inventory, and sends the cassette/two receipts/pre-flood photograph teaser. ROOM 06 appears where the protagonist’s window is now. | Optional authored call from dawn. The parser also has a physical Motel room requiring the carried key to enter; the ordinary Inez call gives a shorter forwarding answer. These presentations need reconciliation. This is a hook, not a full second chapter. |
| `end_protect` — Some names stay unwritten | The Careful Copy: people may choose whether to corroborate; delay benefits the board.                                                                                                 | Protect custody flag. Authored terminal scene, no further choices.                                                                                                                                                                                            |
| `end_public` — The truth has an audience  | Open Circuit: scrutiny expands, tenants lose control, Luca corrects and Mara withdraws.                                                                                               | Public custody flag. No later trial, reform result or exposure-repair chapter is written.                                                                                                                                                                     |
| `end_power` — Your name is on the list    | Terms Accepted: the player gains access while the institution gains a useful description of their cooperation.                                                                        | Power custody flag. The visit to those records is future story.                                                                                                                                                                                               |
| `end_ghost` — You keep the original       | Private Property: the player retains the paper and the burden; the city finds other paths.                                                                                            | Ghost custody flag. Do not confuse this with going home without the original, which has a separate brief unresolved parser response.                                                                                                                          |

**Documented plan:** later nights and districts, with selected history carried forward. **Unresolved:** cassette contents, receipts, photograph meaning, former tenant’s full account and the final outcome of the larger city story. No fifth secret authored “true ending” was found.

**New suggestion — humour/private voice/development:** allow the next invitation to feel different because someone learned to ask properly. Decide what modest fact the teaser promises to answer next before adding further ominous objects.

**Corey’s notes / requested additions**

Sources: [endings](../src/content/scenes/endings.ts), [Motel map](../src/content/spaces.ts), [call/entry/sleep behavior](../src/engine/parser.ts).

## F. Smaller interactions and future material

### Flavour, observations and authored phone replies

**Implemented:** room objects support selected examination, touch, leaning, sitting, listening and other practical responses. Patient observation can reveal routines: Mara’s supplier photographs, Celeste’s cold dinner, Luca’s unsent message, Inez checking a second page. Generic social responses cover jokes, teasing, thanks, disagreement and changing topic. These are smaller interactions, not new chapter scenes or evidence of a secret.

**Implemented:** four personal phone threads allow accepting or deferring future conversation; replies take time and schedule authored answers. A voice note is displayed as a transcript. The Inez/Luca equipment-return conversation can occur during their shared bay presence; only an eligible witness hears its prose. The newer envelope arrangement has its own observed agreement history, separate from generic conversation flavour.

**Implemented:** THINK/REMEMBER can review heard speech and verified evidence with its source. Adaptive observations are curated. **Documented plan:** a more distinctive, sustained private voice and richer connected adult/social situations. No runtime novelist or independently generated new plot is implemented.

**Unresolved:** generic jokes and replies may be appropriate in tone but insufficient to answer a specific authored question. An observed person, a describable object and a plot beat should not become interchangeable merely because they share a noun.

**New suggestion — humour/private voice/development:** choose a few recurring local details which can change meaning as the night progresses. Let most remain small; a good joke should not need a new flag, quest or mystery reward to justify its existence.

**Corey’s notes / requested additions**

Sources: [affordances](../src/content/affordances.ts), [observations](../src/content/observation.ts), [social responses](../src/content/social-responses.ts), [phone](../src/content/phone.ts), [current parser](../src/engine/parser.ts).

### Material deliberately outside the current scene list

**Documented plan:** an ongoing multi-night, kink-centred neo-noir city; deeper character-specific adult themes and contextual jealousy; optional identity/background lenses; additional connected commitments; later districts and Motel follow-through. These are not extra implemented scenes hidden outside the 117-scene count.

**Unresolved:** specific future fetish assignments, detailed later-night plots, broader ending possibilities and the content of the Motel objects. **New suggestions** in this guide do not settle them.

The graphical prototype’s vestibule beat is retained as an inactive experiment using existing story actions. It contributes interaction lessons, not another canonical chapter. Static scene imagery and state-driven overlays remain the intended future presentation; all visual development stays deferred.

**Corey’s notes / requested additions**

Sources: [gameplay brief](design/FREAK-CITY-gameplay-design-brief.md), [identity brief](design/FREAK-CITY-player-identity-design.md), [current direction](TEXT-LED-TRANSITION.md), [prototype milestone](../prototype/MILESTONE.md).

## Coverage and review limits

The guide covers 56 original/core/additional scenes, 52 character-arc scenes and nine shared expansion scenes: **117 registered scenes in total**. The scene identifiers are included only so an editing request can point to the exact authored material. The broad narrative groups are for Corey’s decisions, not a proposed compulsory play order.

All current registered scene prose, conditional passages, choices/effects and the relevant parser adaptations were inspected. Fresh deterministic text campaigns confirm all twelve seed/ending combinations. This is a creator’s content review, not a claim that every authored beat has passed a fresh human playtest or that the current parser can reliably deliver the complete manuscript. The [story bible’s creative-decision section](CREATOR-STORY-BIBLE.md#6-creative-decisions) prioritises the remaining authorial and continuity questions.
