import type { Theme, NPCId } from "../engine/types";
export const themeLabels: Record<Theme, { name: string; description: string }> =
  {
    romance: {
      name: "Romance & chemistry",
      description:
        "Optional attraction, private attention and emotional intimacy.",
    },
    socialPressure: {
      name: "Social pressure",
      description: "Status, scrutiny and uncomfortable public choices.",
    },
    surveillance: {
      name: "Surveillance",
      description: "Being observed, anonymity and unwanted attention.",
    },
    substanceUse: {
      name: "Alcohol & substances",
      description:
        "Background references to drinking. No substance use is required.",
    },
    powerExchange: {
      name: "Consensual power exchange",
      description:
        "Negotiated authority, role reversal and the right to refuse.",
    },
    restraint: {
      name: "Ritual & restraint",
      description:
        "Symbolic restrictions, agreed rules and opting out. Non-graphic.",
    },
    symbolicOwnership: {
      name: "Symbolic ownership",
      description:
        "Tokens, collars and belonging as negotiated symbols. Non-graphic.",
    },
    performance: {
      name: "Watching & performance",
      description:
        "Public performance, private audiences and being singled out.",
    },
    fetishFashion: {
      name: "Fetish fashion",
      description:
        "Leather, latex, gloves, boots and masks as fashion and social signals.",
    },
    humiliation: {
      name: "Humiliation themes",
      description:
        "Embarrassment and negotiated mockery. No degradation scenes in this chapter.",
    },
    aftercare: {
      name: "Care after intensity",
      description:
        "Checking in, quiet recovery and respecting distance after charged encounters.",
    },
  };
export interface ThemeEntry {
  id: string;
  name: string;
  theme: Theme;
  context: string;
  orientation: "observe" | "participate" | "either";
  privacy: "private" | "either";
  trust: number;
  compatible: NPCId[];
  observation: string;
  contrast: string;
}
// Mature themes guide authored emphasis, chemistry and compatibility within explicit boundaries.
export const taxonomy: ThemeEntry[] = [
  {
    id: "authority.negotiated",
    name: "Negotiated authority",
    theme: "powerExchange",
    context: "explicit permission",
    orientation: "either",
    privacy: "either",
    trust: 1,
    compatible: ["celeste", "mara"],
    observation:
      "The house protocol has a blank space for exceptions. Someone has used it.",
    contrast:
      "The person in charge asks the cleaner what to do. The cleaner knows.",
  },
  {
    id: "authority.roleReversal",
    name: "Role reversal",
    theme: "powerExchange",
    context: "mutual trust",
    orientation: "either",
    privacy: "private",
    trust: 3,
    compatible: ["celeste"],
    observation:
      "Celeste hands the pen to the guest and waits for their terms.",
    contrast: "No one is leading this conversation. It proceeds anyway.",
  },
  {
    id: "ritual.optOut",
    name: "Opting out of ritual",
    theme: "restraint",
    context: "symbolic rules",
    orientation: "observe",
    privacy: "either",
    trust: 0,
    compatible: ["inez", "mara"],
    observation:
      "At the members’ table, a guest turns their token over. The host moves on without asking why.",
    contrast:
      "A notice says the formal introduction is cancelled. The lift is broken again.",
  },
  {
    id: "belonging.tokens",
    name: "Tokens of belonging",
    theme: "symbolicOwnership",
    context: "explicit agreement",
    orientation: "observe",
    privacy: "private",
    trust: 2,
    compatible: ["celeste"],
    observation:
      "A guest returns a ribbon and receives their coat. The host thanks them for coming.",
    contrast:
      "The elaborate token fits the vending machine just as badly as an ordinary coin.",
  },
  {
    id: "attention.private",
    name: "Private attention",
    theme: "romance",
    context: "established trust",
    orientation: "either",
    privacy: "private",
    trust: 3,
    compatible: ["mara", "celeste", "luca"],
    observation:
      "A conversation pauses until the corridor empties. The pause feels considerate.",
    contrast: "There is an empty chair, but no invitation attached to it.",
  },
  {
    id: "performance.observer",
    name: "Choosing to watch",
    theme: "performance",
    context: "public performance",
    orientation: "observe",
    privacy: "either",
    trust: 0,
    compatible: ["luca"],
    observation:
      "The performer acknowledges the back row before the people standing nearest the stage.",
    contrast: "The stage is being used to stack spare chairs.",
  },
  {
    id: "fashion.materials",
    name: "Materials & presentation",
    theme: "fetishFashion",
    context: "fashion, not availability",
    orientation: "observe",
    privacy: "either",
    trust: 0,
    compatible: ["celeste", "luca"],
    observation:
      "A pair of leather gloves rests beside a patched canvas bag. Neither tells you what its owner will agree to.",
    contrast:
      "The most formally dressed guest is wearing trainers under the table.",
  },
  {
    id: "embarrassment.repair",
    name: "Repair after embarrassment",
    theme: "humiliation",
    context: "trust and permission",
    orientation: "either",
    privacy: "private",
    trust: 4,
    compatible: ["luca"],
    observation:
      "A joke lands badly. Its teller apologises instead of calling the other person sensitive.",
    contrast: "Nobody comments when a cup tips over. They pass a towel.",
  },
  {
    id: "care.checkIn",
    name: "A check-in without obligation",
    theme: "aftercare",
    context: "after interpersonal intensity",
    orientation: "either",
    privacy: "private",
    trust: 1,
    compatible: ["mara", "inez"],
    observation:
      "Someone asks whether you want company or quiet. They wait for the whole answer.",
    contrast: "For a few minutes, nobody needs anything from you.",
  },
];
