import { cocktailMenu, socialFollowups, socialLines } from "./content";
import type { ActorDefinition, BeverageDefinition } from "./interaction-model";

export const beverages: BeverageDefinition[] = [
  { kind: "tea", aliases: ["tea"] },
  { kind: "coffee", aliases: ["coffee"] },
  { kind: "water", aliases: ["water"] },
  {
    kind: "alcohol-free special",
    aliases: [
      "special",
      "cocktail",
      "minor administrative disappointment",
      "gin",
    ],
    variant: { words: ["gin", "alcohol", "alcoholic"], kind: "gin special" },
  },
];
export const trialInterlocutors: ActorDefinition[] = [
  {
    id: "sable",
    name: "Sable",
    aliases: ["sable"],
    social: {
      thanks: "Sable smiles. ‘You're welcome.’",
      company:
        "Sable sets the pencil aside. ‘Then you've come to the right counter. Stay a while.’",
      goodbye: "‘Get home all right,’ Sable says. ‘It was good to see you.’",
    },
    topics: [
      {
        id: "supplier",
        kind: "opinion",
        aliases: [
          "supplier",
          "complaint",
          "letter",
          "lids",
          "jars",
          "threatening",
          "menacing",
        ],
        question: socialLines[0],
        positive:
          "Sable: ‘Very threatening, then. I'll soften the supplier letter before it starts demanding a ransom.’",
        negative:
          "Sable lets their shoulders drop. ‘Good. If it doesn't sound threatening, I can send it as it is. I only want the jars.’",
        hesitation:
          "Sable tilts the page towards the light. ‘Hard to tell without hearing it in their voice, isn't it? I'll sleep on it.’",
        teasing:
          "Sable lifts the pencil like a tiny sceptre. ‘Mockery at my own counter. I see how it is.’ Their smile gives them away.",
        changed: {
          positive:
            "‘On second thoughts, too much?’ Sable looks back at the supplier letter. ‘All right. One less exclamation mark.’",
          negative:
            "‘You've reconsidered?’ Sable lowers the pencil. ‘Then I'll leave the supplier letter alone. Thank you for being my second pair of eyes.’",
        },
        repeatOpinion:
          "Sable nods. ‘Point taken. I'll stop making you proofread it.’",
        repeated:
          "‘Still waiting for the jars,’ Sable says. ‘You've heard the entire lid saga now. How about we give the supplier the evening off?’",
        followup: socialFollowups.supplier,
        judgments: {
          positive: ["threatening", "menacing"],
          negative: ["harmless", "reasonable", "polite", "fair"],
        },
      },
      {
        id: "photo",
        kind: "evidence",
        aliases: [
          "photo",
          "photograph",
          "picture",
          "print",
          "cat's cradle",
          "closing party",
        ],
        entityId: "trial-photo",
        unseen:
          "Sable: ‘I haven't seen the photograph. Can you show it to me?’",
        claim:
          "Sable puts the pencil down. ‘A photograph of me? I'd like to see it, if you have it with you.’",
        followup:
          "Sable studies the photograph again. ‘That looks like me. But when was it taken? I can't place the occasion from the picture alone.’",
        corroborated:
          "Sable: ‘The photograph and listing agree on the occasion, and that conflicts with my hospital account. We still don't have an explanation.’",
        repeated:
          "‘I haven't worked out anything more,’ Sable says quietly. ‘Can we leave it there for a while?’",
      },
      {
        id: "listing",
        kind: "evidence",
        aliases: ["listing", "provenance", "headline", "date"],
        entityId: "trial-listing",
        unseen:
          "Sable: ‘Can I see the listing? I'd like to read the date myself.’",
        claim:
          "‘You found a date?’ Sable asks. ‘Bring the listing over when you can.’",
        followup:
          "Sable: ‘The separate dated source helps identify an occasion. It doesn't explain what happened.’",
        repeated:
          "‘The date hasn't changed,’ Sable says. ‘I still don't know how to explain it.’",
      },
      {
        id: "party",
        kind: "subject",
        aliases: [
          "deep sea",
          "party",
          "prom",
          "octopus",
          "party plans",
          "theme",
          "costume",
          "smoke machine",
          "snacks",
        ],
        question: socialLines[1],
        followup: socialFollowups.party,
        positive:
          "‘Then come as you are, or as something with fins,’ Sable says. ‘I want people to have a good evening, not pass an audition.’",
        negative:
          "Sable nods. ‘Too much? Fair enough. A quiet drink counts as an evening out too.’",
        hesitation:
          "‘No need to decide tonight,’ Sable says. ‘The sea will keep.’",
        repeated:
          "‘That's as far as the plans go,’ Sable says. ‘Now I just need people to turn up and enjoy themselves.’",
        judgments: {
          positive: ["fun", "lovely", "sounds good", "like it"],
          negative: ["awful", "too much", "hate it"],
        },
        details: [
          {
            aliases: ["octopus"],
            response:
              "‘The octopus is decoration,’ Sable says. ‘At least until someone gives it a name and starts taking its opinions seriously.’",
          },
          {
            aliases: ["costume", "wear"],
            response:
              "‘Anything you can walk home in,’ Sable says. ‘A bit of silver, something blue. You don't owe anyone an elaborate costume.’",
          },
          {
            aliases: ["snacks", "food"],
            response:
              "‘The snacks are still a blank line on the menu,’ Sable admits. ‘I spent longer on the costume notes. That may have been a mistake.’",
          },
          {
            aliases: ["smoke machine"],
            response:
              "‘A little atmosphere,’ Sable says, then pauses. ‘Very little. I would like to be able to find the counter.’",
          },
        ],
      },
      {
        id: "music",
        kind: "subject",
        aliases: ["music", "playlist", "speakers", "songs"],
        question: socialLines[2],
        followup: socialFollowups.music,
        positive:
          "Sable smiles. ‘Good. Something you can talk over, then something you can't help moving to.’",
        negative:
          "‘Fair enough,’ Sable says. ‘I like being able to hear the person next to me too.’",
        hesitation:
          "‘We can listen for a bit,’ Sable says. ‘You don't have to review the whole playlist.’",
        repeated:
          "‘No new playlist yet,’ Sable says. ‘For now, I'm happy with this. I can hear you without leaning across the counter.’",
        judgments: {
          positive: ["nice", "lovely", "like it", "sounds good"],
          negative: ["awful", "too loud", "hate it"],
        },
        details: [
          {
            aliases: ["like", "favourite", "favorite"],
            response:
              "‘Something with a bass line you notice before you notice yourself swaying,’ Sable says. ‘But early in the evening? Leave room for people to talk.’",
          },
        ],
      },
      ...[
        [
          "hospital",
          [
            "hospital",
            "hospitalization",
            "dream",
            "memories",
            "recollection",
            "past",
          ],
        ],
        ["plans", ["evening", "night", "plans"]],
        ["drink", ["menu"]],
        ["report", ["report", "medical record"]],
        [
          "notebook",
          [
            "notebook",
            "documentation",
            "observations",
            "write down",
            "writing down",
          ],
        ],
        [
          "investigation",
          [
            "investigation",
            "decision",
            "appointment",
            "doctor",
            "examination",
            "exam",
            "update",
            "results",
            "specialist",
          ],
        ],
        ["roleplay", ["roleplay", "kink", "switch", "recording"]],
      ].map(([id, aliases]) => ({
        id: id as string,
        aliases: aliases as string[],
        kind: "subject" as const,
        external: true,
        followup: "",
      })),
    ],
    service: {
      vessels: ["trial-cup", "trial-glass"],
      counter: "trial-counter",
      kinds: ["tea", "coffee", "water", "alcohol-free special", "gin special"],
      offer:
        "Sable: ‘Tea, coffee or water? The spectacularly named drinks can wait.’",
      decline: "Sable: ‘Of course. Company doesn't have a minimum order.’",
      hesitation:
        "‘No hurry,’ Sable says, setting the pot down. ‘Let me know when you've decided.’",
      confirmRefill:
        "Sable gestures towards your {vessel}. ‘Would you like your usual {drink}, {alias}?’",
      confirmNew:
        "‘Would you like your usual {drink}, {alias}?’ Sable reaches towards a clean {vessel}, then waits.",
      noClean:
        "‘I'm short of clean cups and glasses just now,’ Sable says. ‘Put an empty one on the counter and I'll rinse it, or I can refill one you're using.’",
      served: {
        tea: "‘Tea. I'll give it a minute before asking it anything difficult.’",
        coffee: "‘Coffee. Smells more awake than either of us.’",
        water: "‘Water. No garnish trying to escape into your nose.’",
        "alcohol-free special":
          "‘Minor Administrative Disappointment: citrus cordial and soda, alcohol-free.’",
        "gin special":
          "‘Minor Administrative Disappointment, with gin. The paperwork is imaginary.’",
      },
    },
  },
  {
    id: "vesper",
    name: "Vesper",
    aliases: ["vesper"],
    topics: [
      {
        id: "photo",
        kind: "evidence",
        aliases: ["photo", "photograph", "picture", "print"],
        entityId: "trial-photo",
        unseen: "‘Can I see the photograph?’ Vesper asks.",
        claim: "‘Bring it over,’ Vesper says. ‘I'd like a look.’",
        followup:
          "Vesper: ‘The print came with that photographer's clearance lot. Read the separate event listing too.’",
      },
      {
        id: "listing",
        kind: "evidence",
        aliases: ["listing", "provenance"],
        entityId: "trial-listing",
        unseen: "Vesper asks to see the separate listing.",
        claim: "‘I'd like to read that,’ Vesper says.",
        followup:
          "Vesper can report the listing they inspected; it does not prove anyone's motives.",
      },
    ],
  },
];

