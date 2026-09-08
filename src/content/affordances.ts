import { entitySchema, type Entity } from "../engine/world-types";
// Small authored details, attached to existing rooms. No new district or plot evidence.
const details: Record<
  string,
  [string, string, string, Partial<Entity>["properties"]?][]
> = {
  taxi: [
    [
      "seat",
      "back seat",
      "The vinyl has a repaired seam. The dry patch beside you is exactly envelope-sized.",
      {
        sit: true,
        lean: true,
        touch: "The seat is warm where you've been sitting.",
      },
    ],
    [
      "window",
      "taxi window",
      "Rain turns the sign across the road into a red smear.",
      {
        touch:
          "Cold glass. Your fingerprint briefly interrupts the condensation.",
      },
    ],
    [
      "meter",
      "taxi meter",
      "A little green display holds the fare. Reading it doesn't add another dollar.",
    ],
    [
      "receipt",
      "cab receipt",
      "Velvet / side entrance. The driver has circled the address, not your name.",
      {
        read: "A local cab receipt. The destination is Velvet's side entrance.",
      },
    ],
    ["light", "ceiling light", "The plastic cover is amber with age."],
  ],
  street: [
    [
      "awning",
      "narrow awning",
      "The awning catches most of the rain. The exception has found your collar.",
      { touch: "Water gathers along its metal edge." },
    ],
    [
      "window",
      "club window",
      "Frosted glass admits shapes and light, but no clear faces.",
    ],
    [
      "sign",
      "velvet sign",
      "VELVET. One letter hums louder than the others.",
      { listen: "The transformer buzzes between passing cars." },
    ],
    [
      "bin",
      "street bin",
      "An umbrella has been folded into the bin with unreasonable determination.",
      {
        search: "Flyers, a broken umbrella, a paper cup. Nothing identifying.",
      },
    ],
    [
      "wall",
      "brick wall",
      "Brick polished at shoulder height by people waiting.",
      { lean: true, touch: "Cool, rough brick; damp mortar." },
    ],
  ],
  vestibule: [
    [
      "bench",
      "wooden bench",
      "A dry bench faces the entrance. One leg wears a paper shim.",
      { sit: true, lean: true },
    ],
    [
      "notice",
      "toilet notice",
      "TOILETS ON THE LEFT. Underneath: CURRENTLY.",
      {
        read: "The working toilets are on the left. The added word CURRENTLY is underlined twice.",
      },
    ],
    [
      "heater",
      "portable heater",
      "A quiet orange element behind a wire guard.",
      {
        touch: "You hold your hands near the guard. The warmth is enough.",
        listen: "The heater ticks as the metal expands.",
      },
    ],
    [
      "book",
      "entry book",
      "An alias book, shut beside Inez's chair. Names stay on their own side of the cover.",
      { read: "The cover says ENTRY. Other people's entries remain private." },
    ],
    [
      "bag",
      "paper bag",
      "Clear tape reinforces the base. The handles have outlasted the rest of it.",
    ],
  ],
  bar: [
    [
      "stool",
      "bar stool",
      "The seat turns a quarter revolution before deciding against it.",
      { sit: true, lean: true },
    ],
    [
      "shelves",
      "bottle shelves",
      "Marker labels face outward. A chipped cup guards the end of the row.",
    ],
    [
      "glass",
      "empty glass",
      "A clean glass on a folded towel. A tiny chip has been marked for the supplier.",
      { touch: "The rim is dry; you avoid the marked chip." },
    ],
    [
      "light",
      "pendant light",
      "An amber shade makes the counter look warmer than it is.",
    ],
    [
      "window",
      "high window",
      "The glass is too high for anyone to watch the street without a ladder.",
    ],
    [
      "bin",
      "bar bin",
      "A lined bin under the counter.",
      {
        search:
          "Citrus peel, till paper and a broken plastic stirrer. No abandoned evidence.",
      },
    ],
    [
      "clock",
      "bar clock",
      "The clock above the cups is readable from the whole counter.",
    ],
  ],
  cloakroom: [
    [
      "bench",
      "cloakroom bench",
      "A bench with enough room to change shoes without balancing on one foot.",
      { sit: true, lean: true },
    ],
    ["rack", "coat rack", "Wire hangers lean together in small conspiracies."],
    [
      "mirror",
      "long mirror",
      "A narrow mirror gives back the clothes you're actually wearing.",
    ],
    [
      "sign",
      "claim sign",
      "KEEP YOUR CLAIM SLIP. Someone has added: ESPECIALLY YOU.",
      {
        read: "Keep your claim slip. The addition looks addressed to a regular.",
      },
    ],
    [
      "basket",
      "umbrella basket",
      "The umbrellas are still dripping. None belongs to you.",
    ],
  ],
  washroom: [
    [
      "mirror",
      "striped mirror",
      "A clean stripe crosses the mirror at eye level.",
      { touch: "You leave the clean stripe alone." },
    ],
    [
      "sink",
      "porcelain sink",
      "The tap closes with one extra turn.",
      { touch: "Cold porcelain, a little water around the base." },
    ],
    [
      "partition",
      "partition",
      "Painted wood separates the room from the next cubicle.",
      {
        listen:
          "Two voices travel through the partition, intermittently lost under the plumbing.",
      },
    ],
    [
      "light",
      "fluorescent light",
      "A fluorescent tube takes a fraction too long between hums.",
      { listen: "A faint electrical hum." },
    ],
    [
      "bin",
      "paper bin",
      "Paper towels, folded as if neatness might reduce their number.",
      { search: "Used paper towels. You leave them where they are." },
    ],
  ],
  kitchen: [
    [
      "chair",
      "spare chair",
      "The spare chair is clear, and nobody has put your name on it.",
      { sit: true, lean: true },
    ],
    [
      "bench",
      "repair bench",
      "A dismantled closer occupies one end; the other end is clear.",
      { lean: true },
    ],
    [
      "fan",
      "kitchen fan",
      "A small fan in a scratched casing. Its housing has been opened before.",
      {
        touch: "You keep your fingers away from the blades.",
        listen: "The housing rattles between rotations.",
      },
    ],
    [
      "cupboard",
      "plate cupboard",
      "A note on the handle says CROOKED SHELF. Opening it would make plates everybody's problem.",
      { read: "CROOKED SHELF. Ask Mara before moving anything." },
    ],
    [
      "hatch",
      "service hatch",
      "The bar is visible through the hatch; you can hear orders without following every word.",
      { listen: "An order, the scrape of a cup, then a short thank-you." },
    ],
    [
      "packet",
      "crisp packet",
      "A packet of crisps bears a staff member's name.",
      { read: "MARA. Apparently even crisps need an established custodian." },
    ],
  ],
  stage: [
    [
      "chair",
      "ordinary seat",
      "A chair against the wall, out of the cable's way.",
      { sit: true, lean: true },
    ],
    ["keyboard", "keyboard", "A battered keyboard with one very new key."],
    [
      "cable",
      "audio cable",
      "A cable has twisted itself into a shape nobody remembers making.",
      {
        touch:
          "The rubber insulation feels intact. You leave the connection in place.",
      },
    ],
    [
      "speaker",
      "stage speaker",
      "A speaker wears an apologetic strip of tape over its grille.",
      {
        listen:
          "Bass through the casing; the higher notes come from somewhere else.",
      },
    ],
    [
      "keys",
      "spare keys",
      "One tag says UNKNOWN, carefully printed. That is a kind of progress.",
      { read: "UNKNOWN. STORAGE. UNKNOWN BUT DIFFERENT." },
    ],
  ],
  salon: [
    [
      "chair",
      "salon chair",
      "Chairs form a loose circle with a wide space near the entrance.",
      { sit: true, lean: true },
    ],
    [
      "table",
      "small table",
      "An ordinary table stands in the middle of the circle.",
      { lean: true },
    ],
    ["light", "shaded lamp", "A low shade leaves the doorway easy to see."],
    [
      "sign",
      "salon notice",
      "Participation is optional. Leaving is not an interruption.",
      { read: "Participation is optional. Leaving is not an interruption." },
    ],
    [
      "curtain",
      "heavy curtain",
      "Heavy cloth takes the sharp edge off the sound from the floor.",
      { touch: "Dense cloth, cool near the window." },
    ],
  ],
  landing: [
    [
      "rail",
      "stair rail",
      "The rail has been repaired where most hands turn the corner.",
      { lean: true, touch: "The join is smooth under your palm." },
    ],
    [
      "light",
      "landing light",
      "An unshaded bulb makes this corridor unusually honest.",
    ],
    [
      "sign",
      "reception sign",
      "WITNESS RECEPTION / 00:20 / THROUGH THE CORRIDOR.",
      { read: "Witness reception, exchange room, 00:20." },
    ],
    [
      "window",
      "landing window",
      "The service road appears between two buildings.",
    ],
    [
      "carpet",
      "worn carpet",
      "The centre of the carpet is pale from years of footsteps.",
      { search: "A repaired edge, no concealed panel." },
    ],
  ],
  office: [
    [
      "chair",
      "office chair",
      "The chair's arms don't quite fit under the desk.",
      { sit: true, lean: true },
    ],
    [
      "window",
      "office window",
      "The window reflects the desk more clearly than the street.",
    ],
    ["lamp", "desk lamp", "The pool of light leaves both drawers visible."],
    [
      "paperwork",
      "stacked paperwork",
      "Forms are stacked face down. Their printed headings distinguish custody from authorisation.",
      {
        read: "CUSTODY. AUTHORISATION. Two different forms, even when someone clips them together.",
      },
    ],
    [
      "bin",
      "office bin",
      "A bin for paper offcuts.",
      { search: "Blank margins and used tape. Nothing with a name on it." },
    ],
  ],
  "exchange-room": [
    [
      "chair",
      "mismatched chair",
      "One of the four chairs is distinctly lower than the others.",
      { sit: true, lean: true },
    ],
    [
      "table",
      "exchange table",
      "Cup rings stop abruptly where the document box sits.",
      { lean: true },
    ],
    [
      "stain",
      "water stain",
      "A brown tide-mark above the window. No one has tried to frame it.",
    ],
    [
      "window",
      "exchange window",
      "The frame has swollen in its paint. It stays shut.",
    ],
    [
      "box",
      "document box",
      "A grey document box belongs to the transfer. Its contents are handled through the custody record.",
      { touch: "You leave the box in its recorded custody." },
    ],
  ],
  archive: [
    [
      "table",
      "service table",
      "A clear patch of table under a practical lamp.",
      { lean: true },
    ],
    [
      "lamp",
      "service lamp",
      "The switch has been labelled ON, apparently after an argument.",
    ],
    [
      "copier",
      "service copier",
      "A small copier, scissors and clean paper. Marker alone won't safely redact a name.",
      {
        read: "Copy the covered copy. A dark marker can show through under a light.",
      },
    ],
    [
      "chair",
      "service chair",
      "A plain chair beside the working surface.",
      { sit: true, lean: true },
    ],
    [
      "tray",
      "paper tray",
      "Clean paper in one tray, blank offcuts in another.",
    ],
  ],
  "loading-bay": [
    [
      "trolley",
      "archive trolley",
      "Rubber wheels have carried something heavier than groceries.",
      { touch: "Cold handle, wet at the ends." },
    ],
    [
      "marks",
      "wheel marks",
      "Two tracks run up the ramp and break at the loading door.",
      {
        search:
          "The tracks establish a path. They don't establish who signed for the box.",
      },
    ],
    [
      "sign",
      "bus stop sign",
      "The last departure is listed as 00:26.",
      { read: "Last departure: 00:26. The timetable offers no negotiations." },
    ],
    [
      "bench",
      "bus bench",
      "The far end of the bench has stayed dry.",
      { sit: true, lean: true },
    ],
    [
      "light",
      "security light",
      "The light comes on a second after someone needs it.",
    ],
  ],
  kiosk: [
    [
      "counter",
      "kiosk counter",
      "A narrow counter faces the steam-clouded glass.",
      { lean: true },
    ],
    [
      "menu",
      "soup menu",
      "SOUP. BREAD. SOUP WITH BREAD. A modest theory of dinner.",
      {
        read: "Soup, bread, or both. The prices are written over older prices.",
      },
    ],
    [
      "stool",
      "kiosk stool",
      "A stool just far enough under the awning.",
      { sit: true, lean: true },
    ],
    ["napkin", "paper napkin", "An unused napkin held down by a spoon."],
    [
      "window",
      "steamed glass",
      "Steam leaves a clear circle where someone wiped it with a sleeve.",
    ],
  ],
  apartment: [
    [
      "chair",
      "kitchen chair",
      "A shirt dries over one chair; the other is clear.",
      { sit: true, lean: true },
    ],
    [
      "window",
      "apartment window",
      "A familiar pane of glass. Its reflection looks more tired than mysterious.",
    ],
    [
      "mug",
      "mug in the sink",
      "Your usual mug. The handle's chip has become part of how you hold it.",
      { touch: "The mug is cold. You turn the chipped side away." },
    ],
    [
      "fridge",
      "refrigerator",
      "The refrigerator alternates between two pitches.",
      { listen: "The familiar double hum, with a click between the notes." },
    ],
    [
      "table",
      "kitchen table",
      "A dry, unclaimed space for whatever you brought home.",
      { lean: true },
    ],
    [
      "menus",
      "takeaway menus",
      "A stack of menus, older than the plans they were saved for.",
      {
        read: "Several numbers have changed. Your appetite has not yet committed.",
      },
    ],
  ],
  motel: [
    [
      "sign",
      "exit sign",
      "An arrow points back to the door you entered through.",
      { read: "EXIT. You can return home whenever you want." },
    ],
    [
      "machine",
      "vending machine",
      "A bright vending machine with nothing in its collection slot.",
      {
        listen: "A compressor hum, then a coin rattling somewhere unreachable.",
      },
    ],
    [
      "door",
      "room 06 door",
      "An ordinary closed door. Visiting this corridor doesn't grant access to somebody else's room.",
      { touch: "A painted door, cool beneath your hand." },
    ],
    [
      "carpet",
      "motel carpet",
      "The pattern successfully conceals its original colour.",
    ],
    [
      "chair",
      "lobby chair",
      "A plain chair in view of the exit.",
      { sit: true, lean: true },
    ],
  ],
};
export function ambientEntities(): Entity[] {
  return [
    ...Object.entries(details).flatMap(([room, rows]) =>
      rows.map(([key, name, description, properties]) =>
        entitySchema.parse({
          id: `detail_${room}_${key}`,
          kind: "Object",
          name,
          aliases: [key, name],
          location: room,
          description,
          properties: { scenery: true, ...properties },
          verbs: [
            "examine",
            "check",
            "touch",
            "search",
            "smell",
            "listen",
            ...(properties?.read ? ["read"] : []),
            ...(properties?.sit ? ["sit"] : []),
            ...(properties?.lean ? ["lean"] : []),
          ],
        }),
      ),
    ),
    ...(
      [
        [
          "mara",
          "boots",
          "Mara's work boots",
          "Practical boots with worn soles. They tell you about standing through a shift, not who sent a letter.",
        ],
        [
          "celeste",
          "coat",
          "Celeste's coat",
          "A dark coat folded over her arm when the room is warm.",
        ],
        [
          "luca",
          "jacket",
          "Luca's repaired jacket",
          "Carefully repaired stitching at one elbow.",
        ],
        [
          "inez",
          "keys",
          "Inez's key ring",
          "Unlabelled keys on a plain ring. Looking at them doesn't put them in your pocket.",
        ],
      ] as const
    ).map(([npc, key, name, description]) =>
      entitySchema.parse({
        id: `detail_${npc}_${key}`,
        kind: "Object",
        name,
        description,
        location: npc,
        owner: npc,
        aliases: [`${npc}'s ${key}`, `${npc} ${key}`],
        properties: { onPerson: true, scenery: true },
        verbs: ["examine", "check", "watch"],
      }),
    ),
  ];
}
export const roomAffordances = details;
