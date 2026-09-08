import { ambientEntities } from "./affordances";
import {
  entitySchema,
  type Entity,
  type Room,
  type Location,
} from "../engine/world-types";
import { items, variants } from "./world";
import type { GameState } from "../engine/types";
const exit = (
  name: string,
  to: string,
  minutes = 2,
  aliases: string[] = [],
  door?: string,
) => ({ name, to, minutes, aliases, door });
const room = (
  id: string,
  name: string,
  location: Room["location"],
  description: string,
  exits: Room["exits"],
  sound = "Bass travels through the walls. Somewhere, a glass meets a counter.",
  smell = "Wet wool, old wood, a little lemon cleaner.",
): Room => ({ id, name, location, description, exits, sound, smell });
export const rooms: Record<string, Room> = Object.fromEntries(
  [
    room(
      "taxi",
      "An address. A wet street.",
      "taxi",
      "The taxi idles outside Velvet. Your phone holds an unsigned invitation. A black envelope lies beside you on the seat. Beyond the window, a narrow awning shelters the side entrance.",
      [
        exit("outside", "street", 1, [
          "out",
          "street",
          "exit",
          "leave",
          "side entrance",
        ]),
      ],
      "The meter clicks. Rain needles the roof.",
      "Warm vinyl and the driver's mint tea.",
    ),
    room(
      "street",
      "Velvet / side entrance",
      "street",
      "Rain writes over the taxi's tyre marks. Velvet's side entrance glows beneath a narrow awning. The loading bay runs behind the building; a soup kiosk stays lit across the road.",
      [
        exit(
          "inside",
          "vestibule",
          1,
          ["in", "velvet", "entrance", "side entrance"],
          "side_door",
        ),
        exit("loading bay", "loading-bay", 4, [
          "bay",
          "loading door",
          "behind",
          "east",
        ]),
        exit("kiosk", "kiosk", 2, ["across street"]),
        exit("home", "apartment", 18, ["apartment", "west"]),
        exit("front door", "bar", 2, ["front", "front entrance"]),
      ],
    ),
    room(
      "vestibule",
      "The vestibule",
      "velvet",
      "Warm air. Wet wool. A corridor the colour of dried wine. A notice points left to the working toilets. The bar is ahead; a cloakroom opens on the right.",
      [
        exit("bar", "bar", 1, ["inside", "in", "ahead", "north", "floor"]),
        exit("outside", "street", 1, ["out", "south"], "side_door"),
        exit("cloakroom", "cloakroom", 1, ["right", "coat"]),
        exit("washroom", "washroom", 1, ["left", "toilets"]),
      ],
    ),
    room(
      "bar",
      "Velvet / the bar",
      "velvet",
      "A folded towel protects the counter. Two pencils wait beside mismatched cups. The main floor opens toward a small stage; stairs rise beside a quieter salon. A service door leads to the kitchen.",
      [
        exit("vestibule", "vestibule", 1, ["south", "entrance"]),
        exit("outside", "street", 2, ["out", "leave", "front door"]),
        exit("upstairs", "landing", 2, ["up", "stairs"]),
        exit("kitchen", "kitchen", 1, ["service door", "west"]),
        exit("stage", "stage", 1, ["luca", "east", "floor"]),
        exit("salon", "salon", 1),
        exit("archive", "archive", 1, [
          "service table",
          "envelope",
          "documents",
        ]),
      ],
    ),
    room(
      "cloakroom",
      "The cloakroom",
      "velvet",
      "An open rack holds a black jacket. A bench makes a small island beneath the dripping coats.",
      [exit("vestibule", "vestibule", 1, ["out", "leave"])],
    ),
    room(
      "washroom",
      "The working toilets",
      "velvet",
      "The mirror has a clean stripe at eye level. Someone has crossed out a number on the poster and written ASK FIRST.",
      [exit("vestibule", "vestibule", 1, ["out", "leave"])],
      "Water rattles in the pipes. Voices carry from behind the partition.",
    ),
    room(
      "kitchen",
      "A chair beside the repairs",
      "velvet",
      "A door-closer casing lies open beside cooling chips. The spare chair is clear. Through the hatch you can see the bar.",
      [exit("bar", "bar", 1, ["out", "leave", "east"])],
    ),
    room(
      "stage",
      "The small stage",
      "velvet",
      "A cable snakes past a keyboard. Someone has taped UNKNOWN to a ring of spare keys. Headphones rest beside a dead phone.",
      [
        exit("bar", "bar", 1, ["west", "out", "leave"]),
        exit("loading bay", "loading-bay", 4, ["outside", "out back"]),
      ],
    ),
    room(
      "salon",
      "The room beside the floor",
      "velvet",
      "A circle of chairs leaves plenty of room near the door. Nobody has to cross the threshold to see the room.",
      [exit("bar", "bar", 1, ["out", "leave"])],
    ),
    room(
      "landing",
      "Above the bass",
      "upstairs",
      "The stairs end at a narrow landing. Light sits under an office door. The exchange room is farther along the corridor.",
      [
        exit("downstairs", "bar", 2, ["down", "bar", "out"]),
        exit("office", "office", 1, ["inside", "in"], "office_door"),
        exit("exchange room", "exchange-room", 1, [
          "exchange",
          "reception",
          "north",
        ]),
      ],
    ),
    room(
      "office",
      "The office",
      "upstairs",
      "A desk faces the window. There are two drawers and a chair that never quite fits beneath it. The door opens onto the landing.",
      [
        exit(
          "outside",
          "landing",
          1,
          ["out", "leave", "landing"],
          "office_door",
        ),
      ],
    ),
    room(
      "exchange-room",
      "The exchange room",
      "upstairs",
      "Four chairs. One is the wrong height. A document box waits beneath a water stain. The landing remains open behind you.",
      [exit("landing", "landing", 1, ["out", "leave", "south"])],
    ),
    room(
      "archive",
      "The service table",
      "velvet",
      "A lamp illuminates a clear patch of table. After the transfer, the service envelope and ledger will be left here for the outside witness.",
      [exit("bar", "bar", 1, ["out", "leave"])],
    ),
    room(
      "loading-bay",
      "The loading bay",
      "street",
      "Wheel marks cross the loading door. A bus stop faces the service road. A camera watches the trolley ramp with bureaucratic patience.",
      [
        exit("street", "street", 4, ["out", "leave", "west"]),
        exit("stage", "stage", 4, ["inside", "in", "velvet"]),
      ],
    ),
    room(
      "kiosk",
      "The soup kiosk",
      "street",
      "Steam fogs the glass. A handwritten menu promises soup with no further qualifications.",
      [exit("street", "street", 2, ["out", "leave"])],
    ),
    room(
      "apartment",
      "Your apartment",
      "apartment",
      "The refrigerator hums in two keys at once. Your mug is in the sink. The kettle waits beside an unclaimed patch of counter.",
      [
        exit("street", "street", 18, ["outside", "out", "velvet"]),
        exit("motel 27", "motel", 20, ["motel"]),
      ],
    ),
    room(
      "motel",
      "Motel 27",
      "motel",
      "The corridor is lit by an exit sign and a vending machine. Room 06 has an ordinary lock. That feels deliberate.",
      [exit("home", "apartment", 20, ["out", "leave", "apartment"])],
    ),
  ].map((r) => [r.id, r]),
);
export const locations: Location[] = [
  ...new Set(Object.values(rooms).map((r) => r.location)),
].map((id) => ({
  id,
  name: id,
  rooms: Object.values(rooms)
    .filter((r) => r.location === id)
    .map((r) => r.id),
}));
const entity = (
  id: string,
  kind: Entity["kind"],
  name: string,
  location: string,
  description: string,
  extra: Partial<Entity> = {},
): Entity =>
  entitySchema.parse({
    id,
    kind,
    name,
    location,
    description,
    aliases: [id.replaceAll("_", " ")],
    verbs: [
      "examine",
      ...(kind === "Evidence" ? ["read", "show", "give", "tear"] : []),
      ...(kind === "Container" ? ["open", "close", "put"] : []),
      ...(kind === "Door"
        ? ["open", "close", "lock", "unlock", "knock", "listen"]
        : []),
      ...(kind === "Wearable" ? ["wear", "remove"] : []),
      ...(extra.portable ? ["take", "drop", "put", "give", "show"] : []),
    ],
    ...extra,
  });
