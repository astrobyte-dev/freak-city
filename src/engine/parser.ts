import { installActivity, activityDescription } from "./activity";
import { parserPassages } from "../content/parser-passages";
import {
  socialResponses,
  socialIntent,
  type SocialIntent,
} from "../content/social-responses";
import {
  patientDetails,
  listeningDetails,
  observationRooms,
  overheardWork,
} from "../content/observation";
import { upgradeWorld } from "./world-validation";
import { taxonomy } from "../content/taxonomy";
import type { GameState, NPCId, Passage, Choice, Effect } from "./types";
import { npcIds } from "./types";
import { transcriptPassageSchema, type Entity } from "./world-types";
import {
  rooms,
  createEntities,
  sceneRooms,
  defaultRoom,
} from "../content/spaces";
import { scenes } from "../content/scenes";
import { characters, factLabels, variants } from "../content/world";
import {
  applyEffects,
  advanceTime,
  availableChoices,
  choiceEnabled,
  getPassages,
  meets,
  formatTime,
  messageReplies,
} from "./game";
import { directObservation } from "./pull";
import { thematicObservation } from "./themes";
import {
  cleanNoun,
  normalize,
  distance,
  parseCommand,
  splitCommands,
  verbs,
  type Command,
} from "./language";
import {
  conversationStart,
  matchIntent,
  contentMigration,
} from "../content/parser-content";
export type ParserPanel = "phone" | "inventory" | "journal" | "map" | "people";
export interface CommandResult {
  state: GameState;
  panel?: ParserPanel;
  ok: boolean;
}
class ActionError extends Error {
  constructor(
    message: string,
    readonly ambiguity?: { noun: string; candidates: string[] },
    readonly category:
      | "unsupported-verb"
      | "missing-noun"
      | "unsupported-topic"
      | "blocked" = "blocked",
  ) {
    super(message);
  }
}
function fail(
  text: string,
  category: ActionError["category"] = "blocked",
): never {
  throw new ActionError(text, undefined, category);
}
const world = (s: GameState) => s.world!;
export function ensureWorld(state: GameState): GameState {
  if (state.world) {
    if (state.world.revision === 2) return state;
    const upgraded = structuredClone(state);
    upgradeWorld(upgraded);
    return upgraded;
  }
  const s = structuredClone(state);
  const fresh = s.history.length === 0;
  const current = sceneRooms[s.scene] ?? defaultRoom[scenes[s.scene].location];
  s.world = {
    version: 1,
    revision: 2,
    subMinute: 0,
    references: {},
    observations: {},
    hints: {},
    room: current,
    entities: createEntities(s),
    visitedRooms: [current],
    conversations: {},
    encounters: {},
    consumed: [],
    transcript: [],
    commandHistory: [],
    quickActions: false,
  };
  if (fresh) {
    world(s).entities.invitation.location = "envelope";
    s.npcs.mara.location = "bar";
    s.npcs.celeste.location = "landing";
    s.npcs.luca.location = "stage";
    s.npcs.inez.location = "vestibule";
  } else {
    world(s).encounters[current] = s.scene;
    world(s).consumed = s.visited.map((id) => `beat:${id}`);
    for (const id of npcIds) {
      const loc = s.npcs[id].location;
      if (!rooms[loc] && defaultRoom[loc])
        s.npcs[id].location = defaultRoom[loc];
      if (loc === "door") s.npcs[id].location = "vestibule";
      if (loc === "main room") s.npcs[id].location = "stage";
    }
    if (s.wardrobe === "formal") {
      world(s).entities.formal.location = "player";
      world(s).entities.formal.worn = true;
      world(s).entities.coat.worn = false;
    }
    if (s.wardrobe === "workwear") world(s).entities.coat.worn = false;
    const custodian = { public: "luca", power: "celeste", protect: "mara" }[
      String(s.flags.ending)
    ];
    if (custodian && !s.inventory.includes("ledger")) {
      world(s).entities.ledger.location = custodian;
      world(s).entities.ledger.owner = custodian;
    }
    // Existing decisions remain authoritative; no evidence is recreated from old scenes.
  }
  const schedule: [string, number, NPCId, string][] = [
    ["mara-repairs", 1445, "mara", "kitchen"],
    ["mara-office", 1450, "mara", "office"],
    ["mara-return", 1458, "mara", "bar"],
    ["celeste-exchange", 1458, "celeste", "exchange-room"],
    ["luca-outside", 1453, "luca", "loading-bay"],
    ["luca-return", 1470, "luca", "stage"],
    ["inez-bay", 1455, "inez", "loading-bay"],
    ["inez-handover", 1478, "inez", "vestibule"],
    ["mara-break", 1560, "mara", "kitchen"],
    ["celeste-call", 1580, "celeste", "off-duty"],
    ["luca-leaves", 1630, "luca", "off-duty"],
    ["inez-leaves", 1620, "inez", "off-duty"],
    ["mara-leaves", 1650, "mara", "off-duty"],
  ];
  for (const [id, at, npc, location] of schedule) {
    if (at > s.time && !s.events.some((e) => e.id === `world:${id}`))
      s.events.push({
        id: `world:${id}`,
        at,
        status: "pending",
        effects: [{ type: "presence", npc, location }],
      });
    else if (fresh && at <= s.time) s.npcs[npc].location = location;
  }
  installActivity(s);
  syncInventory(s);
  world(s).transcript.push({
    command: "",
    at: s.time,
    room: current,
    passages: [{ text: describeRoom(s) }],
  });
  return s;
}
export function isCarried(s: GameState, id: string): boolean {
  let e = world(s).entities[id];
  const seen = new Set<string>();
  while (e && !seen.has(e.id)) {
    seen.add(e.id);
    if (e.destroyed) return false;
    if (e.location === "player") return true;
    e = world(s).entities[e.location];
  }
  return false;
}
export function isVisible(s: GameState, id: string): boolean {
  let e = world(s).entities[id];
  const seen = new Set<string>();
  if (!e || !e.visible || e.destroyed) return false;
  if (e.properties.onPerson && npcIds.includes(e.location as NPCId))
    return s.npcs[e.location as NPCId].location === world(s).room;
  if (e.kind === "Door" && e.properties.otherSide === world(s).room)
    return true;
  while (e && !seen.has(e.id)) {
    seen.add(e.id);
    if (!e.visible || e.destroyed) return false;
    if (e.location === world(s).room || e.location === "player") return true;
    const parent = world(s).entities[e.location];
    if (!parent || parent.open === false) return false;
    e = parent;
  }
  return false;
}
export function syncInventory(s: GameState) {
  s.inventory = Object.keys(world(s).entities).filter((id) => isCarried(s, id));
}
function effects(s: GameState, list: Effect[]) {
  const before = new Set(s.inventory);
  // NPC presence is managed by the scheduler; authored dialogue cannot summon a speaker.
  applyEffects(
    s,
    list.filter((e) => e.type !== "presence"),
  );
  for (const id of s.inventory)
    if (!before.has(id) && world(s).entities[id]) {
      const e = world(s).entities[id];
      if (!e.destroyed) {
        e.location = "player";
        e.visible = true;
      }
    }
  for (const id of before)
    if (!s.inventory.includes(id) && world(s).entities[id])
      world(s).entities[id].location = "unplaced";
  syncInventory(s);
}
export function presentNPCs(s: GameState): NPCId[] {
  return npcIds.filter((n) => s.npcs[n].location === world(s).room);
}
export function describeRoom(s: GameState): string {
  const r = rooms[world(s).room];
  const objects = Object.values(world(s).entities)
    .filter((e) => e.location === r.id && isVisible(s, e.id))
    .map((e) => e.name);
  const people = presentNPCs(s).map((n) => characters[n].name);
  let detail = r.description;
  if (r.id === "exchange-room" && s.flags.exchangeHappened)
    detail =
      "Four chairs stand away from the table. The transfer is over; the document box has gone. The water stain remains.";
  if (r.id === "loading-bay" && s.flags.witnessGone)
    detail =
      "The bus has left. Rain is filling the trolley marks. The camera still watches the empty ramp.";
  if (r.id === "archive" && s.time >= 1467)
    detail =
      "The lamp is still on. The service table holds whatever you have left there.";
  const activity = activityDescription(s, r.id);
  if (activity) detail += `\n\n${activity}`;
  return `${detail}${people.length ? `\n\nHere: ${people.join(", ")}.` : ""}${objects.length ? `\n\nYou can see ${objects.join(", ")}.` : ""}\n\nExits: ${r.exits.map((e) => e.name).join(" · ")}.`;
}
function nameScore(query: string, aliases: string[]) {
  return Math.max(
    ...aliases.map((alias) => {
      const a = cleanNoun(alias);
      if (a === query) return 100;
      if (a.split(" ").includes(query)) return 90;
      if (a.startsWith(query + " ")) return 85;
      if (query.length >= 4 && distance(a, query) <= 1) return 80;
      if (query.length >= 7 && distance(a, query) <= 2) return 70;
      return 0;
    }),
  );
}
function resolve(
  s: GameState,
  noun: string,
  kind: "object" | "person" = "object",
  remote = false,
): string {
  const w = world(s);
  let q = cleanNoun(noun);
  const possessive = q.match(/^(her|his|their) (.+)$/);
  if (possessive) {
    const id =
      possessive[1] === "her"
        ? w.lastFemale
        : possessive[1] === "his"
          ? w.lastMale
          : w.lastPerson;
    if (
      !id ||
      (w.references[
        possessive[1] === "his"
          ? "him"
          : possessive[1] === "their"
            ? "them"
            : "her"
      ] &&
        s.time -
          w.references[
            possessive[1] === "his"
              ? "him"
              : possessive[1] === "their"
                ? "them"
                : "her"
          ].at >
          20)
    )
      fail(
        "Whose belongings do you mean? Name the person once.",
        "missing-noun",
      );
    q = `${id}'s ${possessive[2]}`;
  }
  if (!q)
    fail(
      kind === "person"
        ? "Who do you want to speak to?"
        : "What do you want to interact with?",
    );
  if (["it", "that", "this"].includes(q)) {
    if (
      !w.lastObject ||
      !isVisible(s, w.lastObject) ||
      (w.references.it &&
        s.time - w.references.it.at > 20 &&
        !isCarried(s, w.lastObject))
    )
      fail("What does ‘it’ refer to? Name the object once.", "missing-noun");
    q = w.lastObject;
  }
  if (["her", "him", "them", "she", "he"].includes(q)) {
    const referent = ["her", "she"].includes(q)
      ? w.lastFemale
      : ["him", "he"].includes(q)
        ? w.lastMale
        : w.lastPerson;
    const ref = w.references[q];
    if (!referent || (ref && s.time - ref.at > 20))
      fail("Who do you mean? Name the person once.", "missing-noun");
    q = referent;
  }
  const candidates =
    kind === "person"
      ? npcIds
          .filter((n) => remote || presentNPCs(s).includes(n))
          .map((n) => ({
            id: n,
            score: nameScore(q, [
              n,
              characters[n].name,
              ...{
                mara: ["bartender", "woman behind bar", "woman"],
                celeste: ["owner", "woman by stairs", "woman"],
                luca: ["musician", "man", "man with dead phone"],
                inez: ["custodian", "woman with keys", "woman"],
              }[n],
            ]),
          }))
      : Object.values(w.entities)
          .filter((e) => isVisible(s, e.id))
          .map((e) => ({
            id: e.id,
            score: nameScore(q, [e.id, e.name, ...e.aliases]),
          }));
  candidates.sort((a, b) => b.score - a.score);
  const hiddenExact =
    kind === "object" &&
    Object.values(w.entities).some(
      (e) =>
        !isVisible(s, e.id) &&
        nameScore(q, [e.id, e.name, ...e.aliases]) === 100,
    );
  if (!candidates[0]?.score || (hiddenExact && candidates[0].score < 100)) {
    const known =
      kind === "person"
        ? npcIds.find(
            (n) =>
              nameScore(q, [
                n,
                characters[n].name,
                ...{
                  mara: ["bartender", "woman behind bar", "woman"],
                  celeste: ["owner", "woman by stairs", "woman"],
                  luca: ["musician", "man", "man with dead phone"],
                  inez: ["custodian", "woman with keys", "woman"],
                }[n],
              ]) > 0,
          )
        : undefined;
    if (known)
      fail(
        `${characters[known].name.split(" ")[0]} isn't here. You can text or call them, or look for them elsewhere.`,
      );
    fail(
      `You can't find “${noun}” within reach. LOOK describes what's here; INVENTORY checks what you carry.`,
      "missing-noun",
    );
  }
  const tied = candidates.filter((c) => c.score === candidates[0].score);
  if (tied.length > 1)
    throw new ActionError(
      `Do you mean ${tied.map((c) => w.entities[c.id]?.name ?? characters[c.id as NPCId].name).join(" or ")}?`,
      { noun, candidates: tied.map((c) => c.id) },
    );
  return candidates[0].id;
}
function object(s: GameState, noun: string): Entity {
  const id = resolve(s, noun);
  world(s).lastObject = id;
  world(s).references.it = { id, at: s.time, room: world(s).room };
  return world(s).entities[id];
}
function person(s: GameState, noun: string, remote = false): NPCId {
  const ref = world(s).references.them;
  if (!noun && ref && s.time - ref.at > 20 && presentNPCs(s).length !== 1)
    fail("Who do you mean? Name the person once.", "missing-noun");
  const id = resolve(
    s,
    noun ||
      world(s).lastPerson ||
      (presentNPCs(s).length === 1 ? presentNPCs(s)[0] : ""),
    "person",
    remote,
  ) as NPCId;
  world(s).lastPerson = id;
  for (const pronoun of id === "luca"
    ? ["him", "he", "them"]
    : ["her", "she", "them"])
    world(s).references[pronoun] = { id, at: s.time, room: world(s).room };
  if (id === "luca") world(s).lastMale = id;
  else world(s).lastFemale = id;
  return id;
}
function requireHeld(s: GameState, e: Entity) {
  if (!isCarried(s, e.id)) fail(`You need to take ${e.name} first.`);
}
function requirePhone(s: GameState) {
  if (!isCarried(s, "phone"))
    fail("Your phone isn't with you. Retrieve it before making contact.");
}
function activeChoices(s: GameState): Choice[] {
  const id = world(s).encounters[world(s).room];
  if (!id) return [];
  return availableChoices({ ...s, scene: id }).filter((c) =>
    choiceEnabled(s, c),
  );
}
function beat(s: GameState, id: string, out: Passage[], repeat = false) {
  if (!scenes[id] || s.locked.includes(id)) return;
  const w = world(s),
    scene = scenes[id];
  w.encounters[w.room] = id;
  s.scene = id;
  const speakers = [
    ...new Set(
      scene.passages
        .filter((p) => p.speaker && meets(s, p.when))
        .map((p) => p.speaker!),
    ),
  ];
  if (speakers.length === 1) w.conversations[speakers[0]] = id;
  if (w.consumed.includes(`beat:${id}`) && !repeat) return;
  const blocked = scene.boundaryGate?.themes.some(
    (t) => s.boundaries[t] !== "allowed",
  );
  if (id === "proof") {
    const proof = w.entities[variants[s.variant].proof];
    if (!isVisible(s, proof.id) && !isCarried(s, proof.id)) return;
  }
  if (!w.consumed.includes(`beat:${id}`)) {
    effects(
      s,
      (scene.onEnter ?? []).filter(
        (e) => !(e.type === "schedule" && e.id === "exchange-close"),
      ),
    );
    w.consumed.push(`beat:${id}`);
    if (!s.visited.includes(id)) s.visited.push(id);
    if (id === "inez_r2" && w.entities.mitten.location === "unplaced")
      w.entities.mitten.location = w.room;
    if (id === "celeste" && w.entities.pass.location === "unplaced")
      w.entities.pass.location = w.room;
    syncInventory(s);
  }
  const rendered =
    id === "ledger"
      ? [
          {
            text: "The ledger lies open: tenant names down the left, amounts and authorisations down the right. This is the original. What happens to this physical copy will matter to the people named in it.",
          },
          ...getPassages({ ...s, scene: id }).slice(5),
        ]
      : getPassages({ ...s, scene: id });
  for (const p of parserPassages(id, rendered)) {
    if (
      id === "dawn" &&
      p.text.includes("You know who sent") &&
      !s.canon.player.includes("sender")
    )
      continue;
    if (
      id === "dawn" &&
      p.text.includes("key to Motel") &&
      !isCarried(s, "key27")
    )
      continue;
    if (p.speaker && !presentNPCs(s).includes(p.speaker)) continue;
    if (
      p.speaker &&
      p.reveals?.some((f) => !s.npcs[p.speaker!].knowledge.includes(f))
    )
      continue;
    out.push(p);
    if (p.speaker) {
      w.lastPerson = p.speaker;
      for (const pronoun of p.speaker === "luca"
        ? ["him", "he", "them"]
        : ["her", "she", "them"])
        w.references[pronoun] = { id: p.speaker, at: s.time, room: w.room };
      if (p.speaker === "luca") w.lastMale = p.speaker;
      else w.lastFemale = p.speaker;
    }
    if (!blocked)
      for (const fact of p.reveals ?? [])
        applyEffects(s, [
          {
            type: "knowledge",
            who: "player",
            fact,
            source: p.speaker ? `Told by ${p.speaker}` : `Observed in ${id}`,
          },
        ]);
  }
  s.pacing.recent = [...s.pacing.recent, scene.category].slice(-6);
  s.pacing.observation =
    thematicObservation(s, scene.category) ??
    directObservation(s, scene.category);
  if (s.pacing.observation)
    out.push({
      text: s.pacing.observation,
      theme:
        taxonomy.find(
          (t) =>
            t.observation === s.pacing.observation ||
            t.contrast === s.pacing.observation,
        )?.theme ??
        (
          {
            connection: "romance",
            privacy: "surveillance",
            defiance: "socialPressure",
          } as const
        )[s.pull.lastCue as "connection" | "privacy" | "defiance"],
      safe: "",
      implied: "",
    });
}
function transition(s: GameState, c: Choice, out: Passage[]) {
  const source = world(s).encounters[world(s).room] ?? s.scene;
  const key = `intent:${source}:${c.id}`;
  const speaker = scenes[source].passages.find(
    (p) => p.speaker && meets(s, p.when),
  )?.speaker;
  if (speaker && !presentNPCs(s).includes(speaker))
    fail(
      `${characters[speaker].name.split(" ")[0]} is no longer here to continue that conversation.`,
    );
  if (
    [
      "choose_publish",
      "choose_bargain",
      "choose_redact",
      "choose_withhold",
    ].includes(c.id)
  ) {
    requireHeld(s, world(s).entities.ledger);
    if (s.flags.ending)
      fail(
        "The original has already been committed. Its consequences are part of the night now.",
      );
    if (c.id !== "choose_withhold" && !s.canon.player.includes("sender"))
      fail("Read the routing evidence before committing the original.");
    if (c.id === "choose_publish") person(s, "luca");
    if (c.id === "choose_bargain") person(s, "celeste");
  }
  if (world(s).consumed.includes(key))
    fail("That part of the conversation has already happened.");
  if (!choiceEnabled(s, c) || (c.theme && s.boundaries[c.theme] !== "allowed"))
    fail("That approach isn't available in the current circumstances.");
  effects(s, c.effects ?? []);
  world(s).consumed.push(key);
  if (speaker) delete world(s).conversations[speaker];
  s.history.push({
    scene: source,
    choice: c.id,
    to: c.to,
    at: s.time,
    changes: (c.effects ?? []).map((e) => JSON.stringify(e)),
  });
  // A reply may unlock an encounter elsewhere. It never moves the player there.
  const targetRoom = contentMigration.find((m) => m.id === c.to)!.room;
  const people = scenes[c.to].passages
    .filter((p) => p.speaker && meets(s, p.when))
    .map((p) => p.speaker!);
  if (
    targetRoom === world(s).room ||
    (people.length > 0 && people.every((n) => presentNPCs(s).includes(n)))
  )
    beat(s, c.to, out);
  else {
    world(s).encounters[targetRoom] = c.to;
    delete world(s).encounters[world(s).room];
    out.push({
      text: `Your words are remembered. There is more to follow up in ${rooms[targetRoom].name}.`,
    });
  }
  return c.minutes;
}
function releaseEvidence(s: GameState) {
  if (s.time < 1467) return;
  const w = world(s);
  if (!w.consumed.includes("archive-delivery")) {
    w.consumed.push("archive-delivery");
    w.entities.routing_envelope.visible = true;
    if (w.entities.ledger.location === "unplaced")
      w.entities.ledger.location = "archive";
  }
  if (s.time >= 1600) {
    w.entities.side_door.open = false;
    w.entities.side_door.locked = true;
  }
}
function tick(s: GameState, minutes: number, out: Passage[]) {
  const before = presentNPCs(s);
  const w = world(s);
  const totalSeconds = Math.round(minutes * 60) + w.subMinute;
  const wholeMinutes = Math.floor(totalSeconds / 60);
  w.subMinute = totalSeconds % 60;
  for (let i = 0; i < wholeMinutes; i++) {
    const exchange = s.events.find(
      (e) =>
        e.id === "exchange" && e.status === "pending" && e.at <= s.time + 1,
    );
    if (exchange && w.room === "exchange-room") {
      s.flags.attendedExchange = true;
      beat(s, "exchange", out);
    }
    const beforeItems = new Set(s.inventory);
    advanceTime(s, 1);
    if (
      s.time >= 1456 &&
      s.time < 1460 &&
      !s.flags.workHandover &&
      s.npcs.inez.location === "loading-bay" &&
      s.npcs.luca.location === "loading-bay"
    ) {
      effects(s, [
        { type: "flag", key: "workHandover", value: true },
        ...(["inez", "luca"] as const).map((npc) => ({
          type: "memory" as const,
          npc,
          key: "workHandover",
          value:
            "Compared the equipment-return time at the loading bay; the case is due back after the shift.",
        })),
      ]);
      if (w.room === "loading-bay")
        out.push({
          text: "Inez asks Luca when the equipment case is coming back. After the shift, he says. She writes down the time, then asks him to label the adapter.",
        });
    }
    for (const id of s.inventory)
      if (!beforeItems.has(id) && w.entities[id] && !w.entities[id].destroyed) {
        w.entities[id].location = "player";
        w.entities[id].visible = true;
      }
    for (const id of beforeItems)
      if (!s.inventory.includes(id) && w.entities[id])
        w.entities[id].location = "unplaced";
    releaseEvidence(s);
    if (
      w.room === "loading-bay" &&
      s.time >= 1461 &&
      s.time < 1466 &&
      !s.flags.metWitness &&
      !s.flags.attendedExchange
    ) {
      s.flags.metWitness = true;
      beat(s, "bay", out);
    }
  }
  const after = presentNPCs(s);
  for (const n of before.filter((n) => !after.includes(n)))
    out.push({
      text: `${characters[n].name.split(" ")[0]} leaves to get on with the night.`,
    });
  for (const n of after.filter((n) => !before.includes(n)))
    out.push({ text: `${characters[n].name.split(" ")[0]} comes in.` });
  syncInventory(s);
}
function entry(s: GameState, out: Passage[]) {
  const w = world(s);
  releaseEvidence(s);
  if (
    w.room === "loading-bay" &&
    s.time >= 1461 &&
    s.time < 1466 &&
    !s.flags.metWitness &&
    !s.flags.attendedExchange
  ) {
    s.flags.metWitness = true;
    beat(s, "bay", out);
  }
  const pending = w.encounters[w.room];
  if (pending && !w.consumed.includes(`beat:${pending}`)) beat(s, pending, out);
  if (
    w.room === "apartment" &&
    s.flags.ending &&
    !w.consumed.includes("home-key")
  ) {
    w.consumed.push("home-key");
    const key = w.entities.key27;
    if (key.location === "unplaced") key.location = "apartment";
    out.push({
      text: "A flat envelope lies under the takeaway menus. Inside is a key tagged MOTEL 27, room 06, wrapped in a bus timetable. Inez has written her number beneath it.",
    });
  }
  if (w.room === "motel" && !w.consumed.includes("beat:motel"))
    beat(s, "motel", out);
  if (w.room === "bar" && !w.consumed.includes("venue-notices")) {
    w.consumed.push("venue-notices");
    effects(s, scenes.floor.onEnter ?? []);
  }
  if (
    w.room === "salon" &&
    !w.consumed.includes("beat:salon") &&
    (presentNPCs(s).includes("celeste") ||
      scenes.salon.boundaryGate?.themes.some(
        (t) => s.boundaries[t] !== "allowed",
      ))
  )
    beat(s, "salon", out);
  if (w.room === "washroom" && !w.consumed.includes("beat:washroom"))
    beat(s, "washroom", out);
}
interface Context {
  fallback?: boolean;
  s: GameState;
  c: Command;
  out: Passage[];
  panel?: ParserPanel;
}
type Handler = (ctx: Context) => number;
function move(ctx: Context): number {
  const { s, c, out } = ctx,
    w = world(s),
    r = rooms[w.room];
  let q = c.direct;
  if (!q) {
    if (c.verb === "enter")
      q = r.exits.some((e) => e.name === "inside")
        ? "inside"
        : w.room === "landing"
          ? "office"
          : "";
    else if (c.verb === "leave")
      q = r.exits.some((e) => e.name === "outside")
        ? "outside"
        : r.exits.length === 1
          ? r.exits[0].name
          : "out";
  }
  if (q === "back" && w.previousRoom)
    q = r.exits.find((e) => e.to === w.previousRoom)?.name ?? q;
  const ranked = r.exits
    .map((e) => ({ e, score: nameScore(q, [e.name, ...e.aliases]) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked[0]?.score)
    fail(`From here you can go ${r.exits.map((e) => e.name).join(", ")}.`);
  if (ranked[1]?.score === ranked[0].score)
    fail("Which exit do you mean? Name it from the room description.");
  const exit = ranked[0].e;
  if (exit.door) {
    const door = w.entities[exit.door];
    if (door.locked)
      fail(
        `The ${door.name} is locked.${door.id === "side_door" ? " The front entrance remains open." : ""}`,
      );
    if (!door.open) fail(`The ${door.name} is closed. You can open it.`);
  }
  if (exit.to === "motel" && !isCarried(s, "key27"))
    fail("You don't have an address and room key for Motel 27 yet.");
  // Travel elapses before arrival, so an event cannot be attended from en route.
  tick(s, exit.minutes, out);
  w.previousRoom = w.room;
  w.room = exit.to;
  if (!w.visitedRooms.includes(w.room)) w.visitedRooms.push(w.room);
  s.scene =
    w.encounters[w.room] ??
    {
      taxi: "arrival",
      street: "street",
      bar: "floor",
      landing: "celeste",
      "exchange-room": "decision",
      "loading-bay": "street",
      stage: "floor",
      office: "terms",
      cloakroom: "coat",
      archive: "archive",
    }[w.room] ??
    (scenes[w.room] ? w.room : "floor");
  out.push({ text: describeRoom(s) });
  entry(s, out);
  return 0;
}
function describe({ s, c, out }: Context): number {
  if (c.direct === "people") {
    out.push({
      text: presentNPCs(s).length
        ? `Here: ${presentNPCs(s)
            .map((n) => characters[n].name)
            .join(", ")}.`
        : "Nobody else is here just now.",
    });
    return 0;
  }
  if (!c.direct && c.verb === "check") {
    out.push({ text: describeRoom(s) });
    return 0;
  }
  if (
    c.verb === "look" &&
    (!c.direct || ["around", "room", "here"].includes(c.direct))
  ) {
    out.push({ text: describeRoom(s) });
    return 0;
  }
  if (npcIds.some((n) => nameScore(c.direct, [n, characters[n].name]) > 0)) {
    const n = person(s, c.direct);
    out.push({ text: characters[n].description });
    return 0;
  }
  const e = object(s, c.direct);
  out.push({
    text:
      c.verb === "read" && typeof e.properties.read === "string"
        ? e.properties.read
        : e.description,
  });
  if (e.locked !== undefined)
    out.push({
      text: `The ${e.name} is ${e.open ? "open" : "closed"} and ${e.locked ? "locked" : "unlocked"}.`,
    });
  if (e.id === "detail_bar_clock")
    out.push({ text: `It reads ${formatTime(s.time)}.` });
  if (e.open) {
    const inside = Object.values(world(s).entities).filter(
      (x) => x.location === e.id && isVisible(s, x.id),
    );
    out.push({
      text: inside.length
        ? `Inside: ${inside.map((x) => x.name).join(", ")}.`
        : "There is nothing inside.",
    });
  }
  if (e.kind === "Evidence")
    for (const fact of e.facts)
      applyEffects(s, [
        { type: "knowledge", who: "player", fact, source: `Read ${e.name}` },
      ]);
  if (e.id === variants[s.variant].proof) beat(s, "proof", out);
  if (e.id === "ledger" && !world(s).consumed.includes("beat:ledger"))
    beat(s, "ledger", out);
  return c.verb === "read" ? 1 : 0;
}
function handleTake({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  if (!e.portable)
    fail(`The ${e.name} is part of the room; you can't carry it.`);
  if (isCarried(s, e.id) && e.location === "player")
    fail(`You already have ${e.name}.`);
  e.location = "player";
  e.owner = "player";
  syncInventory(s);
  out.push({ text: `You take ${e.name}.` });
  return 1;
}
function containerAction({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  if (e.open === undefined) fail(`The ${e.name} doesn't open or close.`);
  if (c.verb === "open" && e.locked)
    fail(`The ${e.name} is locked. You need its key.`);
  if (c.verb === "close" && e.properties.surface)
    fail(`The ${e.name} is an open surface.`);
  if (e.open === (c.verb === "open"))
    fail(`The ${e.name} is already ${e.open ? "open" : "closed"}.`);
  e.open = c.verb === "open";
  out.push({ text: `You ${c.verb} ${e.name}.` });
  if (e.open) {
    const contents = Object.values(world(s).entities).filter(
      (x) => x.location === e.id && isVisible(s, x.id),
    );
    if (contents.length)
      out.push({ text: `Inside: ${contents.map((x) => x.name).join(", ")}.` });
  }
  return 1;
}
function lockAction({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  if (e.locked === undefined) fail(`The ${e.name} has no lock.`);
  const key = c.indirect
    ? object(s, c.indirect)
    : Object.values(world(s).entities).find(
        (x) => x.id === e.properties.key && isCarried(s, x.id),
      );
  if (!key) fail(`You need a matching key to ${c.verb} ${e.name}.`);
  requireHeld(s, key);
  if (e.properties.key !== key.id)
    fail(`The ${key.name} doesn't fit that lock.`);
  if (e.open && c.verb === "lock") fail(`Close ${e.name} first.`);
  e.locked = c.verb === "lock";
  out.push({ text: `You ${c.verb} ${e.name}.` });
  return 1;
}
function transfer({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  requireHeld(s, e);
  if (c.verb === "drop") {
    e.location = world(s).room;
    e.worn = false;
    out.push({ text: `You leave ${e.name} here.` });
  } else {
    if (!c.indirect)
      fail(
        `I understood that you want to put ${e.name} somewhere. In or on what?`,
      );
    const target = object(s, c.indirect);
    if (target.open === undefined || target.kind === "Door")
      fail(`The ${target.name} can't hold that.`);
    if (!target.open) fail(`The ${target.name} is closed.`);
    let parent: Entity | undefined = target;
    const seen = new Set<string>();
    while (parent && !seen.has(parent.id)) {
      if (parent.id === e.id)
        fail(
          "You can't put something inside itself, including through another container.",
        );
      seen.add(parent.id);
      parent = world(s).entities[parent.location];
    }
    e.location = target.id;
    e.worn = false;
    out.push({
      text: `You put ${e.name} ${target.properties.surface ? "on" : "in"} ${target.name}.`,
    });
    if (target.id === "coat" && ["photo", "ledger"].includes(e.id)) {
      s.flags[`concealed_${e.id}`] = true;
      effects(s, [{ type: "pull", key: "privacy", amount: 1 }]);
    }
  }
  world(s).lastObject = e.id;
  syncInventory(s);
  return 1;
}
function wear({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  requireHeld(s, e);
  if (e.kind !== "Wearable") fail(`You can't wear ${e.name}.`);
  if (!!e.worn === (c.verb === "wear"))
    fail(`You ${e.worn ? "are already wearing" : "aren't wearing"} ${e.name}.`);
  e.worn = c.verb === "wear";
  if (["coat", "formal"].includes(e.id)) {
    if (e.worn)
      for (const other of ["coat", "formal"])
        if (other !== e.id) world(s).entities[other].worn = false;
    s.wardrobe = world(s).entities.formal.worn
      ? "formal"
      : world(s).entities.coat.worn
        ? "coat"
        : "workwear";
    s.flags.outfit = s.wardrobe;
    s.flags.formalAccess = !!world(s).entities.formal.worn;
  }
  out.push({
    text: `You ${c.verb === "wear" ? "put on" : "take off"} ${e.name}.`,
  });
  return 1;
}
function share({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  requireHeld(s, e);
  const n = person(s, c.indirect);
  if (
    c.verb === "give" &&
    e.id === "ledger" &&
    ["luca", "celeste"].includes(n)
  ) {
    if (!s.canon.player.includes("sender"))
      fail(
        "You haven't authenticated the routing evidence. Read it before committing the original to a new custodian.",
      );
    world(s).encounters[world(s).room] = "ledger";
    const choice = scenes.ledger.choices.find(
      (x) => x.id === (n === "luca" ? "choose_publish" : "choose_bargain"),
    )!;
    const time = transition(s, choice, out);
    e.location = n;
    e.owner = n;
    syncInventory(s);
    return time;
  }
  if (c.verb === "give") {
    e.location = n;
    e.owner = n;
    e.worn = false;
    syncInventory(s);
  }
  const key = `${c.verb}:${e.id}:${n}`;
  if (!world(s).consumed.includes(key)) {
    world(s).consumed.push(key);
    // Evidence transmits only facts actually established by the object.
    for (const fact of e.facts)
      applyEffects(s, [
        {
          type: "knowledge",
          who: n,
          fact,
          source: `Player ${c.verb === "show" ? "showed" : "gave"} ${e.name}`,
        },
      ]);
    effects(s, [
      {
        type: "memory",
        npc: n,
        key: `${c.verb}:${e.id}`,
        value: `Player ${c.verb === "show" ? "showed" : "gave"} me ${e.name}`,
      },
      { type: "relationship", npc: n, axis: "trust", amount: 1 },
    ]);
    if (e.id === "photo")
      effects(s, [
        {
          type: "moral",
          key: c.verb === "give" ? "disclosure" : "honesty",
          amount: 1,
        },
      ]);
  }
  out.push({
    text: `You ${c.verb} ${e.name} ${c.verb === "give" ? "to" : "to"} ${characters[n].name.split(" ")[0]}.`,
  });
  if (["envelope", "invitation"].includes(e.id) && n === "mara") {
    out.push({
      speaker: n,
      text: "I recognise the delivery format. That isn't the same as knowing who sent yours. Keep the routing envelope when it arrives.",
    });
    world(s).lastTopic = "invitation";
  } else if (e.id === "photo")
    out.push({
      speaker: n,
      text: "A trolley and a box. Keep the docket with it. The picture alone doesn't establish who had custody.",
    });
  else
    out.push({
      speaker: n,
      text:
        c.verb === "give"
          ? "I'll remember who left this with me."
          : "All right. I can see it.",
    });
  return 2;
}
function conversation({ s, c, out }: Context): number {
  const w = world(s);
  if (
    c.verb === "say" &&
    !c.indirect &&
    w.lastStatement &&
    s.time - w.lastStatement.at > 20
  )
    fail("Who is that reply for? Name the person once.", "missing-noun");
  const n = person(
    s,
    c.verb === "say" ? c.indirect || w.lastPerson || "" : c.direct,
  );
  let topic = c.verb === "say" ? c.direct : c.topic;
  if (c.verb === "ask") {
    if (
      /^(?:what (?:do you|she|he|they) know about |what (?:she|he|they) knows? about |about )?(?:it|this|that)$/.test(
        topic,
      )
    ) {
      if (!w.lastObject || !isVisible(s, w.lastObject))
        fail(
          "What are you asking about? Name the object or subject once.",
          "missing-noun",
        );
      topic = w.entities[w.lastObject].name;
    }
    if (
      /(?:where.*(?:saw|seen).*before|why.*(?:knows?|knew|recogn|remember)|why.*nervous)/.test(
        topic,
      )
    )
      topic = "why she recognised the envelope";
    if (
      /^(?:what(?:'s| is) going on|what happened|what is all this|what do you know)$/.test(
        topic,
      )
    )
      topic = "invitation";
    if (
      /what (?:she|he) knows? about (?:the )?(?:invitation|envelope)/.test(
        topic,
      )
    )
      topic = "invitation";
  }
  if (c.verb === "tell" && !topic)
    fail(
      `What do you want to tell ${characters[n].name.split(" ")[0]}?`,
      "unsupported-topic",
    );
  if (
    w.conversations[n] &&
    !/invitation|envelope|company|break|dinner|yourself|spend time|stocktake|keys|shift|sender|outsider|recipient|motel/.test(
      topic,
    )
  ) {
    w.encounters[w.room] = w.conversations[n];
    s.scene = w.conversations[n];
  }
  s.flags[`met_${n}`] = true;
  const current = w.encounters[w.room];
  const addressed =
    (current && scenes[current].passages.some((p) => p.speaker === n)) ||
    c.verb === "say";
  const choice = addressed
    ? matchIntent(topic || c.raw, activeChoices(s))
    : undefined;
  const social = (
    [
      "deny",
      "agree",
      "thank",
      "reassure",
      "challenge",
      "tease",
      "joke",
      "change",
    ].includes(c.verb)
      ? c.verb
      : socialIntent(topic)
  ) as SocialIntent | undefined;
  if (social && (social === "agree" || social === "challenge" || !choice))
    return socialAction({ s, c: { ...c, verb: social, topic }, out }, n);
  if (choice) return transition(s, choice, out);
  if (c.verb === "flirt" && s.boundaries.romance !== "allowed") {
    out.push({
      text: "You keep the conversation within your chosen boundaries.",
    });
    return 0;
  }
  if (["accuse", "apologise", "flirt"].includes(c.verb)) {
    const key = `social:${n}:${c.verb}`;
    if (!w.consumed.includes(key)) {
      w.consumed.push(key);
      effects(s, [
        { type: "memory", npc: n, key: c.verb, value: topic || c.verb },
        {
          type: "relationship",
          npc: n,
          axis: c.verb === "flirt" ? "affinity" : "trust",
          amount: c.verb === "accuse" ? -2 : 1,
        },
        {
          type: "pull",
          key: c.verb === "flirt" ? "connection" : "candour",
          amount: 1,
        },
      ]);
    }
    out.push({
      speaker: n,
      text:
        c.verb === "accuse"
          ? "If you have evidence, show me. An accusation isn't a record."
          : c.verb === "apologise"
            ? "I heard you. What happens next matters too."
            : s.npcs[n].relationship.trust >= 3
              ? "I like the company. Stay a while, if you want."
              : "Let's get to know each other before we decide what this is.",
      theme: c.verb === "flirt" ? "romance" : undefined,
      safe: "You share a quiet moment.",
      implied: "The personal interest is acknowledged.",
    });
    return 2;
  }
  if (
    c.verb === "tell" &&
    n === "inez" &&
    /^(?:luca invited me|luca sent (?:it|the invitation))$/.test(topic) &&
    !s.flags.liedLuca
  ) {
    w.encounters[w.room] = "door";
    return transition(
      s,
      scenes.door.choices.find((choice) => choice.id === "lie")!,
      out,
    );
  }
  if (c.verb === "tell") {
    const labels = Object.entries(factLabels)
      .filter(([id]) => s.canon.player.includes(id))
      .map(([id, label]) => ({ id, label }));
    const topicFacts: Record<string, string> = {
      timestamp: "header",
      "delivery time": "header",
      "old signature": "signature",
      "board copy": "boardCopy",
      "missing names": "missingNames",
    };
    const known = labels.find(
      (f) =>
        normalize(f.label) === normalize(topic) ||
        normalize(f.id) === normalize(topic) ||
        topicFacts[normalize(topic)] === f.id,
    );
    const key = `told:${normalize(topic)}`;
    if (!s.npcs[n].memories[key]) {
      effects(s, [
        {
          type: "memory",
          npc: n,
          key,
          value: topic || "An unfinished thought",
        },
        ...(known
          ? [
              {
                type: "knowledge",
                who: n,
                fact: known.id,
                source: `Player report`,
              } as Effect,
            ]
          : [
              {
                type: "belief",
                npc: n,
                key: `playerReport:${normalize(topic)}`,
                value: topic,
                source: "Player allegation; not verified",
              } as Effect,
            ]),
      ]);
    }
    out.push({
      speaker: n,
      text: known
        ? "That belongs in the record. Keep your source with it."
        : "That's what you're telling me. I'll keep it separate from what I can verify.",
    });
    return 2;
  }
  if (
    c.verb === "ask" &&
    /handover|equipment return|adapter label/.test(topic)
  ) {
    out.push({
      speaker: n,
      text: s.npcs[n].memories.workHandover
        ? "We checked when the equipment case comes back. Inez wanted the adapter labelled so tomorrow's crew wouldn't have to guess."
        : "I don't have a handover account to give you. Ask the people doing that part of the shift.",
    });
    return 1;
  }
  if (/motel|27/.test(topic)) {
    if (!s.npcs[n].knowledge.includes("motel"))
      out.push({
        speaker: n,
        text: "I can't give you a reliable account of that address. Ask Inez.",
      });
    else {
      out.push({
        speaker: n,
        text: "Motel 27 is a forwarding address. People use it when they're leaving the Quarter.",
      });
      effects(s, [
        {
          type: "knowledge",
          who: "player",
          fact: "motel",
          source: `Told by ${n}`,
        },
      ]);
    }
    w.lastTopic = "motel";
    return 2;
  }
  if (/why.*(recogn|nervous)|recognis|recogniz/.test(topic)) {
    out.push({
      speaker: n,
      text:
        n === "mara"
          ? "I've handled deliveries here for years. People turn practical details into permission. That's what worries me."
          : "Familiarity isn't proof. Keep asking where the document came from.",
    });
    w.lastTopic = "invitation";
    return 2;
  }
  if (/who sent|sender/.test(topic) && !s.canon.player.includes("sender")) {
    out.push({
      speaker: n,
      text: "Check the routing record. Don't take a guess for an answer.",
    });
    return 2;
  }
  if (
    topic &&
    !/invitation|envelope|company|break|dinner|yourself|spend time|stocktake|keys|shift|sender|outsider|board reference|recipient|track|music|headphone|sorry|lying|door/.test(
      topic,
    )
  ) {
    fail(
      `${characters[n].name.split(" ")[0]} has no clear answer to that topic. You can rephrase it, ask about the invitation, or type HINT for help with this conversation.`,
      "unsupported-topic",
    );
  }
  if (c.verb === "talk" && !topic && w.conversations[n]) {
    beat(s, w.conversations[n], out, true);
    return 1;
  }
  const wantsCompany =
    /company|break|dinner|yourself|spend time|stocktake|keys|shift/.test(
      topic,
    ) ||
    (!topic && s.time >= 1467);
  if (wantsCompany && s.time < 1467) {
    out.push({
      speaker: n,
      text: "I'm still in the middle of the shift. Catch me after the transfer; I'd have time for a proper conversation then.",
    });
    return 1;
  }
  const id =
    !wantsCompany &&
    !topic &&
    !w.consumed.includes(`beat:${n === "mara" ? "bar" : "door"}`) &&
    ((n === "mara" && w.room === "bar") ||
      (n === "inez" && w.room === "vestibule"))
      ? n === "mara"
        ? "bar"
        : "door"
      : conversationStart(s, n, wantsCompany ? "company" : topic);
  if (id === "sender" && variants[s.variant].ally !== n) {
    out.push({
      speaker: n,
      text: "That routing record points to someone else. Ask the person who authorised it.",
    });
    return 2;
  }
  if (id === `${n}_r1` && !s.flags[`arc_${n}`]) {
    const started = npcIds.filter((id) => s.flags[`arc_${id}`]);
    if (started.length >= 2) {
      out.push({
        speaker: n,
        text: "I've made other plans for the rest of the shift. Another night for a longer conversation.",
      });
      return 1;
    }
    effects(s, [
      { type: "flag", key: "lateExpanded", value: true },
      { type: "flag", key: `arc_${n}`, value: true },
      {
        type: "flag",
        key: started.length ? "secondChosen" : "firstChosen",
        value: true,
      },
      {
        type: "flag",
        key: started.length ? "secondLead" : "firstLead",
        value: n,
      },
    ]);
  }
  if (/_r8/.test(id) && !s.flags.ending) {
    out.push({
      speaker: n,
      text: "I'd like to finish this conversation once the document has a custodian. There's still work to do before the long goodbye.",
    });
    return 1;
  }
  if (/_r8/.test(id) && !s.flags[`${n}_firstDone`])
    fail("You haven't had that earlier conversation together.");
  if (w.consumed.includes(`beat:${id}`) && w.encounters[w.room] === id) {
    out.push({
      speaker: n,
      text: "I'm listening. What did you want to say about it?",
    });
    return 1;
  }
  beat(s, id, out);
  w.lastTopic = topic || "invitation";
  return 3;
}
function contact(ctx: Context): number {
  const { s, c, out } = ctx;
  requirePhone(s);
  const n = person(s, c.direct, true),
    name = characters[n].name.split(" ")[0];
  if (c.verb === "call") {
    if (
      n === "inez" &&
      (s.canon.player.includes("motel") ||
        /motel|27/.test(c.topic) ||
        isCarried(s, "key27"))
    ) {
      out.push({
        speaker: n,
        text: "Room 06. The key is being forwarded to your apartment. You decide whether to follow it.",
      });
      const key = world(s).entities.key27;
      if (key.location === "unplaced") key.location = "apartment";
      applyEffects(s, [
        {
          type: "knowledge",
          who: "player",
          fact: "motel",
          source: "Telephone conversation with Inez",
        },
      ]);
      return 3;
    }
    out.push({
      text: `You call ${name}. ${s.npcs[n].location === "off-duty" ? "The call goes to voicemail." : "A short answer: “I'm in the middle of something. Text me.”"}`,
    });
    return 2;
  }
  if (!c.topic)
    fail(
      `What do you want to text ${name}? You can put the message in quotes.`,
    );
  const original = c.raw.match(/["“]([^"”]+)["”]/)?.[1] ?? c.topic;
  const message = s.messages
    .slice()
    .reverse()
    .find((m) => m.from.toLowerCase() === n && !m.replied);
  if (message) {
    const options = messageReplies(s, message.id);
    const matched = matchIntent(
      c.topic,
      options.map((o) => ({
        id: o.id,
        label: o.text,
        to: s.scene,
        minutes: 2,
      })),
    );
    if (matched) {
      const option = options.find((o) => o.id === matched.id)!;
      message.replied = true;
      message.read = true;
      effects(s, [
        { type: "message", from: s.alias, text: option.text },
        ...option.effects,
      ]);
      s.messages[s.messages.length - 1].read = true;
      out.push({ text: `Text sent to ${name}.` });
      return 2;
    }
  }
  effects(s, [{ type: "message", from: s.alias, text: original }]);
  s.messages[s.messages.length - 1].read = true;
  const reply = /where.*(you|are)|your location/.test(c.topic)
    ? (() => {
        const room = rooms[s.npcs[n].location];
        return room
          ? `At ${room.name}. For now.`
          : "Finished my shift. Catch me another night.";
      })()
    : "Got your message. We can talk when there's a moment.";
  effects(s, [
    {
      type: "schedule",
      id: `parser-text:${s.turn}:${s.messages.length}`,
      delay: 3,
      effects: [{ type: "message", from: name, text: reply }],
    },
  ]);
  out.push({ text: `Text sent to ${name}.` });
  return 1;
}
function waitAction({ s, c, out }: Context): number {
  if (c.until) {
    const n = person(s, c.until),
      origin = world(s).room;
    let elapsed = 0;
    while (elapsed < 60 && s.npcs[n].location === origin) {
      const step = Math.min(0.5, (60 - world(s).subMinute) / 60);
      tick(s, step, out);
      elapsed += step;
    }
    out.push({
      text:
        s.npcs[n].location === origin
          ? `${characters[n].name.split(" ")[0]} is still here after an hour. You stop waiting for a change.`
          : `You wait until ${characters[n].name.split(" ")[0]} leaves.`,
    });
    return 0;
  }
  let minutes = c.duration ?? 5;
  if (c.direct) {
    const count = c.direct.match(/^(\d+)(?: (?:minute|minutes|min|mins))?$/);
    if (count) minutes = Number(count[1]);
    else if (c.direct.startsWith("until ")) {
      const m = c.raw.match(/until\s+(\d{1,2}):(\d{2})/i);
      if (!m || +m[1] > 23 || +m[2] > 59)
        fail("Use WAIT UNTIL 00:20, or WAIT 5 MINUTES.");
      minutes =
        (+m[1] * 60 +
          +m[2] -
          (s.time % 1440) -
          world(s).subMinute / 60 +
          1440) %
        1440;
    } else {
      const q = c.direct.replace(/^(near|by|at) /, "");
      if (!["here", "outside"].includes(q)) object(s, q);
    }
  }
  if (minutes < 1 / 60 || minutes > 180)
    fail("Wait between one second and 180 minutes at a time.");
  out.push({
    text: `You wait ${minutes < 1 ? `${Math.round(minutes * 60)} seconds` : `${minutes} minute${minutes === 1 ? "" : "s"}`}. The city keeps its own appointments.`,
  });
  return minutes;
}
function socialAction(ctx: Context, n: NPCId): number {
  const { s, c, out } = ctx,
    w = world(s),
    intent = c.verb as SocialIntent;
  if (intent === "agree") {
    out.push({ speaker: n, text: socialResponses.agree[n] });
    return 0;
  }
  const previous = w.lastStatement;
  if (
    /\b(that|it)\b/.test(c.topic) &&
    intent === "challenge" &&
    (!previous || previous.npc !== n || s.time - previous.at > 20)
  )
    fail(
      "Which claim do you doubt? Name the detail you want checked.",
      "unsupported-topic",
    );
  const key = `social:${n}:${intent}:${intent === "challenge" ? (previous?.text ?? c.topic) : "once"}`;
  if (!w.consumed.includes(key)) {
    w.consumed.push(key);
    const memory = c.topic || intent;
    effects(s, [
      { type: "memory", npc: n, key: `social:${intent}`, value: memory },
      ...(["thank", "reassure"].includes(intent)
        ? [{ type: "relationship", npc: n, axis: "trust", amount: 1 } as Effect]
        : []),
    ]);
    if (
      intent === "reassure" &&
      n === "mara" &&
      s.time >= 1467 &&
      s.time < 1560
    )
      effects(s, [
        {
          type: "schedule",
          id: "world:reassured-mara",
          delay: 8,
          effects: [
            { type: "presence", npc: "mara", location: "kitchen" },
            { type: "flag", key: "maraQuietBreak", value: true },
          ],
        },
      ]);
  }
  if (intent === "change") {
    delete w.encounters[w.room];
    // Keep the unfinished thread available when the player returns to it.
    delete w.lastTopic;
  }
  out.push({
    speaker: n,
    text:
      intent === "reassure" && n === "mara" && s.time < 1467
        ? "Thanks. I still have a shift to finish, but I heard you."
        : socialResponses[intent][n],
  });
  return intent === "deny" ? 0 : 1;
}
function atmosphereAction(ctx: Context): number {
  const { s, c, out } = ctx,
    w = world(s);
  const mark = (text: string) =>
    out.push({ text, kind: "system", from: "atmosphere" });
  if (["smile", "sigh", "stretch"].includes(c.verb)) {
    if (c.direct) {
      const n = person(s, c.direct.replace(/^at /, ""));
      mark(
        c.verb === "smile"
          ? `You offer ${characters[n].name.split(" ")[0]} a small smile. It doesn't need to become a promise.`
          : "You take a moment to settle yourself. Nobody asks for an explanation.",
      );
    } else
      mark(
        c.verb === "sigh"
          ? "You let a breath go. The room makes space for the small sound."
          : c.verb === "stretch"
            ? "You ease the stiffness from your shoulders, staying clear of the people passing."
            : "A small smile, with nobody required to answer it.",
      );
    return 0;
  }
  const e = object(
    s,
    c.direct || (c.verb === "lean" && w.room === "bar" ? "counter" : ""),
  );
  if (c.verb === "peek") {
    if (e.open === false) {
      out.push({
        text: `The ${e.name} is closed; there is no gap wide enough to see through.`,
      });
      return 0;
    }
    return describe({ ...ctx, c: { ...c, verb: "examine" } });
  }
  if (c.verb === "touch") {
    mark(
      typeof e.properties.touch === "string"
        ? e.properties.touch
        : e.properties.onPerson
          ? "You leave touching somebody else's belongings as a question, not an assumption."
          : `You rest your fingers lightly on ${e.name}. It stays where it is.`,
    );
    return 0.5;
  }
  if (!e.properties.lean && !e.properties.surface)
    fail(
      `You could settle nearby, but ${e.name} isn't something to put your weight against.`,
    );
  mark(
    `You settle against ${e.name}. From here you can take in the room without asking it to stop.`,
  );
  return 0.5;
}
function patientObservation(ctx: Context): number {
  const { s, c, out } = ctx,
    w = world(s),
    room = rooms[w.room];
  const minutes = c.duration ?? (c.verb === "listen" ? 2 : 3);
  if (!Number.isFinite(minutes) || minutes < 1 / 60 || minutes > 60)
    fail("Observe for between one second and an hour at a time.");
  const noun = c.direct || "room";
  if (noun === "observers") {
    out.push({
      text:
        s.boundaries.surveillance === "allowed"
          ? "You take in the sightlines and passing faces. A glance is not evidence of an observer's intentions."
          : "You take a moment to orient yourself among the people and doors.",
    });
    tick(s, minutes, out);
    return 0;
  }
  const isPerson =
    /^(her|him|them|she|he)$/.test(noun) ||
    npcIds.some((n) => nameScore(noun, [n, characters[n].name]) > 0);
  const n = isPerson ? person(s, noun) : undefined;
  const e =
    !n && !["room", "street", "around", "conversation", "air"].includes(noun)
      ? object(s, noun)
      : undefined;
  const target = n ?? e?.id ?? noun;
  const key = `${w.room}:${target}:${c.verb}`;
  let remaining = Math.round(minutes * 60),
    observed = 0;
  const previous = w.observations[key] ?? 0;
  while (remaining > 0) {
    if (n && s.npcs[n].location !== w.room) break;
    const seconds = Math.min(30, remaining, 60 - w.subMinute);
    tick(s, seconds / 60, out);
    remaining -= seconds;
    observed += seconds;
  }
  w.observations[key] = previous + observed;
  if (n) {
    const passed = [30, 120, 300].flatMap((seconds, i) =>
      previous < seconds && previous + observed >= seconds ? [i] : [],
    );
    const workingHere = observationRooms[n].includes(w.room);
    for (const tier of passed) {
      if (c.verb === "listen")
        out.push({ speaker: n, text: listeningDetails[n][tier] });
      else
        out.push({
          text: workingHere
            ? patientDetails[n][tier]
            : `${characters[n].name.split(" ")[0]} ${["checks the way through the room before stepping aside for someone.", "keeps track of people passing, without giving away what they're thinking.", "pauses to answer a practical question, then returns to the task at hand."][tier]}`,
        });
    }
    if (!passed.length)
      out.push({
        text: `You keep watching ${characters[n].name.split(" ")[0]}. The small pattern continues; it doesn't become an explanation for everything.`,
      });
    if (
      c.verb === "watch" &&
      workingHere &&
      previous < 120 &&
      previous + observed >= 120
    )
      applyEffects(s, [
        {
          type: "knowledge",
          who: "player",
          fact: `observed_${n}_routine`,
          source: `Patiently watched ${n} at ${room.name}`,
        },
      ]);
  } else if (c.verb === "listen") {
    const adjacent = e
      ? (room.exits.find((exit) => exit.door === e.id)?.to ??
        e.properties.otherSide)
      : undefined;
    const occupied =
      adjacent && npcIds.some((n) => s.npcs[n].location === adjacent);
    out.push({
      text:
        e?.kind === "Door"
          ? occupied
            ? e?.open
              ? "Paper moves beyond the open doorway. Someone sets a cup down; the room noise obscures the words."
              : "Paper moves on the other side. A cup is set down. The closed door keeps the words indistinct."
            : "No distinct voice reaches you through the door."
          : typeof e?.properties.listen === "string"
            ? e.properties.listen
            : noun === "conversation" && presentNPCs(s).length > 0
              ? (overheardWork[w.room] ??
                "A short exchange about work. Nobody raises their voice enough to make private details public.")
              : room.sound,
    });
    if (
      w.room === "washroom" &&
      w.observations[key] >= 120 &&
      !w.consumed.includes("beat:overhear")
    )
      beat(s, "overhear", out);
  } else
    out.push({
      text:
        e?.description ??
        (w.room === "street"
          ? "A taxi passes without stopping. Someone beneath the kiosk awning checks the time."
          : room.sound),
    });
  return 0;
}
function environment(ctx: Context): number {
  if (["watch", "listen"].includes(ctx.c.verb)) return patientObservation(ctx);
  const { s, c, out } = ctx,
    r = rooms[world(s).room];
  if (c.verb === "smell") {
    if (c.direct && !["room", "air", "here"].includes(c.direct)) {
      const e = object(s, c.direct);
      out.push({
        text:
          typeof e.properties.smell === "string"
            ? e.properties.smell
            : `Close to ${e.name}, you catch the same air as the rest of the room. ${r.smell}`,
      });
      return 0;
    }
    out.push({ text: r.smell });
    return 0;
  }
  if (c.verb === "knock") {
    const e = object(s, c.direct || "door");
    if (e.kind !== "Door") fail("You can knock at a door. Which one?");
    out.push({
      text:
        e.id === "office_door" &&
        npcIds.some((n) => s.npcs[n].location === "office")
          ? "A voice from the office: “Come in.”"
          : "Your knuckles sound against the door. Nobody answers.",
    });
    return 1;
  }
  if (c.verb === "search") {
    const e = object(s, c.direct.replace(/^under /, ""));
    if (e.open === false) fail(`Open ${e.name} before searching inside.`);
    out.push({
      text:
        e.id === "desk"
          ? "Under the desk: a loose washer and a clean rectangle where a box once stood. The drawers are within reach."
          : typeof e.properties.search === "string"
            ? e.properties.search
            : `${e.description} Nothing else turns up.`,
    });
    return 3;
  }
  if (c.verb === "sit") {
    const isPerson = /^(her|him|them|celeste|mara|luca|inez)$/.test(c.direct);
    if (isPerson) {
      const n = person(s, c.direct);
      const seats = Object.values(world(s).entities).filter(
        (e) => isVisible(s, e.id) && e.properties.sit,
      );
      if (!seats.length)
        fail(
          "There isn't a free seat here. You can stay nearby without sitting on someone else's things.",
        );
      out.push({
        text: `You take a free seat near ${characters[n].name.split(" ")[0]}, leaving room between you.`,
      });
    } else {
      const e = c.direct
        ? object(s, c.direct)
        : Object.values(world(s).entities).find(
            (e) => isVisible(s, e.id) && e.properties.sit,
          );
      if (!e) fail("There isn't a free seat within reach.");
      if (!e.properties.sit && e.id !== "counter")
        fail(`The ${e.name} isn't a place to sit.`);
      out.push({
        text: `You sit ${e.id === "counter" ? "at" : "on"} ${e.name}. The room continues without needing you to direct it.`,
      });
    }
    return 2;
  }
  return 0;
}
function follow(ctx: Context): number {
  const { s, c, out } = ctx,
    n = person(s, c.direct),
    origin = world(s).room;
  const duration = c.duration ?? 10;
  if (duration < 1 / 60 || duration > 60)
    fail("Follow for between one second and an hour at a time.");
  let elapsed = 0;
  while (elapsed < duration && s.npcs[n].location === origin) {
    const step = Math.min(
      0.5,
      duration - elapsed,
      (60 - world(s).subMinute) / 60,
    );
    tick(s, step, out);
    elapsed += step;
  }
  const destination = s.npcs[n].location;
  if (destination !== origin) {
    // Follow only along a real accessible exit, never teleport to an off-screen destination.
    const exit = rooms[origin].exits.find((e) => e.to === destination);
    if (exit) {
      if (c.manner === "distant")
        out.push({
          text: "You leave a few paces between you, keeping the route in sight.",
        });
      move({ ...ctx, c: { ...c, verb: "go", direct: exit.name } });
    } else
      out.push({
        text: `${characters[n].name.split(" ")[0]} gets ahead of you. You lose sight of them beyond the next passage.`,
      });
  } else
    out.push({
      text: `${characters[n].name.split(" ")[0]} stays busy here. You stop waiting for them to move.`,
    });
  return 0;
}
function use(ctx: Context): number {
  const { s, c, out } = ctx,
    e = object(s, c.direct);
  if (e.id === "phone") {
    requirePhone(s);
    ctx.panel = "phone";
    out.push({ text: "You check your phone." });
    return 0;
  }
  if (e.id === "kettle") {
    out.push({
      text: "You fill the kettle. It rattles into the familiar two-note hum of home.",
    });
    return 3;
  }
  if (!c.indirect)
    fail(
      `I understood that you want to use ${e.name}, but I'm not sure what you want to use it on.`,
    );
  const target = object(s, c.indirect);
  if (target.properties.key === e.id)
    return lockAction({
      ...ctx,
      c: { ...c, verb: "unlock", direct: target.id, indirect: e.id },
    });
  fail(
    `There isn't an evident way to use ${e.name} on ${target.name}. Try examining them for more detail.`,
  );
}
function tear({ s, c, out }: Context): number {
  const e = object(s, c.direct);
  requireHeld(s, e);
  if (e.kind !== "Evidence" && e.id !== "envelope")
    fail(`You can't tear ${e.name} with your hands.`);
  e.destroyed = true;
  e.location = "destroyed";
  s.flags[`destroyed_${e.id}`] = true;
  effects(s, [
    { type: "moral", key: "destruction", amount: 1 },
    { type: "pull", key: "defiance", amount: 1 },
  ]);
  for (const n of presentNPCs(s))
    effects(s, [
      {
        type: "memory",
        npc: n,
        key: `destroyed:${e.id}`,
        value: `Saw the player tear ${e.name}`,
      },
      { type: "relationship", npc: n, axis: "suspicion", amount: 2 },
    ]);
  syncInventory(s);
  out.push({
    text: `You tear ${e.name}. The pieces won't establish custody now. What you already learned remains in your memory.`,
  });
  return 1;
}
function redact({ s, c, out }: Context): number {
  const e = object(s, c.direct || "ledger");
  requireHeld(s, e);
  if (e.id !== "ledger")
    fail(
      "You can redact the tenant names from the ledger. This object has no authored redaction.",
    );
  if (!s.canon.player.includes("sender"))
    fail("Read the routing proof before deciding what to release.");
  world(s).encounters[world(s).room] = "ledger";
  const time = transition(
    s,
    scenes.ledger.choices.find((x) => x.id === "choose_redact")!,
    out,
  );
  world(s).entities.ledger.location = "mara";
  world(s).entities.ledger.owner = "mara";
  world(s).entities.ledger.properties.redacted = true;
  world(s).entities.redacted.location = "player";
  syncInventory(s);
  return time;
}
function reflect({ s, c, out }: Context): number {
  let q = cleanNoun(
    c.direct
      .replace(/^about /, "")
      .replace(/^what /, "")
      .replace(/ (?:just )?said$/, ""),
  );
  const w = world(s);
  if (["her", "she", "him", "he", "them"].includes(q)) {
    const ref = w.references[q];
    if (!ref || s.time - ref.at > 20)
      fail("Who are you remembering? Name the person once.", "missing-noun");
    q = ref.id;
  } else if (["it", "that", "this"].includes(q)) {
    if (!w.lastObject)
      fail(
        "What are you thinking about? Name the object or subject once.",
        "missing-noun",
      );
    q = w.lastObject;
  }
  const npc = npcIds.find(
    (n) => q === n || q === characters[n].name.toLowerCase(),
  );
  if (npc) {
    const seen = w.transcript
      .flatMap((t) => t.passages)
      .filter((p) => p.speaker === npc)
      .filter((p) => transcriptText(s, p));
    if (!seen.length) {
      out.push({
        text: `You haven't heard enough from ${characters[npc].name.split(" ")[0]} to form an account. A reputation would be somebody else's memory.`,
      });
      return 0;
    }
    const latest = seen.at(-1)!;
    out.push({
      text: `You remember ${characters[npc].name.split(" ")[0]} saying: “${transcriptText(s, latest)}”`,
    });
    out.push({
      text:
        s.npcs[npc].relationship.trust >= 3
          ? "There is some earned trust here. That still isn't proof of every claim."
          : s.npcs[npc].relationship.trust < 0
            ? "The conversation left friction. Friction is a reason to check the evidence, not a substitute for it."
            : "You are still getting a read on them. What they said and what you verified remain separate.",
    });
    return 0;
  }
  const topics: Record<string, string[]> = {
    motel: ["motel"],
    "motel 27": ["motel"],
    timestamp: ["header"],
    header: ["header"],
    invitation: [
      "header",
      "signature",
      "sender",
      "carbonProof",
      "proxyProof",
      "registerProof",
    ],
    envelope: ["header", "signature", "sender"],
    ledger: ["tenantRisk", "boardCopy", "missingNames", "witness"],
  };
  const ids = topics[q] ?? (q ? [q] : s.canon.player);
  const known = ids.filter((id) => s.canon.player.includes(id));
  if (known.length)
    out.push({
      text: known
        .map(
          (id) =>
            `${factLabels[id] ?? id}${s.canon.provenance[id] ? ` (${s.canon.provenance[id]})` : ""}`,
        )
        .join("\n\n"),
    });
  else
    out.push({
      text: q
        ? `You haven't verified an account of ${q}. Knowing the name of a subject isn't knowing its answer.`
        : "An unsigned invitation brought you here. Its sender remains unverified. You can think about a person, an object, or something you actually heard.",
    });
  return 0;
}
function sleep({ s, out }: Context): number {
  if (world(s).room !== "apartment")
    fail(
      "Your own apartment is somewhere you can end the night. You can still go home.",
    );
  if (isCarried(s, "ledger") && !s.flags.ending) {
    world(s).encounters[world(s).room] = "ledger";
    transition(
      s,
      scenes.ledger.choices.find((c) => c.id === "choose_withhold")!,
      out,
    );
  }
  const end =
    s.flags.ending === "protect"
      ? "end_protect"
      : s.flags.ending === "public"
        ? "end_public"
        : s.flags.ending === "power"
          ? "end_power"
          : "end_ghost";
  const minutes = Math.max(1, 1800 - s.time);
  tick(s, minutes, out);
  if (s.flags.ending) {
    beat(s, "dawn", out);
    beat(s, end, out);
  } else {
    s.scene = "apartment";
    out.push({
      text: "You put the night down without resolving it. By morning, the city has moved on with its own account. The sender of the invitation remains unverified.",
    });
  }
  s.flags.parserNightEnded = true;
  return 0;
}
export const actionHandlers: Record<string, Handler> = {
  look: describe,
  examine: describe,
  read: describe,
  go: move,
  enter: move,
  leave: move,
  take: handleTake,
  drop: transfer,
  put: transfer,
  open: containerAction,
  close: containerAction,
  lock: lockAction,
  unlock: lockAction,
  wear,
  remove: wear,
  give: share,
  show: share,
  talk: conversation,
  ask: conversation,
  tell: conversation,
  say: conversation,
  accuse: conversation,
  apologise: conversation,
  flirt: conversation,
  text: contact,
  call: contact,
  wait: waitAction,
  follow,
  watch: environment,
  listen: environment,
  smell: environment,
  sit: environment,
  search: environment,
  knock: environment,
  use,
  tear,
  redact,
  think: reflect,
  remember: reflect,
  sleep,
  check: describe,
  peek: atmosphereAction,
  touch: atmosphereAction,
  lean: atmosphereAction,
  smile: atmosphereAction,
  sigh: atmosphereAction,
  stretch: atmosphereAction,
  deny: conversation,
  agree: conversation,
  thank: conversation,
  reassure: conversation,
  challenge: conversation,
  tease: conversation,
  joke: conversation,
  change: conversation,
};
function panelCommand(ctx: Context): number {
  const { s, c, out } = ctx;
  ctx.panel = c.verb as ParserPanel;
  if (c.verb === "phone") {
    requirePhone(s);
    s.messages.forEach((m) => (m.read = true));
    out.push({ text: "You check your messages." });
  }
  if (c.verb === "inventory")
    out.push({
      text: s.inventory.length
        ? `You carry: ${s.inventory
            .map((id) => {
              const e = world(s).entities[id];
              return `${e.name}${e.worn ? " (worn)" : e.location !== "player" ? ` (in ${world(s).entities[e.location]?.name})` : ""}`;
            })
            .join(", ")}.`
        : "Your hands and pockets are empty.",
    });
  if (c.verb === "map")
    out.push({
      text: `You are at ${rooms[world(s).room].name}.\n\n${world(s)
        .visitedRooms.map(
          (id) =>
            `${rooms[id].name}: ${rooms[id].exits.map((e) => e.name).join(", ")}`,
        )
        .join("\n")}`,
    });
  if (c.verb === "journal")
    out.push({
      text: s.canon.player.length
        ? s.canon.player.map((f) => factLabels[f] ?? f).join("\n")
        : "No verified evidence recorded yet.",
    });
  return 0;
}
for (const verb of ["inventory", "phone", "journal", "map"])
  actionHandlers[verb] = panelCommand;
actionHandlers.help = ({ c, out }) => {
  out.push({
    text: c.direct
      ? `For ${c.direct}: name the object or person. EXAMINE an object for detail; ASK someone ABOUT a topic; PUT an object IN a container. Ambiguous nouns will prompt a clarification.`
      : `Write what you want to do: “where am I”, “look at the envelope”, “ask Mara about it”, or “wait for two minutes”. Short sentences are enough. You can refer back to an object with IT or a person with HER, HIM or THEM. If the meaning is unclear, I'll ask you to name the person or thing.

LOOK, THINK and REMEMBER help you reorient without spending time. Taking things, moving and patient observation spend time; people carry on with their evenings. ASK seeks information; TELL shares a claim; SAY replies to the person you're talking with. A greeting or a bare yes never gives away your belongings.

PHONE, INVENTORY, JOURNAL and MAP open your records. HINT offers a little more guidance when requested. Chain actions with THEN or a semicolon. Use the history and completion controls below the input, or ↑ ↓ and Tab on a keyboard.`,
  });
  return 0;
};
actionHandlers.hint = ({ s, out }) => {
  const w = world(s),
    key = w.room + ":" + (w.encounters[w.room] ?? "environment");
  const level = w.hints[key] ?? 0;
  w.hints[key] = level + 1;
  const n = presentNPCs(s).find((n) => w.conversations[n]);
  const inspectable = Object.values(w.entities).find(
    (e) => e.location === w.room && isVisible(s, e.id) && !e.properties.scenery,
  );
  out.push({
    text: n
      ? level === 0
        ? `${characters[n].name.split(" ")[0]} is waiting for your response to what was actually said. You can ask for detail, disagree, or change the subject.`
        : "Use SAY for your own reply, or ASK them about the detail you want explained. You don't have to agree to keep a conversation going."
      : level === 0
        ? "Start with what is physically here. Details can be examined; people can be asked; exits can be followed. Time passes only when you act."
        : inspectable
          ? `The ${inspectable.name} is within reach. Examining it may make the next question easier to put into words.`
          : "LOOK names the exits and visible details. A short observation can also reveal what people are occupied with.",
  });
  return 0;
};
export function executeCommand(state: GameState, raw: string): CommandResult {
  const initial = ensureWorld(state),
    trimmed = raw.trim();
  if (!trimmed) return { state: initial, ok: false };
  if (trimmed.length > 500) {
    const s = structuredClone(initial);
    world(s).transcript.push({
      command: trimmed.slice(0, 500),
      at: s.time,
      room: world(s).room,
      passages: [{ text: "Please keep a command under 500 characters." }],
      failed: true,
    });
    return { state: s, ok: false };
  }
  let s = structuredClone(initial),
    ok = true,
    panel: ParserPanel | undefined;
  for (const submitted of splitCommands(trimmed)) {
    const base = structuredClone(s),
      out: Passage[] = [];
    let command = submitted;
    try {
      if (world(s).pending) {
        if (normalize(command) === "cancel") {
          delete world(s).pending;
          out.push({ text: "Clarification cancelled." });
        } else {
          const pending = world(s).pending!;
          const matches = pending.candidates.filter(
            (id) =>
              nameScore(cleanNoun(command), [
                world(s).entities[id]?.name ??
                  characters[id as NPCId]?.name ??
                  id,
                id,
                ...(world(s).entities[id]?.aliases ?? []),
              ]) > 0,
          );
          if (matches.length === 1) {
            const replacement =
              world(s).entities[matches[0]]?.name ?? matches[0];
            command = pending.command.replace(
              new RegExp(
                pending.noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i",
              ),
              replacement,
            );
            delete world(s).pending;
          } else if (verbs.includes(parseCommand(command).verb))
            delete world(s).pending;
          else
            throw new ActionError(
              "Please name one of those objects, or type CANCEL.",
              { noun: pending.noun, candidates: pending.candidates },
            );
        }
      }
      if (!out.length) {
        const c = parseCommand(command),
          ctx: Context = { s, c, out };
        if (c.tentative)
          fail(
            "You are considering an action. Nothing has happened yet. Describe the action directly when you decide, or use THINK to review what you know.",
          );
        if (c.negated) {
          out.push({
            text: "You leave that undone. Nothing changes hands, and no commitment is made.",
            kind: "system",
          });
          world(s).commandHistory.push(submitted);
          world(s).transcript.push({
            command: submitted,
            at: s.time,
            room: world(s).room,
            passages: out,
            outcome: "refusal",
            verb: c.verb,
            seconds: 0,
          });
          continue;
        }
        const handler = actionHandlers[c.verb];
        // Authored actions expand the parser vocabulary in the current encounter.
        const authored = ![
          "look",
          "examine",
          "read",
          "go",
          "enter",
          "leave",
          "take",
          "drop",
          "put",
          "give",
          "show",
          "open",
          "close",
          "wear",
          "remove",
          "text",
          "call",
          "inventory",
          "map",
          "phone",
          "journal",
          "help",
          "hint",
          "think",
          "remember",
          "deny",
          "agree",
          "thank",
          "reassure",
          "challenge",
          "tease",
          "joke",
          "change",
          "check",
          "peek",
          "touch",
          "lean",
          "watch",
          "listen",
          "wait",
          "follow",
          "smile",
          "sigh",
          "stretch",
        ].includes(c.verb)
          ? matchIntent(command, activeChoices(s))
          : undefined;
        let minutes: number;
        if (
          authored &&
          ![
            "ask",
            "tell",
            "say",
            "talk",
            "accuse",
            "apologise",
            "flirt",
          ].includes(c.verb)
        )
          minutes = transition(s, authored, out);
        else if (handler) {
          const active = world(s).encounters[world(s).room];
          minutes = handler(ctx);
          const physicalBindings: Record<
            string,
            { scene: string; verb: string; object: string; target?: string }
          > = {
            hold_light: {
              scene: "luca_r1",
              verb: "take",
              object: "work_light",
            },
            tape_glasses: {
              scene: "celeste_r1",
              verb: "take",
              object: "glasses",
            },
            mitten_visible: {
              scene: "inez_r2",
              verb: "put",
              object: "mitten",
              target: "ledge",
            },
            take_pass: { scene: "celeste", verb: "take", object: "pass" },
          };
          const binding = Object.entries(physicalBindings).find(
            ([, b]) =>
              b.scene === active &&
              b.verb === c.verb &&
              world(s).lastObject === b.object &&
              (!b.target || world(s).entities[b.object].location === b.target),
          );
          if (binding) {
            const choice = scenes[active!].choices.find(
              (choice) => choice.id === binding[0],
            )!;
            minutes = Math.max(minutes, transition(s, choice, out));
          }
        } else
          fail(
            `I couldn't find an action for “${c.verb}”. Describe what you want to do to something here; HELP explains the command language.`,
            "unsupported-verb",
          );
        if (minutes! > 0) tick(s, minutes!, out);
        panel = ctx.panel ?? panel;
        if (
          s.time * 60 + world(s).subMinute >
            base.time * 60 + world(base).subMinute &&
          s.turn === base.turn
        )
          s.turn++;
        syncInventory(s);
      }
      for (const message of s.messages.filter(
        (m) => !base.messages.some((old) => old.id === m.id),
      )) {
        out.push({
          text: message.text,
          kind: "phone",
          from: message.from,
          theme: message.theme,
          safe:
            message.fallback ?? "Personal message omitted by your boundaries.",
          implied:
            message.fallback ?? "Personal message omitted by your boundaries.",
        });
      }
      for (const p of out)
        if (p.speaker)
          world(s).lastStatement = {
            npc: p.speaker,
            text: p.text,
            at: s.time,
            room: world(s).room,
            theme: p.theme,
            safe: p.safe,
            implied: p.implied,
          };
      world(s).commandHistory.push(submitted);
      world(s).transcript.push({
        command: submitted,
        at: s.time,
        room: world(s).room,
        passages: out.map((p) => transcriptPassageSchema.parse(p)),
        verb: parseCommand(command).verb,
        outcome: out.some((p) => p.kind === "system" && p.from === "atmosphere")
          ? "fallback"
          : "handled",
        seconds:
          (s.time - base.time) * 60 +
          world(s).subMinute -
          world(base).subMinute,
      });
    } catch (error) {
      if (!(error instanceof ActionError)) throw error;
      s = base;
      ok = false;
      if (error.ambiguity)
        world(s).pending = {
          command: world(s).pending?.command ?? command,
          ...error.ambiguity,
        };
      world(s).commandHistory.push(submitted);
      world(s).transcript.push({
        command: submitted,
        at: s.time,
        room: world(s).room,
        passages: [{ text: error.message, kind: "system" }],
        failed: true,
        outcome: error.ambiguity ? "ambiguous" : error.category,
        verb: parseCommand(command).verb,
        seconds: 0,
      });
      break;
    }
  }
  world(s).commandHistory = world(s).commandHistory.slice(-300);
  return { state: s, panel, ok };
}
export function completions(state: GameState, input: string): string[] {
  const s = ensureWorld(state),
    q = normalize(input),
    c = parseCommand(input),
    w = world(s);
  if (!q) return [];
  if (!q.includes(" "))
    return verbs
      .filter((v) => v.startsWith(q) || (q.length >= 3 && distance(v, q) <= 1))
      .slice(0, 8);
  const names = [
    ...Object.values(w.entities)
      .filter((e) => isVisible(s, e.id))
      .map((e) => e.name.toLowerCase()),
    ...presentNPCs(s),
    ...rooms[w.room].exits.map((e) => e.name),
  ];
  const words = input.split(" ");
  const last = cleanNoun(words[words.length - 1]);
  return [
    ...new Set(
      names
        .filter(
          (n) =>
            n.split(" ").some((x) => x.startsWith(last)) ||
            (last.length >= 4 &&
              n.split(" ").some((x) => distance(x, last) <= 1)),
        )
        .map((n) => `${words.slice(0, -1).join(" ")} ${n}`),
    ),
  ]
    .filter((x) => x !== input && !!c.verb)
    .slice(0, 8);
}
export function transcriptText(
  s: GameState,
  p: {
    text: string;
    theme?: Passage["theme"];
    safe?: string;
    implied?: string;
  },
): string {
  if (p.theme && s.boundaries[p.theme] !== "allowed")
    return s.boundaries[p.theme] === "implied"
      ? (p.implied ?? p.safe ?? "")
      : (p.safe ?? "");
  return p.text;
}
export function worldStatus(s: GameState) {
  return `${rooms[world(s).room].name} · ${formatTime(s.time)}`;
}
