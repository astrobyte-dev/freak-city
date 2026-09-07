import type { Effect, NPCId } from "../engine/types";
export const characters: Record<
  NPCId,
  {
    name: string;
    age: number;
    role: string;
    initials: string;
    description: string;
  }
> = {
  mara: {
    name: "Mara Venn",
    age: 32,
    role: "The one behind the bar",
    initials: "MV",
    description:
      "Rolled sleeves. A pencil behind one ear. Always halfway through a task.",
  },
  celeste: {
    name: "Celeste Ardent",
    age: 41,
    role: "The name on the building",
    initials: "CA",
    description:
      "Reading glasses on a silver chain. She keeps the receipts too.",
  },
  luca: {
    name: "Luca Serrin",
    age: 29,
    role: "A voice from the Static",
    initials: "LS",
    description: "A repaired jacket. A phone that has been dead for an hour.",
  },
  inez: {
    name: "Inez Vale",
    age: 56,
    role: "The last person on shift",
    initials: "IV",
    description: "A ring of unlabelled keys. One glove in her coat pocket.",
  },
};
export const items: Record<
  string,
  { name: string; description: string; mark: string }
> = {
  invitation: {
    name: "The invitation",
    description:
      "COME ALONE. DON’T GIVE THEM YOUR REAL NAME. A delivery header reads 23:41.",
    mark: "01",
  },
  carbon: {
    name: "Carbon impression",
    description:
      "A maintenance queue receipt. M. VENN signed the override at 22:16.",
    mark: "02",
  },
  token: {
    name: "Brass authorization",
    description:
      "A numbered proxy token. C. ARDENT is stamped on the underside.",
    mark: "03",
  },
  register: {
    name: "Forwarding register",
    description:
      "Your apartment, someone else’s name. Release authorized by I. VALE.",
    mark: "04",
  },
  ledger: {
    name: "The original ledger",
    description:
      "Tenant names, transfer dates, obligations. Evidence that could also become a weapon.",
    mark: "05",
  },
  redacted: {
    name: "Redacted ledger",
    description:
      "Amounts and authorization intact. Tenant names carefully removed.",
    mark: "06",
  },
  key27: {
    name: "Motel 27 · key 06",
    description:
      "A room key wrapped in a bus timetable. Checkout is written as a question.",
    mark: "27",
  },
  matchbook: {
    name: "Velvet matchbook",
    description: "No matches. Luca’s frequency is pencilled inside: 89.3.",
    mark: "07",
  },
  tea: {
    name: "A paper cup",
    description: "Tea, no sugar. The lid is marked with your alias.",
    mark: "08",
  },
  pass: {
    name: "Upstairs pass",
    description: "A temporary pass. Entry is not the same as belonging.",
    mark: "09",
  },
  photo: {
    name: "Loading-bay photograph",
    description:
      "A trolley carrying an archive box. Without the delivery docket, a photograph alone does not establish custody.",
    mark: "10",
  },
};
export const factLabels: Record<string, string> = {
  header: "23:41 is a delivery header, not the print time.",
  signature: "Your old delivery signature was reused as witness authorization.",
  tenantRisk: "The ledger includes identifiable tenant names.",
  carbonProof: "Mara signed the maintenance-queue override.",
  proxyProof: "Celeste authorized the invitation with a proxy token.",
  registerProof: "Inez released a queued letter meant for the previous tenant.",
  sender: "You have evidence identifying who sent the invitation.",
  boardCopy: "The club board already holds a duplicate of the ledger.",
  witness: "The departing witness saw the archive moved before the exchange.",
  motel: "Motel 27 is a forwarding address used by people leaving the Quarter.",
  missingNames: "Someone removed eleven names before tonight’s transfer.",
};
export const variants = {
  carbon: {
    sender: "Mara Venn",
    motive: "She needed an independent witness outside the old tenant group.",
    proof: "carbon",
    fact: "carbonProof",
    ally: "mara",
    intended: "player",
    secret: "maintenance override",
  },
  proxy: {
    sender: "Celeste Ardent",
    motive:
      "She needed an independent witness to a transfer the board could disown.",
    proof: "token",
    fact: "proxyProof",
    ally: "celeste",
    intended: "player",
    secret: "board duplicate",
  },
  deadletter: {
    sender: "Inez Vale",
    motive:
      "She released a queued letter to find who had reused an old witness signature.",
    proof: "register",
    fact: "registerProof",
    ally: "inez",
    intended: "previous tenant",
    secret: "wrong addressee",
  },
} as const;
export const initialEvents = (): {
  id: string;
  at: number;
  status: "pending";
  effects: Effect[];
}[] => [
  {
    id: "exchange",
    at: 1460,
    status: "pending",
    effects: [
      { type: "flag", key: "exchangeHappened", value: true },
      {
        type: "belief",
        npc: "celeste",
        key: "board",
        value: "The board can no longer be trusted to hold the only copy.",
        source: "Witnessed the 00:20 transfer",
      },
      { type: "relationship", npc: "celeste", axis: "suspicion", amount: 5 },
      {
        type: "message",
        from: "VELVET / SERVICE",
        text: "The upstairs exchange has concluded. The archive is no longer in its original custody.",
      },
    ],
  },
  {
    id: "witness-departs",
    at: 1466,
    status: "pending",
    effects: [
      { type: "flag", key: "witnessGone", value: true },
      {
        type: "belief",
        npc: "luca",
        key: "witness",
        value: "The witness has left the Quarter.",
        source: "Witness sent a departure text",
      },
      {
        type: "message",
        from: "Luca",
        text: "last bus just left. whatever they told you upstairs, someone moved that box before the transfer.",
      },
    ],
  },
  {
    id: "courier",
    at: 1475,
    status: "pending",
    effects: [
      { type: "flag", key: "courierArrived", value: true },
      {
        type: "message",
        from: "UNKNOWN",
        text: "People are comparing their versions of you. Go home before they agree.",
      },
    ],
  },
];