export function createEntities(s: GameState): Record<string, Entity> {
  const list = [
    entity(
      "envelope",
      "Container",
      "black envelope",
      "taxi",
      "Black paper. No sender. The invitation inside repeats the unsigned message on your phone.",
      {
        portable: true,
        open: false,
        aliases: ["envelope", "black envelope", "invitation envelope"],
      },
    ),
    entity(
      "coat",
      "Wearable",
      "raincoat",
      "player",
      "Rain beads on the shoulders. Its deep pockets can keep a document out of sight.",
      {
        portable: true,
        worn: true,
        open: true,
        aliases: ["coat", "raincoat", "my coat", "pocket", "coat pocket"],
      },
    ),
    entity(
      "formal",
      "Wearable",
      "black jacket",
      "cloakroom",
      "A clean black jacket borrowed from the cloakroom.",
      {
        portable: true,
        worn: false,
        aliases: ["jacket", "black jacket", "formal"],
      },
    ),
    entity(
      "boots",
      "Wearable",
      "work boots",
      "kitchen",
      "A spare pair beside Mara's repair bench. The soles have been carefully patched.",
      {
        portable: true,
        worn: false,
        owner: "mara",
        aliases: ["boots", "work boots", "boots mara gave me"],
      },
    ),
    entity(
      "phone",
      "Phone",
      "your phone",
      "player",
      "The invitation, your contacts, and a cracked corner of glass.",
      { portable: true, aliases: ["phone", "mobile", "my phone"] },
    ),
    entity(
      "side_door",
      "Door",
      "side door",
      "street",
      "The closer coughs when the side door moves.",
      {
        open: true,
        locked: false,
        aliases: ["door", "side door", "entrance"],
        properties: { otherSide: "vestibule" },
      },
    ),
    entity(
      "office_door",
      "Door",
      "office door",
      "landing",
      "Frosted glass above a brass latch.",
      {
        open: false,
        locked: false,
        aliases: ["door", "office door"],
        properties: { otherSide: "office", key: "office_key" },
      },
    ),
    entity(
      "office_key",
      "InventoryItem",
      "brass key",
      "kitchen",
      "A small brass key labelled OFFICE.",
      { portable: true, aliases: ["key", "brass key", "office key"] },
    ),
    entity(
      "desk",
      "Container",
      "desk",
      "office",
      "An old desk, scarred by cups. There is space beneath it.",
      {
        open: true,
        aliases: ["desk", "under desk"],
        properties: { surface: true },
      },
    ),
    entity(
      "top_drawer",
      "Container",
      "top drawer",
      "desk",
      "A shallow drawer with pencil shavings in its corners.",
      { open: false, aliases: ["drawer", "top drawer", "upper drawer"] },
    ),
    entity(
      "bottom_drawer",
      "Container",
      "bottom drawer",
      "desk",
      "A deep drawer, empty except for a loose washer.",
      { open: false, aliases: ["drawer", "bottom drawer", "lower drawer"] },
    ),
    entity(
      "receipt",
      "Evidence",
      "delivery receipt",
      "top_drawer",
      "The receipt separates the delivery header, 23:41, from a print time. They are different fields.",
      {
        portable: true,
        aliases: ["receipt", "docket", "delivery receipt"],
        facts: ["header"],
      },
    ),
    entity(
      "counter",
      "Container",
      "bar counter",
      "bar",
      "A towel, a water ring, the small abrasions of people waiting.",
      {
        open: true,
        aliases: ["counter", "bar", "on bar"],
        properties: { surface: true },
      },
    ),
    entity(
      "poster",
      "Object",
      "venue poster",
      "washroom",
      "Someone has crossed out a number and written ASK FIRST.",
      { aliases: ["poster", "notice"] },
    ),
    entity(
      "camera",
      "Object",
      "loading-bay camera",
      "loading-bay",
      "Its lens covers the ramp. A camera can establish an angle; it cannot establish permission.",
      { aliases: ["camera", "lens"] },
    ),
    entity(
      "loading_door",
      "Door",
      "loading door",
      "loading-bay",
      "Heavy steel, scored at trolley height.",
      { open: false, locked: true, aliases: ["door", "loading door"] },
    ),
    entity(
      "headphones",
      "Object",
      "headphones",
      "stage",
      "One ear cushion has been repaired with blue thread.",
      { aliases: ["headphones", "track", "music"] },
    ),
    entity(
      "work_light",
      "InventoryItem",
      "work light",
      "stage",
      "A battery lamp. The cable is easier to see when someone holds it steady.",
      { portable: true, aliases: ["light", "lamp", "work light"] },
    ),
    entity(
      "glasses",
      "InventoryItem",
      "reading glasses",
      "office",
      "Celeste's reading glasses, with a loose arm waiting to be taped.",
      {
        portable: true,
        owner: "celeste",
        aliases: ["glasses", "reading glasses"],
      },
    ),
    entity(
      "mitten",
      "InventoryItem",
      "blue mitten",
      "unplaced",
      "A small blue mitten from the lost-property bag.",
      { portable: true, aliases: ["mitten", "blue mitten"] },
    ),
    entity(
      "ledge",
      "Container",
      "dry ledge",
      "vestibule",
      "A dry ledge well away from the rain.",
      {
        open: true,
        aliases: ["ledge", "dry ledge"],
        properties: { surface: true },
      },
    ),
    entity(
      "kettle",
      "Object",
      "kettle",
      "apartment",
      "It rattles just before boiling. You know the sound by heart.",
      { aliases: ["kettle"] },
    ),
    entity(
      "routing_envelope",
      "Container",
      "service envelope",
      "archive",
      "A routing envelope containing the physical record of who sent your invitation.",
      {
        visible: false,
        portable: true,
        open: false,
        aliases: ["envelope", "service envelope", "routing envelope"],
      },
    ),
  ];
  for (const [id, item] of Object.entries(items))
    list.push(
      entity(
        id,
        ["tea", "pass", "matchbook", "key27"].includes(id)
          ? "InventoryItem"
          : "Evidence",
        item.name,
        s.inventory.includes(id)
          ? "player"
          : id === variants[s.variant].proof
            ? "routing_envelope"
            : "unplaced",
        item.description,
        {
          portable: true,
          aliases: [
            id,
            item.name.toLowerCase(),
            ...(id === "photo" ? ["photo", "photograph", "picture"] : []),
          ],
          facts:
            id === "invitation"
              ? ["header"]
              : id === variants[s.variant].proof
                ? [variants[s.variant].fact, "sender"]
                : id === "ledger"
                  ? ["tenantRisk"]
                  : [],
        },
      ),
    );
  return Object.fromEntries(
    [...list, ...ambientEntities()].map((e) => [e.id, e]),
  );
}
export const defaultRoom: Record<string, string> = {
  taxi: "taxi",
  street: "street",
  velvet: "bar",
  upstairs: "landing",
  apartment: "apartment",
  motel: "motel",
};
export const sceneRooms: Record<string, string> = {
  arrival: "taxi",
  door: "street",
  vestibule: "vestibule",
  coat: "cloakroom",
  floor: "bar",
  kitchen: "kitchen",
  quiet: "kitchen",
  washroom: "washroom",
  overhear: "washroom",
  street: "street",
  kiosk: "kiosk",
  exchange: "exchange-room",
  objection: "exchange-room",
  bay: "loading-bay",
  bus: "loading-bay",
  archive: "archive",
  proof: "archive",
  ledger: "archive",
  casework: "archive",
  salon: "salon",
  reversal: "salon",
  listening: "stage",
  luca: "stage",
  inez: "vestibule",
  celeste: "landing",
  terms: "office",
  hidden: "kitchen",
};