// Authored promises, not automated prose extraction. Contract IDs are tested.
export const openingPromises = [
  {
    id: "complaint-question",
    kind: "question",
    actor: "sable",
    subject: "supplier",
    commands: ["ask Sable about complaint", "no it dosen't sound threatening"],
    intent: "conversation:opinion",
    response: "doesn't sound threatening",
  },
  {
    id: "drink-choice",
    kind: "question",
    actor: "sable",
    subject: "drink",
    commands: ["talk", "coffee"],
    intent: "conversation:order-drink",
    response: "coffee",
  },
  {
    id: "special",
    kind: "action",
    actor: "sable",
    commands: ["order the special"],
    intent: "conversation:order-drink",
    response: "alcohol-free",
  },
  {
    id: "menu",
    kind: "object",
    entity: "trial-menu",
    commands: ["read menu"],
    intent: "object:examine",
    response: "tea, coffee and water",
  },
  {
    id: "menu-reverse",
    kind: "object",
    entity: "trial-menu",
    commands: ["read the back of the menu"],
    intent: "object:examine",
    response: "costume notes",
  },
  {
    id: "cup",
    kind: "object",
    entity: "trial-cup",
    commands: [
      "order coffee",
      "take cup",
      "examine cup",
      "take another sip of coffee",
      "finish cup",
      "put down the cup",
    ],
    intent: "object:put",
    response: "put down",
  },
  {
    id: "refill",
    kind: "action",
    commands: [
      "order coffee",
      "finish cup",
      "ask for another drink",
      "yes ill have another coffee",
    ],
    intent: "conversation:accept-offered-drink",
    response: "same cup",
  },
  {
    id: "photograph",
    kind: "object",
    entity: "trial-photo",
    commands: ["go shop", "read photograph"],
    intent: "object:examine",
    response: "neither dates",
  },
  {
    id: "shop",
    kind: "action",
    commands: ["go shop"],
    intent: "language-verb:go",
    response: "Secondhand shop",
  },
  {
    id: "home",
    kind: "action",
    commands: ["go home"],
    intent: "language-verb:go",
    response: "apartment",
  },
] as const;
export const menuDescription = cocktailMenu;

