# Sable story exploration — 18 September 2026

**Sable becomes worth caring about when the contradiction frightens them and they act on it. The opening offers charm, but ordinary attempts to express that care are still too often rejected or answered with unrelated conversation.** The existing outcome provides a meaningful development; the final emotional exchange does not land.

This was **informed, agent-driven exploratory testing**, not a blind first-time human playtest. I already knew the implementation and broad story structure. I did not consult story source, walkthroughs or previous solution transcripts before playing. I followed the current prose, used one natural rephrasing after failed replies, and retained the failures. No gameplay changes or repairs were made.

## Session and evidence

- [Test URL](http://localhost:52755/sable-trial.html): unchanged compiled `sable-evening-4`, served on a new, unused local port. Hash comparison confirmed the current trial sources and compiled files matched the delivery build without reading story content.
- [Original readable transcript](sable-playtest-transcript.md) and [matching diagnostic JSON — spoilers](sable-playtest-diagnostics-SPOILERS.json).
- [Numbered command index](session-index.md), used for the references below. This is a separate review aid, not an edited replacement transcript.
- Screenshots: [arrival](01-arrival.png), [contradiction](02-contradiction.png), [journal](03-journal.png), [closing obstacle](04-closing-obstacle.png), [independent outcome](05-independent-outcome.png), [frozen export](06-frozen-export.png).

The session contains **64 submissions**, one HELP, no HINT and no semicolon batches. I used HELP after the request to borrow the photograph resolved to an absent Sable despite addressing Vesper. Taking the documents afterward followed the room's explicit “available to take” invitation; it was not an unreported switch to an internal solution command. After Sable described an appointment “a few days” away, I used the advertised rest action and returned on Tuesday. I did not inspect event times to choose that return.

Play ended **Day 4, Tuesday 18:08, in the quiet booth**. Sable had chosen and attended the independent examination, arranged cover at work, returned, given a private update and shown the medical report. The interface explicitly marked the current playable segment complete. The specialist visit was not played and is explicitly outside this trial. The final two submissions attempted to thank Sable and failed; I stopped there rather than substituting a known successful closing phrase.

Both exports were frozen before internal review. The [snapshot verification](snapshot-verification.json) confirms byte-identical regenerated Markdown and diagnostic JSON. The diagnostics count 42 handled, 13 rejected, 8 clarified and 1 deferred reply. **Handled is not a relevance score**: several handled replies were wrong-topic. Post-freeze diagnostics confirm Sable's decision, departure, examination and return events fired; my company offer remained only `offered`, with no agreement invented. The report remained in Sable's custody after being shown.

## Story assessment

| Question | Assessment from this session |
| --- | --- |
| Is Sable worth spending time with? | Partly established. The theatrical supplier complaint and “Get home all right… It was good to see you” provide warmth. The first genuine friend is asserted by the introduction more strongly than enacted by reciprocal conversation. Asking whether Sable enjoys hosting received logistics and then failure (#6–7). Their vulnerability and autonomy later gave me a stronger reason to care. |
| Does the contradiction create curiosity? | Yes, once expressed: Sable remembers a whole year in hospital, including a night independently documented at the venue. “Lately I dream about serving there instead” adds personal stakes. Reaching that explanation was harder than understanding it: #22 went to prom planning; #26 failed; #27 finally introduced the memory, recognised the contradiction and proposed next steps in one block. |
| Can I pursue encouraged questions? | Unevenly. A dream follow-up recovered on rephrasing (#31–32), and the report could be requested from its custodian (#59–60). Who the practitioner is, why Sable trusts them, an actual appointment day, and Sable's preference about company were not answerable in this session. |
| Can I distinguish knowledge from suspicion? | Strongly. The listing establishes an occasion, not motives. The journal attributes inspected documents and Sable's account, and says neither coercion nor a perpetrator has been established. The dream reply refuses to label familiarity as a confirmed memory. The medical report retains alternative causes and does not establish who, when or why. |
| Do independent actions and later replies reflect history? | Yes for the main arc. Sable decides while I ask questions, later attends without my presence, arranges work cover, and specifically recalls the photograph and listing I showed. The company offer is acknowledged without becoming a promise. Personal follow-ups are weaker: asking whether they want company loops, and asking about another dream repeats the original account. |
| Does humour support the emotion? | The opening's lids and locally sourced disappointment fit the scene. The precise voice at the contradiction and measured medical update work. The music joke after “how are you feeling about this?” (#29) breaks the frightened moment. This is an inappropriate response selection, not evidence that the joke itself must be removed everywhere. |
| Is the ending satisfying and clear? | The examination is a meaningful development with a clear limit: an abnormal finding, alternatives open, specialist referral unsettled. The interface states the specialist visit is outside the trial. Emotional closure is weaker: both “Thank you for trusting me with this” and “Thanks for telling me, Sable” fail (#63–64), immediately after an exchange about trust. |

## 1. Confirmed mechanical or conversation defects

These are observable failures of meaning or continuity. The suggested implementation ownership below is based on transcript and diagnostics, not a claim to have traced every source branch.

- **Non-drink requests become drink requests.** “I'll have a look in the shop next door” (#9) receives “You can order a drink from the menu.” So does “Actually, I'd like to come with you, if you want company” (#37). Both diagnostics explicitly assign subject `drink`. “Go to the secondhand shop” and “Could I come with you to the appointment?” work on retry. This is shared intent/scope handling, not missing story content.
- **Explicit interlocutor is lost.** In the shop, “Vesper, may I take the photograph?” (#15) receives “Sable isn't here to continue that conversation.” The preceding borrow request also failed. Borrowing permission may lack an authored response, but substituting the absent person is a confirmed conversation defect.
- **Relevant follow-ups fall into unrelated social dialogue.** After showing the photo, “Do you remember that night?” (#22) produces the Deep Sea Prom speech. Immediately after the hospital contradiction, “Sable, how are you feeling about this?” (#29) produces the music-volunteer joke. Diagnostics show `conversation:plans` and context changes for both. These are not successful clarifications.
- **Clarification cannot accept its own distinction.** #47 asks whether Sable has decided about company; the game asks whether I am offering, declining or asking their preference. “Would you prefer me to come with you?” (#48) repeats the identical clarification. The retained offer is correctly uncommitted, but the question is not resolved.
- **Ordinary acknowledgements and qualifications remain brittle.** Adding “I'll check in tomorrow” breaks “Goodnight, Sable” (#41–42). The two specific thanks at the ending fail (#63–64). “I'm not sure about the appointment yet” is rejected (#35), although the rephrased concern elicits Sable's reasons. Safe non-execution is preferable to invented consent, but these are conversation coverage failures, not consequential actions requiring a decision.
- **Equivalent showing syntax exposes different presentation paths.** “Show the photograph to Sable” naturally describes looking and handing it back (#21); “show Sable the provenance listing” says “You keep custody” (#24) and lacks the shared `object:show` diagnostic detail. Custody stayed correct. The defect here is inconsistent presentation/handling, not demonstrated object loss.

## 2. Writing and pacing weaknesses

- **The social opening offers little reciprocal curiosity.** “Are you looking forward to the prom?” gets preparation logistics; “Do you enjoy putting these nights on?” fails. The opening tells me Sable is a genuine friend, but does not readily let me learn why this work or these people matter to them.
- **The emotional turn is compressed.** #27 delivers the hospital account, contradiction, practitioner option and impending decision together. The core facts are clear, but there is little room to absorb Sable's fear before logistics arrive. The failed emotional check-in then compounds that compression.
- **The practitioner appears as a ready solution without enough grounding.** The existing line that each step will be explained and can be stopped is reassuring, but it does not answer who this person is or how Sable came to trust them. No additional mystery branch is needed to acknowledge those reasonable questions.
- **Practical timing is vague despite a scheduled event.** “When's the appointment?” repeats the reasons and “a few days”; “What day should I check in with you?” fails (#39–40). I advanced several days because the text gave no usable date. This creates dead time rather than anticipation.
- **Repetition and residual internal language flatten character.** Hospital and dream queries repeatedly recite the same paragraph (#30–31, #50); the update repeats the earlier examination rationale. “The separate dated source” and “You keep custody” sound like explanations of the model. The opening uncertainty reply about hearing the complaint “in their voice” also muddles whose letter Sable is rehearsing (#1).

## 3. Unsupported interactions invited by the prose

These may need bounded authored responses or a clear limitation; the evidence does not justify claiming the full actions already exist.

- “Give me a few minutes to decide” and the careful practitioner description invite questions about trust, identity and preference. #33–34 and #47–48 do not support pursuing them. The preference loop is also a routing defect, as noted above.
- Party preparations invite questions about Sable's enjoyment and reasons for hosting (#6–7). The current answers support logistics more than knowing the person.
- A shopkeeper sorting a clearance lot invites asking to borrow a photograph (#14–15). Taking it directly is advertised and works, but conversational permission is not supported by this encounter.
- “I don't know what to make of it” and the dream invite asking about changes overnight (#49–50). The response does not distinguish a new dream from repeating the established account.
- The private disclosure and “I'm glad we can talk about this” invite specific thanks (#63–64). The unsupported response is especially costly because it occurs at the emotional endpoint.

## 4. Deliberately deferred content

The specialist visit is explicitly not playable, and “Where we go after that isn't settled” (#62) is an appropriate boundary. The finding's cause, timing and responsible person remain unresolved; neither the photo nor the report should magically answer them. These are meaningful open questions, not defects to repair by inventing answers. No completion of the broader mystery was attempted or claimed.

## Three most valuable improvements

1. **Keep a player's meaning and conversational subject intact — shared-system fix.** Prioritise explicit interlocutors and subjects, scope ordering language to an actual service request, and let clear preference questions answer the clarification that solicited them. Prevent a generic social fallback from silently replacing a sensitive active topic. The targets are #9, #15, #22, #29, #37 and #48. Relevant clarification is acceptable when interpretation really competes; unrelated successful dialogue is not.
2. **Give Sable a small set of personal and emotional replies — primarily authored-content change, using the existing shared response structure.** Add bounded answers about enjoying the venue/hosting, feeling frightened, receiving concern and accepting thanks. Let the reaction to the contradiction breathe before repeating examination logistics. Preserve theatrical humour in company and let it recede when Sable is scared. The targets are #6–7, #27–29 and #63–64; this needs depth in the existing encounter, not a new plot branch.
3. **Make existing next steps discussable and concrete — primarily authored-content change tied to existing state.** Provide an honest practitioner answer within established knowledge, a readable appointment day, and a specific response about whether company is wanted or still undecided. Repeated questions should acknowledge what has not changed. Keep the specialist boundary and medical uncertainty explicit. The targets are #33–40 and #47–50. The shared clarification defect belongs to improvement 1; once resolved, authored answers can make the current sequence intelligible without new systems.

No improvements were implemented in this task. No automated suite was rerun for the unchanged build. Only export consistency and file-preservation checks were performed after freezing. [Preservation audit](preservation-audit.json) covers all 1,661 pre-existing tracked/nonignored files, including previous evidence; personal save origins were not accessed. Artwork, campaign, inactive prototype, Inform experiment and unrelated work remain unchanged. No installations, commits, pushes or deployment occurred.
