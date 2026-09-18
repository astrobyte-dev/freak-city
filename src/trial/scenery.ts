import type { rooms } from "./content";

export type Room = keyof typeof rooms;
export interface Scenery {
  aliases: string[];
  description: string;
}
// Scenery is data: each noun the visible prose names, the aliases a player
// might use for it, and one line for EXAMINE. Nothing here is portable or
// recorded. Real objects live in createTrialEntities and always win.
//
// Forward rule (director, 18 Sep 2026): a new room gets ONE shared
// decorative line for its background nouns. Individual lines are reserved
// for foregrounded items: people, exits, and objects the prose invites the
// player to act on. The per-noun lines below predate the rule and stand as
// honest decorative responses; do not extend the list.
export const scenery: Record<Room, Scenery[]> = {
  bar: [
    {
      aliases: ["pencil"],
      description: "A pencil, worn down by drafts of the supplier complaint.",
    },
    {
      aliases: ["glasses", "mismatched glasses"],
      description: "Mismatched glasses, no two from the same set, all clean.",
    },
    {
      aliases: ["shelves", "shelf"],
      description:
        "Shelves behind the counter, holding the mismatched glasses.",
    },
    {
      aliases: ["speakers", "speaker"],
      description:
        "Two speakers above the shelves, turned down to a soft bass line.",
    },
    {
      aliases: ["bass line", "bass", "music", "song", "tune"],
      description:
        "A soft bass line from the speakers, low enough to talk over.",
    },
    {
      aliases: ["curtain", "curtains"],
      description: "A heavy curtain across the way through to the quiet booth.",
    },
    {
      aliases: ["lids", "lid", "twelve lids"],
      description: "Twelve lids in a box under the counter, waiting for jars.",
    },
    {
      aliases: ["box", "box of lids"],
      description: "A box under the counter holding twelve lids and no jars.",
    },
    {
      aliases: ["jars", "jar"],
      description: "There are no jars. That is the complaint.",
    },
    {
      aliases: ["light", "lights", "lamps", "warm light"],
      description: "Warm light, low enough to flatter the mismatched glasses.",
    },
    {
      aliases: ["complaint", "supplier complaint", "letter", "draft"],
      description:
        "The supplier complaint, drafted and redrafted to sound less threatening.",
    },
  ],
  shop: [
    {
      aliases: [
        "clearance lot",
        "lot",
        "photographer's lot",
        "photographer's clearance lot",
        "stock",
        "photographer's stock",
        "prints",
        "boxes",
      ],
      description:
        "A photographer's clearance lot: boxes of prints and paperwork, half sorted.",
    },
    {
      aliases: ["shelves", "shelf"],
      description: "Shelves of secondhand oddments, priced in pencil.",
    },
  ],
  booth: [
    {
      aliases: ["table", "low table"],
      description: "A low table, its surface ringed by years of glasses.",
    },
    {
      aliases: ["lamp", "shaded lamp", "light"],
      description:
        "A lamp with its shade turned toward the wall, keeping the light low.",
    },
    {
      aliases: ["wall"],
      description: "Bare wall, taking most of the lamplight.",
    },
  ],
  home: [
    { aliases: ["kettle"], description: "The kettle. It has no theories." },
  ],
};

// People are examinable where they are present. One physical, neutral line
// each, taken from what the room prose already says.
export interface Person {
  id: "sable" | "vesper";
  name: string;
  aliases: string[];
  description: string;
}
export const people: Person[] = [
  {
    id: "sable",
    name: "Sable",
    aliases: ["sable"],
    description: "Sable, pencil tucked behind one ear.",
  },
  {
    id: "vesper",
    name: "Vesper",
    aliases: ["vesper"],
    description: "Vesper, sorting a photographer's clearance lot.",
  },
];

// Sensory verbs answer per room with one line and change nothing.
export type Sense = "sit" | "stand" | "listen" | "smell";
export const senses: Record<Room, Record<Sense, string>> = {
  bar: {
    sit: "You take a stool at the counter.",
    stand: "You stand; the stool keeps your place.",
    listen: "A soft bass line from the speakers, and glass on wood.",
    smell: "Coffee, citrus cordial and warm wood.",
  },
  shop: {
    sit: "There is nowhere to sit among the boxes, so you lean.",
    stand: "You are on your feet already, between the boxes.",
    listen: "Paper being sorted, and the street outside.",
    smell: "Old paper and dust.",
  },
  booth: {
    sit: "You settle into the booth.",
    stand: "You stand up from the booth.",
    listen: "The bar, muffled by the curtain.",
    smell: "Lamp warmth and old upholstery.",
  },
  home: {
    sit: "You sit down at home.",
    stand: "You get up again.",
    listen: "The kettle ticking as it cools, and nothing else.",
    smell: "Your own apartment, faintly of tea.",
  },
};

// The rooms each LOOK text calls nearby, and how travel prose names a room.
export const nearby: Record<Room, Room[]> = {
  bar: ["shop", "booth", "home"],
  shop: ["bar", "home"],
  booth: ["bar"],
  home: ["bar", "shop"],
};
export const spoken: Record<Room, string> = {
  bar: "the Velvet Corner",
  shop: "the secondhand shop",
  booth: "the quiet booth",
  home: "your apartment",
};