export const openingInteraction = {
  interlocutor: trialInterlocutors[0].id,
  kind: "social" as const,
  topic: "supplier",
  question: { kind: "opinion" as const, subject: "supplier" },
  references: [] as string[],
  room: "bar" as const,
  at: 1080,
};

// The opening's shop hook: Sable's borrowed smoke machine and one small
// favour. Lines and phrase lists only; src/trial/agreements.ts holds the
// logic. Vesper's line names neither the photograph, the print, the lot's
// contents nor the past.
export const favour = {
  id: "smoke-machine-message",
  // Observation subjects: Sable heard the acceptance; Sable heard it arrived.
  accepted: "favour-accepted",
  delivered: "message-delivered",
  // What names the errand: to Vesper at the shop, or to Sable afterwards.
  mention: /\b(?:sable|smoke machine|machine|message)\b/,
  reminder: /\b(?:vesper|smoke machine|machine|message)\b/,
  // Not a message: the photograph and its kin, or pointing at it.
  notMessage:
    /\b(?:photo|photograph|picture|print|listing|provenance|flyer|lot)\b|^(?:is (?:that|this)|that's|this (?:is|looks)|who)\b/,
  // The relay request is Vesper's own business and keeps its handler.
  relay:
    /^(?:please )?(?:ask|tell) vesper to\b|^vesper (?:please )?tell sable\b/,
  // Said to Vesper, not to Sable; checked on the words as typed.
  toVesper:
    /^\s*vesper\s*,|,\s*vesper\W*$|^\s*(?:please\s+)?(?:ask|tell|hi|hello|hey|thanks|thank you)\s+vesper\b/i,
  // Object actions and travel keep their own handlers, whatever they name.
  action:
    /^(?:take|get|pick|give|show|drop|put|tear|read|examine|x|inspect|look|search|open|close|use|drink|sip|finish|go|walk|head|return|enter|leave|visit)\b/,
  // Bare answers, whole reply: the yes and no families the shared layer
  // knows, the acceptances it does not, and two idioms that read as
  // negation if left to it. Anything longer keeps its own handler.
  accept:
    /^(?:yes|yeah|yep|sure(?: thing)?|absolutely|certainly|definitely|of course|ok|okay|alright|all right|fine|gladly|happy to|will do|i will|i can(?: do that)?|i(?:'ll| will) (?:tell|let|pass|do|say|mention)\b.*|i agree|(?:i )?accept|no problem|no worries)[.!]?$/,
  decline:
    /^(?:no|nope|no thanks|no thank you|i disagree|i(?:'d| would) rather not|i won't|i will not|i can't|i cannot|not (?:tonight|now|today|this time)|i'm not going (?:that way|next door|to the shop)|i don't think so)[.!]?$/,
  lines: {
    offer:
      "Sable: ‘A small favour, if you happen to be going next door: would you tell Vesper the smoke machine comes back after Thursday? I'd write a note, but a note can't sound sorry.’",
    accepted:
      "Sable: ‘Thank you. Vesper takes a message better from a face than from a note, and I'd like this one taken well.’",
    declined:
      "Sable: ‘No matter. I'll tell Vesper myself, with the speech they were hoping to avoid.’",
    hesitation: "‘No obligation,’ Sable says. ‘Only if you're passing.’",
    vesper:
      "Vesper nods at the party wall without looking up. ‘Sable, next door. If this is about the smoke machine, after Thursday is fine; I lent it, I didn't lend a deadline.’",
    vesperAgain:
      "‘After Thursday. I heard,’ Vesper says, and goes back to the boxes.",
    thanks:
      "Sable: ‘Delivered, then. Thank you; that's one speech I don't have to give this week.’",
    door: "‘Vesper put their head round the door,’ Sable says. ‘Message received, apparently in my voice. Thank you.’",
    canWait:
      "‘The message can wait,’ Sable adds. ‘Vesper will still be next door tomorrow; so will the smoke machine.’",
  },
};
