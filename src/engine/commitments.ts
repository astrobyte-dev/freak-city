import type { GameState, Passage, NPCId } from "./types";
import type { Agreement, SocialEvent } from "./commitment-types";
import { commitmentTemplates } from "../content/commitments/inez-envelope";

export const socialTime = (s: GameState) =>
  s.time * 60 + (s.world?.subMinute ?? 0);
export const templateFor = (id: string) =>
  commitmentTemplates.find((t) => t.id === id);
export const agreementFor = (s: GameState) => s.world?.social?.agreements[0];
export function witnessedSurface(s: GameState, a: Agreement) {
  const t = templateFor(a.template)!;
  const w = s.world!;
  const surface = w.entities[t.surface],
    item = w.entities[t.object];
  return (
    s.npcs[t.npc].location === t.room &&
    surface.location === t.room &&
    surface.visible &&
    !surface.destroyed &&
    surface.open === true &&
    item.location === surface.id &&
    item.visible &&
    !item.destroyed
  );
}
export function recordSocial(
  s: GameState,
  a: Agreement,
  kind: SocialEvent["kind"],
  actor: string,
  detail: string,
  at = socialTime(s),
  room = s.world!.room,
) {
  const social = s.world!.social!;
  const event: SocialEvent = {
    id: `social-${social.nextId++}`,
    agreement: a.id,
    kind,
    actor,
    detail,
    at,
    room,
  };
  social.events.push(event);
  return event;
}
export function learnSocial(
  s: GameState,
  event: SocialEvent,
  npc: NPCId,
  mode: "witnessed" | "heard" | "inspected",
  detail = event.detail,
) {
  const social = s.world!.social!;
  if (
    social.observations.some(
      (o) => o.event === event.id && o.npc === npc && o.mode === mode,
    )
  )
    return;
  social.observations.push({
    event: event.id,
    npc,
    at: event.at,
    mode,
    detail,
  });
  s.npcs[npc].memories[`commitment:${event.id}`] = {
    value: detail,
    at: Math.floor(event.at / 60),
  };
}
export function acceptCare(s: GameState) {
  const social = s.world!.social!,
    offer = social.offer!,
    t = templateFor(offer.template)!;
  let a = agreementFor(s);
  if (!a) {
    a = {
      id: `agreement-${social.nextId++}`,
      template: t.id,
      acceptedAt: socialTime(s),
      due: offer.due,
      limit: offer.limit,
      revisions: [],
      status: "active",
    };
    social.agreements.push(a);
    const item = s.world!.entities[t.object];
    item.location = t.surface; // Ownership and contents do not change.
    item.worn = false;
  }
  a.due = offer.due;
  const event = recordSocial(
    s,
    a,
    a.revisions.length ? "revised" : "accepted",
    "player",
    `Agreed to collect the closed envelope before ${clockLabel(a.due)}; watching ends at ${clockLabel(a.limit)}.`,
  );
  a.revisions.push({ at: event.at, due: a.due, event: event.id });
  learnSocial(s, event, t.npc, "heard");
  delete social.offer;
  return a;
}
export function finishCollection(s: GameState, a: Agreement) {
  if (a.collectedAt !== undefined || a.status === "cancelled") return;
  const t = templateFor(a.template)!;
  a.collectedAt = socialTime(s);
  a.status = a.missedAt === undefined ? "fulfilled" : "collected-late";
  const event = recordSocial(
    s,
    a,
    "collected",
    "player",
    `Player collected the envelope ${a.status === "fulfilled" ? "before the agreed time" : "after the agreed time"}.`,
  );
  if (s.npcs[t.npc].location === s.world!.room && s.world!.room === t.room)
    learnSocial(s, event, t.npc, "witnessed");
  repairCare(s, a);
}
export function repairCare(s: GameState, a: Agreement) {
  const t = templateFor(a.template)!;
  if (
    a.apologyAt === undefined ||
    a.repairAt !== undefined ||
    a.collectedAt === undefined
  )
    return;
  const witnessed = s.world!.social!.observations.some(
    (o) =>
      o.npc === t.npc &&
      o.mode === "witnessed" &&
      s.world!.social!.events.some(
        (e) =>
          e.id === o.event &&
          e.agreement === a.id &&
          (e.kind === "collected" ||
            (e.kind === "reported" &&
              e.detail.startsWith("Player has the envelope now"))),
      ),
  );
  if (!witnessed) return;
  a.repairAt = socialTime(s);
  const event = recordSocial(
    s,
    a,
    "repaired",
    "player",
    "Acknowledged the missed time; collection or later possession has direct evidence. The original miss remains.",
  );
  learnSocial(s, event, t.npc, "heard");
}
export function observeCurrentPossession(s: GameState, a: Agreement) {
  const t = templateFor(a.template)!;
  const item = s.world!.entities[t.object];
  const detail =
    "Player has the envelope now; earlier collection time is unverified.";
  if (
    a.collectedAt === undefined ||
    item.location !== "player" ||
    item.destroyed ||
    !item.visible ||
    s.npcs[t.npc].location !== s.world!.room
  )
    return;
  if (
    s.world!.social!.events.some(
      (e) => e.agreement === a.id && e.detail === detail,
    )
  )
    return;
  const event = recordSocial(s, a, "reported", "player", detail);
  learnSocial(s, event, t.npc, "witnessed");
}

