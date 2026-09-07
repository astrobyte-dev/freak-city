import { validateWorld } from "./world-validation";
import {
  stateSchema,
  npcIds,
  type GameState,
  type Condition,
  type Effect,
  type Passage,
  type Choice,
  type Theme,
  type Boundary,
} from "./types";
import { initialEvents, variants } from "../content/world";
import { scenes } from "../content/scenes";
import { learnTheme, thematicObservation, createEngagement } from "./themes";
import { phoneReplies } from "../content/phone";
import { taxonomy } from "../content/taxonomy";
import { createPull, directObservation, learn } from "./pull";
export function hashSeed(seed: string) {
  let h = 2166136261;
  for (const c of seed) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function newGame(
  seed = "948-ASH-17",
  mode: GameState["mode"] = "normal",
): GameState {
  const clean = seed.trim().slice(0, 48) || "948-ASH-17";
  const variant = (["carbon", "proxy", "deadletter"] as const)[
    hashSeed(clean) % 3
  ];
  const v = variants[variant];
  const npc = () => ({
    memories: {},
    beliefs: {},
    knowledge: ["header"],
    relationship: { trust: 0, affinity: 0, suspicion: 0 },
    location: "velvet",
  });
  const s: GameState = {
    version: 1,
    seed: clean,
    variant,
    scene: "arrival",
    alias: "Stranger",
    started: false,
    mode,
    time: 1428,
    turn: 0,
    flags: {
      variantCarbon: variant === "carbon",
      variantProxy: variant === "proxy",
      variantDeadletter: variant === "deadletter",
    },
    player: { heat: 15, composure: 70, nerve: 35 },
    npcs: Object.fromEntries(
      npcIds.map((id) => [id, npc()]),
    ) as GameState["npcs"],
    relationships: {
      "luca:mara": { trust: -2, affinity: 4, suspicion: 3 },
      "celeste:mara": { trust: 1, affinity: 0, suspicion: 2 },
      "inez:luca": { trust: 1, affinity: 2, suspicion: 1 },
      "celeste:inez": { trust: 2, affinity: 0, suspicion: 2 },
    },
    canon: {
      truth: {
        sender: v.sender,
        motive: v.motive,
        intended: v.intended,
        header: "delivery time",
        signature: "reused without permission",
      },
      player: [],
      provenance: {},
      public: {},
    },
    inventory: ["invitation"],
    wardrobe: "coat",
    traits: [],
    moral: {},
    factions: { umbrella: 0, static: 0 },
    rumours: [],
    events: initialEvents(),
    messages: [
      {
        id: "invitation",
        from: "UNKNOWN",
        text: "COME ALONE.\nDON’T GIVE THEM YOUR REAL NAME.\n\nVELVET. SIDE ENTRANCE. 23:41.",
        at: 1421,
        read: false,
      },
    ],
    boundaries: {
      romance: "allowed",
      socialPressure: "allowed",
      surveillance: "allowed",
      substanceUse: "implied",
      powerExchange: "allowed",
      restraint: "implied",
      symbolicOwnership: "implied",
      performance: "allowed",
      fetishFashion: "implied",
      humiliation: "skip",
      aftercare: "allowed",
    },
    engagement: createEngagement(),
    pull: createPull(),
    attractors: {},
    pacing: { recent: [], observation: null },
    locked: [],
    visited: ["arrival"],
    history: [],
  };
  s.npcs[v.ally].knowledge.push("sender", v.fact);
  s.npcs.inez.knowledge.push("motel", "signature");
  s.npcs.mara.knowledge.push("tenantRisk", "missingNames");
  s.npcs.celeste.knowledge.push("tenantRisk", "boardCopy");
  s.npcs.luca.knowledge.push("tenantRisk");
  s.npcs.luca.beliefs.inviter = {
    value:
      variant === "carbon"
        ? "Mara is selling the group out."
        : variant === "proxy"
          ? "The board is recruiting a witness."
          : "I commissioned this invitation.",
    source: "Inference from an incomplete message",
    at: 1428,
  };
  s.npcs.inez.beliefs.inviter = {
    value:
      variant === "carbon"
        ? "Celeste probably sent it."
        : "The delivery queue has been reused.",
    source: "Printer activity, not authorship",
    at: 1428,
  };
  return s;
}
export function meets(s: GameState, c?: Condition): boolean {
  if (!c) return true;
  if ("interest" in c)
    return (
      s.pull.enabled &&
      !!s.engagement[c.interest] &&
      s.engagement[c.interest].interest >= c.minimum &&
      !s.engagement[c.interest].neverGenerate &&
      taxonomy.some(
        (t) => t.id === c.interest && s.boundaries[t.theme] === "allowed",
      )
    );
  if ("memory" in c) {
    const m = s.npcs[c.memory].memories[c.key];
    return !!m && (c.value === undefined || m.value === c.value);
  }
  if ("belief" in c) return s.npcs[c.belief].beliefs[c.key]?.value === c.value;
  if ("trait" in c) return s.traits.includes(c.trait);
  if ("all" in c) return c.all.every((x) => meets(s, x));
  if ("not" in c) return !meets(s, c.not);
  if ("flag" in c) return s.flags[c.flag] === (c.value ?? true);
  if ("fact" in c) return s.canon.player.includes(c.fact);
  if ("item" in c) return s.inventory.includes(c.item);
  if ("npc" in c) return s.npcs[c.npc].relationship.trust >= c.trust;
  if ("before" in c) return s.time < c.before;
  if ("after" in c) return s.time >= c.after;
  if ("composure" in c) return s.player.composure >= c.composure;
  if ("theme" in c) return s.boundaries[c.theme] === "allowed";
  return false;
}
export function applyEffects(
  s: GameState,
  effects: Effect[],
  log: string[] = [],
): void {
  for (const e of effects) {
    switch (e.type) {
      case "presence":
        s.npcs[e.npc].location = e.location;
        break;
      case "when":
        applyEffects(
          s,
          meets(s, e.condition) ? e.then : (e.otherwise ?? []),
          log,
        );
        break;
      case "flag":
        s.flags[e.key] = e.value;
        break;
      case "dimension":
        s.player[e.key] = Math.max(
          0,
          Math.min(100, s.player[e.key] + e.amount),
        );
        break;
      case "memory":
        s.npcs[e.npc].memories[e.key] = { value: e.value, at: s.time };
        break;
      case "belief":
        s.npcs[e.npc].beliefs[e.key] = {
          value: e.value,
          source: e.source,
          at: s.time,
        };
        break;
      case "relationship":
        s.npcs[e.npc].relationship[e.axis] += e.amount;
        break;
      case "npcRelationship": {
        const key = [e.a, e.b].sort().join(":");
        s.relationships[key] ??= { trust: 0, affinity: 0, suspicion: 0 };
        s.relationships[key][e.axis] += e.amount;
        break;
      }
      case "knowledge":
        if (e.who === "player") {
          if (!s.canon.player.includes(e.fact)) s.canon.player.push(e.fact);
          s.canon.provenance[e.fact] = e.source;
        } else if (!s.npcs[e.who].knowledge.includes(e.fact))
          s.npcs[e.who].knowledge.push(e.fact);
        break;
      case "rumour":
        if (!s.rumours.some((r) => r.id === e.id)) {
          s.rumours.push({
            id: e.id,
            text: e.text,
            faction: e.faction,
            stage: 0,
            corrected: false,
            at: s.time,
          });
          s.canon.public[e.id] = e.text;
        }
        break;
      case "faction":
        s.factions[e.id] = (s.factions[e.id] ?? 0) + e.amount;
        break;
      case "schedule":
        if (!s.events.some((x) => x.id === e.id))
          s.events.push({
            id: e.id,
            at: s.time + e.delay,
            status: "pending",
            effects: structuredClone(e.effects),
          });
        break;
      case "cancel": {
        const event = s.events.find(
          (x) => x.id === e.id && x.status === "pending",
        );
        if (event) event.status = "cancelled";
        break;
      }
      case "message": {
        const restricted = e.theme && s.boundaries[e.theme] !== "allowed";
        s.messages.push({
          id: `message-${s.turn}-${s.messages.length}`,
          from: e.from,
          text: restricted
            ? (e.fallback ??
              "A personal message was omitted by your boundaries.")
            : e.text,
          at: s.time,
          read: false,
          theme: e.theme,
          fallback: e.fallback,
          replyKey: e.replyKey,
          format: e.format,
          attachment: e.attachment,
        });
        break;
      }
      case "item":
        s.inventory = e.remove
          ? s.inventory.filter((x) => x !== e.id)
          : [...new Set([...s.inventory, e.id])];
        break;
      case "trait":
        s.traits = e.remove
          ? s.traits.filter((x) => x !== e.id)
          : [...new Set([...s.traits, e.id])];
        break;
      case "moral":
        s.moral[e.key] = (s.moral[e.key] ?? 0) + e.amount;
        break;
      case "pull":
        learn(s, e.key, e.amount);
        break;
      case "engagement":
        learnTheme(s, e.key, e.response, e.context);
        break;
      case "attractor":
        if (s.pull.enabled)
          s.attractors[e.key] = (s.attractors[e.key] ?? 0) + e.amount;
        break;
      case "lock":
        s.locked = [...new Set([...s.locked, e.scene])];
        break;
      case "unlock":
        s.locked = s.locked.filter((x) => x !== e.scene);
        break;
    }
    log.push(JSON.stringify(e));
  }
}
export function advanceTime(s: GameState, minutes: number, log: string[] = []) {
  const target = s.time + minutes;
  for (let guard = 0; guard < 100; guard++) {
    const next = s.events
      .filter((e) => e.status === "pending" && e.at <= target)
      .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))[0];
    if (!next) break;
    s.time = Math.max(s.time, next.at);
    next.status = "fired";
    log.push(`EVENT ${next.id} at ${s.time}`);
    applyEffects(s, next.effects, log);
    if (next.id === "exchange") {
      s.npcs.celeste.location = "office";
      s.npcs.mara.location = "kitchen";
      if (!s.flags.attendedExchange) {
        s.flags.missedExchange = true;
        applyEffects(
          s,
          [
            { type: "faction", id: "umbrella", amount: 2 },
            {
              type: "npcRelationship",
              a: "celeste",
              b: "mara",
              axis: "trust",
              amount: -2,
            },
            {
              type: "rumour",
              id: "absent",
              text: "The outside witness never came upstairs. The board calls the transfer uncontested.",
              faction: "umbrella",
            },
          ],
          log,
        );
      }
    }
    if (next.id === "witness-departs") {
      s.npcs.inez.location = "night-bus";
      if (!s.flags.metWitness) {
        s.flags.missedWitness = true;
        applyEffects(
          s,
          [{ type: "relationship", npc: "luca", axis: "trust", amount: -1 }],
          log,
        );
      }
    }
  }
  s.time = target;
  for (const r of s.rumours) {
    if (!r.corrected && r.stage === 0 && s.time - r.at >= 14) {
      r.stage = 1;
      r.text = `Someone on the street says the outside witness is working for ${r.faction === "static" ? "the radio archive" : "the club board"}.`;
      s.canon.public[r.id] = r.text;
      log.push(`RUMOUR MUTATED ${r.id}`);
    }
  }
}
export function sceneBoundaryBlocked(s: GameState) {
  return !!scenes[s.scene].boundaryGate?.themes.some(
    (t) => s.boundaries[t] !== "allowed",
  );
}
export function availableChoices(s: GameState) {
  const gate = scenes[s.scene].boundaryGate;
  if (gate && sceneBoundaryBlocked(s))
    return scenes[s.scene].choices.filter((c) => c.id === gate.exit);
  return scenes[s.scene].choices.filter(
    (c) =>
      c.id !== gate?.exit &&
      (!c.theme || s.boundaries[c.theme] === "allowed") &&
      (!c.when || meets(s, c.when) || !!c.lockedText),
  );
}
export function choiceDuration(s: GameState, c: Choice) {
  const minimum =
    c.id === "upstairs"
      ? 1467
      : c.id === "loading_bay"
        ? 1461
        : c.id === "neither"
          ? 1467
          : 0;
  return Math.max(c.minutes, minimum - s.time);
}
export function choiceEnabled(s: GameState, c: Choice) {
  return meets(s, c.when) && !s.locked.includes(c.to);
}
export function getPassages(s: GameState): Passage[] {
  if (sceneBoundaryBlocked(s))
    return [{ text: scenes[s.scene].boundaryGate!.summary }];
  return scenes[s.scene].passages
    .filter((p) => meets(s, p.when))
    .map((p) => {
      let text = p.text;
      if (p.theme) {
        const b = s.boundaries[p.theme];
        if (b === "skip") text = p.safe ?? "";
        if (b === "implied") text = p.implied ?? p.safe ?? "";
      }
      return {
        ...p,
        text: text
          .replaceAll("{alias}", s.alias)
          .replaceAll("{sender}", variants[s.variant].sender)
          .replaceAll("{motive}", variants[s.variant].motive),
      };
    })
    .filter((p) => p.text.length > 0);
}
export function choose(state: GameState, choiceId: string): GameState {
  const choice = availableChoices(state).find((c) => c.id === choiceId);
  if (!choice || !choiceEnabled(state, choice))
    throw new Error("That choice is no longer available.");
  const s = structuredClone(state);
  const changes: string[] = [];
  s.started = true;
  s.turn++;
  applyEffects(s, choice.effects ?? [], changes);
  advanceTime(s, choiceDuration(s, choice), changes);
  if (
    typeof s.flags.outfit === "string" &&
    ["coat", "formal", "workwear"].includes(s.flags.outfit)
  )
    s.wardrobe = s.flags.outfit as GameState["wardrobe"];
  s.scene = choice.to;
  if (!scenes[s.scene]) throw new Error(`Unknown scene: ${s.scene}`);
  if (s.scene === "dawn") advanceTime(s, Math.max(0, 1800 - s.time), changes);
  const firstVisit = !s.visited.includes(s.scene);
  s.visited.push(s.scene);
  if (firstVisit) applyEffects(s, scenes[s.scene].onEnter ?? [], changes);
  // Evidence is explicit. Finding a seeded physical proof grants only its matching truth.
  if (s.scene === "proof") {
    const v = variants[s.variant];
    applyEffects(
      s,
      [
        { type: "item", id: v.proof },
        {
          type: "knowledge",
          who: "player",
          fact: v.fact,
          source: `Inspected ${v.proof}`,
        },
        {
          type: "knowledge",
          who: "player",
          fact: "sender",
          source: `Authenticated ${v.proof}`,
        },
      ],
      changes,
    );
  }
  for (const p of getPassages(s)) {
    if (p.reveals) {
      if (
        p.speaker &&
        p.reveals.some((f) => !s.npcs[p.speaker!].knowledge.includes(f))
      )
        throw new Error(`Knowledge violation: ${p.speaker} in ${s.scene}`);
      for (const fact of p.reveals)
        applyEffects(
          s,
          [
            {
              type: "knowledge",
              who: "player",
              fact,
              source: p.speaker
                ? `Told by ${p.speaker}`
                : `Observed in ${s.scene}`,
            },
          ],
          changes,
        );
    }
  }
  if ((s.moral.honesty ?? 0) >= 3 && !s.traits.includes("On the record"))
    s.traits.push("On the record");
  if (
    (s.moral.protection ?? 0) >= 3 &&
    !s.traits.includes("Keeps a confidence")
  )
    s.traits.push("Keeps a confidence");
  if (
    (s.moral.opportunism ?? 0) >= 3 &&
    !s.traits.includes("An angle on everything")
  )
    s.traits.push("An angle on everything");
  s.pacing.observation = ["velvet", "upstairs"].includes(
    scenes[s.scene].location,
  )
    ? (thematicObservation(s, scenes[s.scene].category) ??
      directObservation(s, scenes[s.scene].category))
    : null;
  s.pacing.recent = [...s.pacing.recent, scenes[s.scene].category].slice(-6);
  s.history.push({
    scene: state.scene,
    choice: choice.id,
    to: s.scene,
    at: s.time,
    changes,
  });
  return s;
}
export function updateBoundary(s: GameState, theme: Theme, boundary: Boundary) {
  const n = structuredClone(s);
  n.boundaries[theme] = boundary;
  n.pacing.observation = null;
  for (const t of taxonomy.filter((t) => t.theme === theme)) {
    if (boundary === "skip")
      n.engagement[t.id] = { ...createEngagement()[t.id], neverGenerate: true };
    else n.engagement[t.id].neverGenerate = false;
  }
  if (boundary !== "allowed") {
    const key =
      theme === "romance"
        ? "connection"
        : theme === "surveillance"
          ? "privacy"
          : theme === "socialPressure"
            ? "defiance"
            : null;
    if (key) {
      n.pull.entries[key] = {
        ...createPull().entries[key],
        neverGenerate: boundary === "skip",
      };
      if (n.pull.lastCue === key) n.pull.lastCue = null;
    }
    n.messages = n.messages.map((m) =>
      m.theme === theme
        ? {
            ...m,
            text:
              m.fallback ??
              "A personal message was omitted by your boundaries.",
          }
        : m,
    );
  } else {
    const key =
      theme === "romance"
        ? "connection"
        : theme === "surveillance"
          ? "privacy"
          : theme === "socialPressure"
            ? "defiance"
            : null;
    if (key) n.pull.entries[key].neverGenerate = false;
  }
  return n;
}
export function correctRumour(s: GameState, id: string) {
  const n = structuredClone(s),
    r = n.rumours.find((x) => x.id === id);
  if (r) {
    r.corrected = true;
    r.text =
      "The outside witness has disputed this account. No faction has verified it.";
    n.canon.public[id] = r.text;
  }
  return n;
}
export function messageReplies(s: GameState, id: string) {
  const m = s.messages.find((x) => x.id === id);
  if (!m || m.replied || (m.theme && s.boundaries[m.theme] !== "allowed"))
    return [];
  if (m.replyKey) {
    const thread = phoneReplies[m.replyKey];
    return thread && m.from === thread.from ? thread.options : [];
  }
  return m.from === "UNKNOWN"
    ? [
        {
          id: "source",
          text: "Who gave you this number?",
          effects: [] as Effect[],
        },
      ]
    : [];
}
export function replyMessage(s: GameState, id: string, responseId = "source") {
  const option = messageReplies(s, id).find((x) => x.id === responseId);
  if (!option) return structuredClone(s);
  const n = structuredClone(s),
    m = n.messages.find((x) => x.id === id)!;
  m.replied = true;
  m.read = true;
  n.messages.push({
    id: `reply-${id}`,
    from: n.alias,
    text: option.text,
    at: n.time,
    read: true,
  });
  if (m.from === "UNKNOWN")
    applyEffects(n, [
      {
        type: "schedule",
        id: `reply-${id}`,
        delay: 9,
        effects: [
          {
            type: "message",
            from: "UNKNOWN",
            text: "You wrote it on a delivery form. That is not the same as giving permission.",
          },
        ],
      },
    ]);
  else {
    n.turn++;
    applyEffects(n, option.effects);
    advanceTime(n, 2);
  }
  return n;
}
export function formatTime(time: number) {
  return `${String(Math.floor(time / 60) % 24).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}
export function validateSave(raw: unknown): GameState {
  const value =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const upgraded =
    value.version === 1 && value.relationships === undefined
      ? {
          ...value,
          relationships: newGame(
            typeof value.seed === "string" ? value.seed : undefined,
          ).relationships,
        }
      : raw;
  const s = stateSchema.parse(upgraded);
  if (
    !scenes[s.scene] ||
    s.visited.some((x) => !scenes[x]) ||
    s.locked.some((x) => !scenes[x])
  )
    throw new Error("This save refers to an unavailable scene.");
  const baseline = newGame(s.seed);
  if (
    Object.keys(s.canon.truth).length !==
      Object.keys(baseline.canon.truth).length ||
    Object.entries(baseline.canon.truth).some(
      ([key, value]) => s.canon.truth[key] !== value,
    )
  )
    throw new Error("Objective canon does not match the campaign seed.");
  for (const t of taxonomy)
    if (!s.engagement[t.id]) throw new Error("Incomplete thematic profile.");
  for (const key of Object.keys(baseline.pull.entries))
    if (!s.pull.entries[key])
      throw new Error("Incomplete narrative-interest profile.");
  if (s.variant !== baseline.variant)
    throw new Error("Seed and campaign variant do not match.");
  for (const h of s.history)
    if (
      !scenes[h.scene]?.choices.some((c) => c.id === h.choice && c.to === h.to)
    )
      throw new Error("Save contains an invalid choice record.");
  for (const id of npcIds)
    if (s.npcs[id].knowledge.some((x) => typeof x !== "string"))
      throw new Error("Invalid knowledge record.");
  validateWorld(s);
  return s;
}
