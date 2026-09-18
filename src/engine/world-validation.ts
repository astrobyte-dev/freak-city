import { installActivity } from "./activity";
import { ambientEntities } from "../content/affordances";
import type { GameState } from "./types";
import { npcIds } from "./types";
import { createEntities, rooms } from "../content/spaces";
import { scenes } from "../content/scenes";
import { emptySocial } from "./commitment-types";
import { templateFor, socialTime } from "./commitments";

export function upgradeWorld(s: GameState): void {
  const w = s.world;
  if (!w) return;
  if ((w.revision ?? 1) < 2) {
    for (const entity of ambientEntities()) w.entities[entity.id] ??= entity;
    installActivity(s);
    w.revision = 2;
  }
  w.references ??= {};
  w.observations ??= {};
  w.hints ??= {};
  w.subMinute ??= 0;
  if (w.revision < 3) {
    w.social = emptySocial();
    w.revision = 3;
  }
}
export function validateWorld(s: GameState): void {
  const w = s.world;
  if (!w) return;
  if (w.revision === 3 && !w.social)
    throw new Error("Save has no social history for its world revision.");
  if (w.social) {
    const social = w.social;
    const now = socialTime(s);
    const ids = new Set<string>();
    for (const a of social.agreements) {
      const t = templateFor(a.template);
      if (
        !t ||
        !/^agreement-\d+$/.test(a.id) ||
        ids.has(a.id) ||
        !t.windows.some(
          ([start, end]) =>
            a.limit === end && a.acceptedAt >= start && a.acceptedAt < end,
        ) ||
        a.acceptedAt >= a.due ||
        a.due > a.limit ||
        a.acceptedAt > now
      )
        throw new Error("Invalid agreement identity or terms.");
      ids.add(a.id);
      if (
        a.revisions.at(-1)?.due !== a.due ||
        a.revisions[0].at !== a.acceptedAt ||
        a.revisions.some(
          (r, i) =>
            r.at > now ||
            r.due > a.limit ||
            r.at >= r.due ||
            (i > 0 &&
              (r.at < a.revisions[i - 1].at ||
                r.at >= a.revisions[i - 1].due ||
                r.due <= a.revisions[i - 1].due)),
        )
      )
        throw new Error("Invalid agreement revision.");
      if (
        (a.status === "active" &&
          (a.missedAt !== undefined ||
            a.collectedAt !== undefined ||
            a.cancelledAt !== undefined ||
            a.due <= now)) ||
        (a.status === "fulfilled" &&
          (a.collectedAt === undefined ||
            a.collectedAt >= a.due ||
            a.missedAt !== undefined)) ||
        (["missed", "collected-late"].includes(a.status) &&
          a.missedAt === undefined) ||
        (a.status === "collected-late" &&
          (a.collectedAt === undefined || a.collectedAt < a.due)) ||
        (a.status === "cancelled" && a.cancelledAt === undefined)
      )
        throw new Error("Inconsistent agreement outcome.");
      for (const at of [
        a.missedAt,
        a.collectedAt,
        a.cancelledAt,
        a.careEndedAt,
        a.apologyAt,
        a.repairAt,
      ])
        if (at !== undefined && (at < a.acceptedAt || at > now))
          throw new Error("Invalid social event time.");
      if (a.missedAt !== undefined && a.missedAt !== a.due)
        throw new Error("Invalid missed deadline.");
      if (
        a.repairAt !== undefined &&
        (a.apologyAt === undefined ||
          a.collectedAt === undefined ||
          a.missedAt === undefined)
      )
        throw new Error("Repair has no basis.");
    }
    let previous = 0;
    for (const e of social.events) {
      const a = social.agreements.find((a) => a.id === e.agreement);
      if (
        !a ||
        ids.has(e.id) ||
        !/^social-\d+$/.test(e.id) ||
        Number(e.id.slice(7)) >= social.nextId ||
        e.at < previous ||
        e.at < a.acceptedAt ||
        e.at > now ||
        !rooms[e.room] ||
        !["player", "clock", ...npcIds].includes(e.actor)
      )
        throw new Error("Invalid social event provenance.");
      ids.add(e.id);
      previous = e.at;
    }
    for (const a of social.agreements) {
      for (const r of a.revisions)
        if (
          !social.events.some(
            (e) =>
              e.id === r.event &&
              e.agreement === a.id &&
              e.at === r.at &&
              ["accepted", "revised"].includes(e.kind),
          )
        )
          throw new Error("Terms have no acknowledgement.");
      for (const [at, kind] of [
        [a.missedAt, "missed"],
        [a.collectedAt, "collected"],
        [a.cancelledAt, "cancelled"],
        [a.apologyAt, "apologised"],
        [a.repairAt, "repaired"],
        [a.careEndedAt, "care-ended"],
      ] as const)
        if (
          at !== undefined &&
          !social.events.some(
            (e) => e.agreement === a.id && e.at === at && e.kind === kind,
          )
        )
          throw new Error("Outcome has no source event.");
      if (
        [a.callback, a.reminder].some(
          (id) => id && !social.observations.some((o) => o.event === id),
        )
      )
        throw new Error("Response has no observed source.");
    }
    const observed = new Set<string>();
    for (const o of social.observations) {
      const e = social.events.find((e) => e.id === o.event);
      const key = `${o.event}:${o.npc}:${o.mode}`;
      if (
        !e ||
        !npcIds.includes(o.npc as (typeof npcIds)[number]) ||
        o.at !== e.at ||
        observed.has(key)
      )
        throw new Error("Invalid social observation.");
      observed.add(key);
    }
    if (social.offer) {
      const o = social.offer,
        t = templateFor(o.template);
      if (
        !t ||
        !t.windows.some(
          ([start, end]) => o.limit === end && o.at >= start && o.at < end,
        ) ||
        o.due > o.limit ||
        o.at > now ||
        o.at >= o.due ||
        (o.agreement
          ? !social.agreements.some(
              (a) => a.id === o.agreement && a.revisions.length === o.revision,
            )
          : social.agreements.length > 0)
      )
        throw new Error("Invalid pending agreement offer.");
    }
  }
  if (
    !rooms[w.room] ||
    (w.previousRoom && !rooms[w.previousRoom]) ||
    w.visitedRooms.some((id) => !rooms[id])
  )
    throw new Error("Save contains an unavailable room.");
  const expected = createEntities(s);
  if (
    Object.keys(expected).length !== Object.keys(w.entities).length ||
    Object.keys(expected).some((id) => !w.entities[id])
  )
    throw new Error("Save has an incomplete entity model.");
  for (const [id, e] of Object.entries(w.entities)) {
    if (e.id !== id || e.kind !== expected[id].kind)
      throw new Error("Save contains an invalid entity identity.");
    if (
      !rooms[e.location] &&
      !w.entities[e.location] &&
      !["player", "unplaced", "destroyed", ...npcIds].includes(e.location)
    )
      throw new Error("Save contains an invalid entity location.");
    const seen = new Set([id]);
    let parent = w.entities[e.location];
    while (parent) {
      if (seen.has(parent.id))
        throw new Error("Save contains a containment cycle.");
      seen.add(parent.id);
      parent = w.entities[parent.location];
    }
    if (
      e.worn &&
      (!e.portable || e.kind !== "Wearable" || e.location !== "player")
    )
      throw new Error("Save contains an invalid worn item.");
  }
  const carried = Object.values(w.entities)
    .filter((e) => {
      let item: typeof e | undefined = e;
      while (item) {
        if (item.destroyed) return false;
        if (item.location === "player") return true;
        item = w.entities[item.location];
      }
      return false;
    })
    .map((e) => e.id)
    .sort();
  if (JSON.stringify([...s.inventory].sort()) !== JSON.stringify(carried))
    throw new Error("Save inventory disagrees with entity custody.");
  for (const [room, scene] of Object.entries(w.encounters))
    if (!rooms[room] || !scenes[scene])
      throw new Error("Save contains an invalid encounter.");
  for (const [npc, scene] of Object.entries(w.conversations))
    if (!npcIds.includes(npc as (typeof npcIds)[number]) || !scenes[scene])
      throw new Error("Save contains an invalid conversation.");
  for (const entry of w.transcript)
    if (!rooms[entry.room] || entry.at > s.time)
      throw new Error("Save contains an invalid transcript location or time.");
  for (const ref of Object.values(w.references)) {
    if (
      (!w.entities[ref.id] &&
        !npcIds.includes(ref.id as (typeof npcIds)[number])) ||
      !rooms[ref.room] ||
      ref.at < 0 ||
      ref.at > s.time
    )
      throw new Error("Save contains an invalid discourse reference.");
  }
  if (
    w.lastStatement &&
    (!rooms[w.lastStatement.room] ||
      w.lastStatement.at < 0 ||
      w.lastStatement.at > s.time)
  )
    throw new Error("Save contains an invalid remembered statement.");
  if (
    w.pending &&
    w.pending.candidates.some(
      (id) =>
        !w.entities[id] && !npcIds.includes(id as (typeof npcIds)[number]),
    )
  )
    throw new Error("Save contains an invalid clarification.");
}