// Called at chronological scheduler boundaries, before presence changes at the same time.
export function advanceCommitments(s: GameState, through: number) {
  const a = agreementFor(s);
  if (!a) return;
  const t = templateFor(a.template)!;
  if (a.status === "active" && a.due <= through) {
    a.status = "missed";
    a.missedAt = a.due;
    const event = recordSocial(
      s,
      a,
      "missed",
      "clock",
      "The agreed collection time passed without collection.",
      a.due,
      t.room,
    );
    if (witnessedSurface(s, a))
      learnSocial(
        s,
        event,
        t.npc,
        "inspected",
        "The envelope was still on the ledge at the agreed time.",
      );
  }
  if (a.careEndedAt === undefined && a.limit <= through) {
    a.careEndedAt = a.limit;
    recordSocial(
      s,
      a,
      "care-ended",
      "clock",
      "Agreed availability ended; no object was moved.",
      a.limit,
      t.room,
    );
  }
}
export function inspectCare(s: GameState, at = socialTime(s)) {
  const a = agreementFor(s);
  if (!a) return;
  const t = templateFor(a.template)!;
  if (
    s.npcs[t.npc].location !== t.room ||
    a.missedAt === undefined ||
    a.careEndedAt === undefined
  )
    return;
  if (
    s.world!.social!.events.some(
      (e) => e.agreement === a.id && e.kind === "inspected",
    )
  )
    return;
  const item = s.world!.entities[t.object];
  const surface = s.world!.entities[t.surface];
  if (
    surface.location !== t.room ||
    !surface.visible ||
    surface.destroyed ||
    !surface.open
  )
    return;
  const detail = witnessedSurface(s, a)
    ? "The envelope is still on the ledge on returning."
    : item.location !== t.surface
      ? "The ledge is empty on returning; collection time and collector are unknown."
      : "The envelope cannot be verified on the ledge.";
  const event = recordSocial(s, a, "inspected", t.npc, detail, at, t.room);
  learnSocial(s, event, t.npc, "inspected");
}
export function careCallback(s: GameState, npc: NPCId): Passage | undefined {
  const a = agreementFor(s);
  if (!a || a.callback || a.status === "active") return;
  if (a.status === "missed" && a.careEndedAt === undefined) return;
  const t = templateFor(a.template)!;
  if (npc !== t.npc || s.npcs[npc].location !== s.world!.room) return;
  const events = s.world!.social!.events;
  const known = (kind: SocialEvent["kind"]) =>
    events.find(
      (e) =>
        e.agreement === a.id &&
        e.kind === kind &&
        s.world!.social!.observations.some(
          (o) => o.event === e.id && o.npc === npc,
        ),
    );
  const source =
    known("repaired") ??
    known("collected") ??
    known("cancelled") ??
    known("inspected") ??
    known("missed");
  if (!source || socialTime(s) < source.at + 60) return;
  const text =
    source.kind === "repaired"
      ? t.callback.repaired
      : source.kind === "collected"
        ? a.missedAt !== undefined
          ? t.callback.late
          : a.revisions.length > 1
            ? t.callback.revised
            : t.callback.fulfilled
        : source.kind === "cancelled"
          ? t.callback.cancelled
          : source.kind === "inspected"
            ? source.detail.includes("empty")
              ? t.callback.uncertain
              : source.detail.includes("still on the ledge")
                ? t.callback.stillHere
                : t.callback.unverified
            : t.callback.missed;
  a.callback = source.id;
  s.world!.social!.focus = true;
  return { speaker: npc, from: "commitment", text };
}
export function knownCareStatus(s: GameState, a: Agreement) {
  const t = templateFor(a.template)!;
  const known = s.world!.social!.events.filter(
    (e) =>
      e.agreement === a.id &&
      s.world!.social!.observations.some(
        (o) => o.event === e.id && o.npc === t.npc,
      ),
  );
  if (known.some((e) => e.kind === "cancelled")) return "cancelled";
  const collected = known.find((e) => e.kind === "collected");
  if (collected) return collected.at < a.due ? "fulfilled" : "collected-late";
  if (known.some((e) => e.kind === "missed")) return "missed";
  return "unverified";
}
export function careReminder(s: GameState): Passage | undefined {
  const a = agreementFor(s);
  if (!a || a.reminder || a.status !== "missed" || !witnessedSurface(s, a))
    return;
  const t = templateFor(a.template)!;
  if (s.world!.room !== t.room) return;
  const event = s.world!.social!.events.find(
    (e) => e.agreement === a.id && e.kind === "missed",
  );
  if (
    !event ||
    !s.world!.social!.observations.some(
      (o) => o.event === event.id && o.npc === t.npc,
    )
  )
    return;
  a.reminder = event.id;
  s.world!.social!.focus = true;
  return { speaker: t.npc, from: "commitment", text: t.reminder };
}
export function clockLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const label = `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return seconds % 60
    ? `${label}:${String(seconds % 60).padStart(2, "0")}`
    : label;
}
