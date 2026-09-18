import { createVessel } from "./vessels";
import { entitySchema } from "../engine/world-types";

export const TRIAL_TRUTH = {
  party: "Sable worked at the Cat's Cradle closing party five years ago.",
  donor:
    "Nessa voluntarily sold hospital memories four years ago; she does not know the scheme or Sable.",
  intervention:
    "Three years ago, during a short surgical admission, Silas stole party memories and implanted an edited hospital composite without consent.",
  construction:
    "Recorded source material, specialist equipment, editing and time are required. Source viewpoint persists in raw recordings; edited composites can reframe it. Arbitrary instant fabrication is impossible.",
  ghost:
    "Materially reorganized autobiographical continuity after non-consensual implantation; not a numerical majority of invented life.",
  failure:
    "Thursday 18:00 before opening: endorsement implantation failed, installing no usable memory and erasing no subsequent life. Older suppression destabilized.",
  friendship:
    "Sable is the player's first genuine friend in their three weeks here. The friendship formed after implantation and is real.",
  motive:
    "The Regulars want present-day community endorsement, not repaired historical testimony.",
} as const;
export const rooms = {
  bar: "The Velvet Corner",
  shop: "Secondhand shop",
  booth: "The quiet booth",
  home: "Your apartment",
} as const;
export const evidenceIds = ["trial-photo", "trial-listing"] as const;
export function createTrialEntities() {
  const definitions = [
    [
      "trial-photo",
      "photograph",
      "A clearance print from a venue photographer's lot. Sable is serving at the Cat's Cradle closing party, five years ago. A newspaper and event decorations are visible; neither dates the print conclusively alone.",
      "shop",
      "Evidence",
    ],
    [
      "trial-listing",
      "provenance listing",
      "The shop's lot record accompanies an independently printed closing-event listing. The date, venue layout, decorations and photographed headline agree. Together they credibly place Sable at that event. They identify an occasion, not the motives of the people in the picture.",
      "shop",
      "Evidence",
    ],
    [
      "trial-bag",
      "satchel",
      "Your ordinary satchel. A pocket with delusions of being an archive.",
      "player",
      "Container",
    ],
    [
      "trial-report",
      "medical report",
      "An abnormal finding compatible with prior intervention; alternative causes remain unresolved. A specialist referral is recommended. The finding alone cannot establish what happened, when, or why.",
      "unplaced",
      "Evidence",
    ],
    [
      "trial-notebook",
      "notebook",
      "Sable has separated remembered images from observed details. The photograph's event listing gives an independently checkable next step: ask the venue photographer to authenticate the lot and event date. A staff-side detail in a dream is recorded as uncertain, not a confirmed memory.",
      "unplaced",
      "Evidence",
    ],
  ] as const;
  const result = Object.fromEntries(
    definitions.map(([id, name, description, location, kind]) => [
      id,
      entitySchema.parse({
        id,
        name,
        description,
        location,
        kind,
        aliases: [],
        portable: true,
        open: kind === "Container" ? true : undefined,
      }),
    ]),
  );
  const aliases: Record<string, string[]> = {
    "trial-photo": ["photo", "print", "picture"],
    "trial-listing": ["listing", "provenance", "flyer"],
    "trial-report": ["report", "medical record"],
    "trial-notebook": ["notebook", "notes", "journal book"],
    "trial-bag": ["bag"],
  };
  for (const e of Object.values(result)) e.aliases = aliases[e.id] ?? [];
  result["trial-cup"] = createVessel("trial-cup", "cup", ["cup"]);
  result["trial-glass"] = createVessel("trial-glass", "glass", ["glass"]);
  result["trial-counter"] = entitySchema.parse({
    id: "trial-counter",
    name: "counter",
    aliases: ["bar counter"],
    description:
      "A worn wooden serving counter. You can set a held object on it.",
    kind: "Container",
    open: true,
    location: "bar",
    properties: { supporter: true },
    portable: false,
  });
  result["trial-menu"] = entitySchema.parse({
    id: "trial-menu",
    name: "menu",
    aliases: [
      "cocktail menu",
      "back of menu",
      "menu reverse",
      "costume notes",
      "theme night notes",
    ],
    description: cocktailMenu,
    kind: "Object",
    location: "trial-counter",
    portable: false,
  });
  return result;
}
export const complaintQuestion =
  "Sable lowers the supplier complaint. ‘Would you say “a lid implies a vessel” sounds threatening? I've spent half an hour making it less threatening.’";
export const opening = [
  "Three weeks in the city. One genuine friend. Sable waves you into the Velvet Corner with a cocktail menu propped on the counter like a royal pardon.",
  "Sable: ‘Tonight's special is Minor Administrative Disappointment. Alcohol optional. The disappointment is locally sourced.’",
  "They are rehearsing a complaint to a supplier who sent twelve lids and no jars. Ask about their evening, order something, or just keep them company. The secondhand shop next door is open; your apartment is a short walk away.",
  complaintQuestion,
  "This local chapter trial advances only when you act. LOOK, HELP, JOURNAL and private THINK are untimed. REST UNTIL TOMORROW at home is an optional jump to the next evening, with all intervening consequences preserved.",
];
export const hospitalAccount =
  "Sable: ‘I remember being in hospital continuously that year. A whole year, five years back. Even the night the Cat's Cradle closed. Lately I dream about serving there instead. I don't know what to make of it.’";
export const socialLines = [
  complaintQuestion,
  "‘Next themed evening: Deep Sea Prom. I have borrowed a smoke machine and underestimated the dignity of a rubber octopus.’ They turn the menu over. Six costume notes; no food budget.",
  "Sable tells you about a friend who has volunteered to run the music and then asked what music is. ‘A promising start. Very open to feedback.’",
];
export const cocktailMenu =
  "The menu: tea, coffee and water. Minor Administrative Disappointment is citrus cordial and soda, alcohol-free by default; ask for gin if you want the alcoholic version. Both versions come without a garnish. On the reverse: Deep Sea Prom costume notes, a borrowed smoke machine and a rubber octopus; snacks and a food budget still need sorting.";
export const socialSubjects = ["supplier", "party", "music"] as const;
export const socialFollowups = {
  supplier:
    "Sable: ‘Twelve lids, no jars. I've asked the supplier to send the missing jars rather than another apology. The lids are waiting in a box under the counter.’",
  party:
    "Sable: ‘Deep Sea Prom still needs snacks and someone to keep the smoke machine under control. The octopus can supervise, but I'm not giving it the budget.’",
  music:
    "Sable: ‘My friend has the music slot. I've asked for a short playlist before we hand over the speakers. We can work out the rest from there.’",
};
export const helpText =
  "Try TALK TO SABLE, ASK SABLE ABOUT THEIR MEMORIES, ORDER TEA, ASK SABLE ABOUT ROLEPLAY, GO SHOP, TAKE PHOTO, READ PHOTO, TAKE LISTING, READ LISTING, SHOW PHOTO TO SABLE, SHOW LISTING TO SABLE. At the shop Vesper can inspect those objects; ASK VESPER TO TELL SABLE explicitly requests the delayed relay. SHOW retains custody; GIVE transfers it without reading it for them. You can put things in your satchel, close it, drop or tear held evidence. TALK PRIVATELY at the bar requests a quiet conversation. Natural replies include ‘I disagree’, ‘I need space’, ‘take your time’ and ‘say nothing’. GO HOME and REST UNTIL TOMORROW optionally advance to the next evening. WAIT FOR TEN MINUTES also works. HELP, LOOK, INVENTORY, JOURNAL and THINK are free. No outside clock runs.";
