import type { SceneCard, Category, NPCId } from "../engine/types";
// Cards precede prose. They are the production contract used by narrative QA.
export function card(
  purpose: string,
  pacing: Category,
  mayReveal: string[] = [],
  npcKnowledge: Partial<Record<NPCId, string[]>> = {},
  extra: Partial<SceneCard> = {},
): SceneCard {
  return {
    purpose,
    world:
      "Friday night; the 00:20 exchange and 00:26 departure proceed without the player.",
    playerKnowledge: [],
    npcKnowledge,
    npcBeliefs: {},
    goals: "Obtain informed cooperation without giving up the source.",
    emotion:
      "Tired, guarded; willingness to listen depends on witnessed conduct.",
    hidden:
      "Seed-variable authorship until an authenticated object is examined.",
    mayReveal,
    mustNotReveal: ["unearned NPC memories", "unobserved player decisions"],
    approaches: ["ask directly", "protect privacy", "leave"],
    consequences: [
      "Time advances; choices write explicit effects to the transcript.",
    ],
    tension: 2,
    pacing,
    entry: "Previous scene choice points here and its conditions are met.",
    exit: "A listed choice commits; refusing intimacy never blocks investigation.",
    callbacks: [
      "Alias used with permission",
      "Earlier handling of confidential information",
    ],
    ...extra,
  };
}
export const cards: Record<string, SceneCard> = {
  arrival: card(
    "Start inside the taxi; the player chooses how to enter the city.",
    "unease",
    [],
    {},
    { hidden: "Who sent the message", tension: 1 },
  ),
  door: card(
    "Alias and first account of the invitation establish a traceable lie or disclosure.",
    "pressure",
    ["header"],
    { inez: ["header", "motel", "signature"] },
    { npcBeliefs: { inez: "Sender identity is an inference, not a fact." } },
  ),
  vestibule: card(
    "Establish workplace reality and the price of membership.",
    "mundane",
  ),
  bar: card(
    "Mara remembers a mundane preference; let trust begin through attention.",
    "mundane",
    [],
    { mara: ["tenantRisk", "missingNames"] },
    { callbacks: ["Tea or coffee returns in the apartment message."] },
  ),
  coat: card(
    "Clothing creates a social first impression and access conditions.",
    "pressure",
  ),
  floor: card(
    "Offer competing invitations and clearly show the time cost.",
    "mystery",
  ),
  mara: card(
    "Protection has costs; Mara asks before involving another person.",
    "conflict",
    ["tenantRisk"],
    { mara: ["tenantRisk"] },
    { tension: 3 },
  ),
  kitchen: card(
    "Humanize Mara through a broken fan and a shared late meal.",
    "mundane",
  ),
  quiet: card(
    "Optional reciprocal romantic attention, with an equal neutral path.",
    "intimacy",
    [],
    {},
    { tension: 3 },
  ),
  celeste: card(
    "Celeste offers access in return for accepting witness status.",
    "pressure",
    ["signature"],
    { celeste: ["tenantRisk", "boardCopy"] },
    { tension: 3 },
  ),
  terms: card(
    "A formal agreement hides its pressure in respectable wording.",
    "investigation",
    ["signature"],
  ),
  luca: card(
    "Let Luca misunderstand sympathy as an agreement to publish.",
    "humour",
    [],
    { luca: ["tenantRisk"] },
  ),
  radio: card(
    "Question Luca about the human cost of his archive.",
    "conflict",
    ["tenantRisk"],
    { luca: ["tenantRisk"] },
  ),
  inez: card(
    "The printer timing has an ordinary explanation; remove a false supernatural inference.",
    "investigation",
    ["header", "signature"],
    { inez: ["header", "signature", "motel"] },
  ),
  register: card(
    "Offer a private document without turning Inez into an oracle.",
    "mundane",
  ),
  washroom: card(
    "Contrast the social pressure with banal club maintenance.",
    "humour",
  ),
  overhear: card(
    "The player can expose or preserve an absent person’s confidence.",
    "conflict",
  ),
  street: card(
    "Surface the departure deadline and offer a way to leave.",
    "unease",
  ),
  kiosk: card(
    "Use ordinary talk to earn a contact and waste real time.",
    "mundane",
  ),
  decision: card(
    "Make the mutually exclusive time commitments legible.",
    "pressure",
    [],
    {},
    {
      tension: 4,
      consequences: [
        "Upstairs consumes the witness window; loading bay consumes the exchange window.",
      ],
    },
  ),
  exchange: card(
    "Witness the ledger move; attendance changes the board’s public account.",
    "conflict",
    ["tenantRisk"],
    { celeste: ["tenantRisk", "boardCopy"] },
  ),
  objection: card(
    "Composure changes the available way of objecting, never the ability to leave.",
    "pressure",
    ["boardCopy"],
    { celeste: ["boardCopy"] },
  ),
  bay: card(
    "Meet the departing witness and learn the box moved before the exchange.",
    "investigation",
    ["witness", "signature"],
    { inez: ["header", "signature", "motel"] },
  ),
  bus: card("Pay a cost for helping the witness depart.", "mundane"),
  missed: card(
    "Absence is a branch with material world consequences.",
    "unease",
  ),
  aftermath: card(
    "Bring the missed event and distorted reputation back into play.",
    "conflict",
  ),
  contradiction: card(
    "Only Luca confronts the lie; Mara cannot learn it without a message.",
    "conflict",
    [],
    { luca: ["tenantRisk"] },
    {
      npcBeliefs: {
        luca: "Player claimed a different invitation origin to the custodian.",
      },
    },
  ),
  confession: card(
    "Repair is possible but a confession does not erase the first lie.",
    "intimacy",
  ),
  archive: card(
    "Recover the physical proof through the attended route or a slower alternative.",
    "investigation",
    ["missingNames"],
  ),
  hidden: card(
    "Reward a small, trusted act with an optional record of the erased names.",
    "intimacy",
    ["missingNames"],
    { mara: ["missingNames", "tenantRisk"] },
  ),
  proof: card(
    "Authenticate a curated seed-specific sender; distinguish motive from absolution.",
    "mystery",
    ["sender", "carbonProof", "proxyProof", "registerProof"],
  ),
  sender: card(
    "Give an answer and a specific motive, not another evasive riddle.",
    "conflict",
  ),
  ledger: card(
    "Make the final document decision costly in every direction.",
    "conflict",
    ["tenantRisk"],
  ),
  redact: card(
    "Protect names at the cost of immediate public verification.",
    "investigation",
  ),
  publish: card(
    "Publish evidence; the source becomes exposed along with the institution.",
    "conflict",
  ),
  bargain: card(
    "Trade custody for influence; the board absorbs the challenge.",
    "pressure",
  ),
  withhold: card(
    "Keep the original and accept that people must act without it.",
    "unease",
  ),
  mirror: card(
    "Reverse the player’s earlier standard for withholding information.",
    "intimacy",
  ),
  walk: card(
    "Let a mundane remembered preference return after the crisis.",
    "mundane",
  ),
  apartment: card(
    "Return home with evidence, unresolved relationships and messages.",
    "mundane",
  ),
  reflection: card(
    "Let the player name their own interpretation, including uncertainty or refusal.",
    "intimacy",
  ),
  dawn: card(
    "Show concrete ending consequences before offering the Motel hook.",
    "mystery",
  ),
  motel: card(
    "Open a grounded future hook without withholding this chapter’s answer.",
    "unease",
    ["motel"],
    { inez: ["motel"] },
  ),
  end_protect: card(
    "Conclude protection route with a cost and an independent ally.",
    "mundane",
  ),
  end_public: card(
    "Conclude exposure route with public movement and private damage.",
    "conflict",
  ),
  end_power: card(
    "Conclude institutional route with access and complicity.",
    "pressure",
  ),
  end_ghost: card(
    "Conclude withdrawal route with custody, isolation and an open question.",
    "unease",
  ),
};
Object.assign(cards, {
  salon: card(
    "Establish an adult social ritual through explicitly negotiated limits; player can observe or decline.",
    "pressure",
    [],
    { celeste: ["boardCopy"] },
    {
      hidden: "The patron’s personal boundaries remain private.",
      tension: 3,
      callbacks: ["A token returned without explanation"],
    },
  ),
  reversal: card(
    "Let Celeste temporarily give the player control of the introduction; intimacy is a concession, not submission on demand.",
    "intimacy",
    [],
    { celeste: ["boardCopy"] },
    { tension: 3, callbacks: ["Who had permission to use a name"] },
  ),
  listening: card(
    "Give Luca an ordinary, private music moment distinct from his public persona.",
    "intimacy",
    [],
    { luca: ["tenantRisk"] },
    {
      tension: 2,
      callbacks: ["A track sent after publication even when trust is strained"],
    },
  ),
  casework: card(
    "Offer a slower, player-directed investigation of the seeded motive and its costs.",
    "investigation",
    ["sender"],
  ),
  carbon_case: card(
    "Mara’s invitation reopens a betrayal about who controlled the tenant archive.",
    "conflict",
    ["missingNames"],
    { mara: ["missingNames", "tenantRisk"] },
    { hidden: "Names of former tenants never appear." },
  ),
  proxy_case: card(
    "Celeste’s intended witness role changes a board vote, not just the invitation text.",
    "pressure",
    ["boardCopy"],
    { celeste: ["boardCopy"] },
    {
      consequences: [
        "Objecting blocks the board from using the witness to break a tied vote.",
      ],
    },
  ),
  letter_case: card(
    "Inez’s misdelivery reveals a living addressee who may or may not consent to contact.",
    "unease",
    ["motel"],
    { inez: ["motel", "signature"] },
    { hidden: "The former tenant’s legal identity is not revealed." },
  ),
  source_call: card(
    "A named person can refuse corroboration; make player respect for autonomy costly.",
    "conflict",
    [],
    { mara: ["tenantRisk"] },
    { tension: 3 },
  ),
  assembly: card(
    "Compare evidence sources; distinguish what the records establish from what remains inferred.",
    "investigation",
    ["header", "signature", "witness"],
  ),
});
