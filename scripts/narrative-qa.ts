import { scenes } from "../src/content/scenes";
import { cards } from "../src/content/cards";
import { effectSchema, type Effect } from "../src/engine/types";
import { characters, factLabels, items } from "../src/content/world";
import { taxonomy } from "../src/content/taxonomy";
import { writeFileSync } from "node:fs";
export type Finding = {
  severity: "error" | "review";
  scene: string;
  rule: string;
  detail: string;
};
export function audit() {
  const findings: Finding[] = [];
  const add = (
    scene: string,
    rule: string,
    detail: string,
    severity: Finding["severity"] = "error",
  ) => findings.push({ scene, rule, detail, severity });
  const seenLines = new Map<string, { scene: string; speaker: string }>();
  const checkEffect = (e: Effect, id: string) => {
    if (!effectSchema.safeParse(e).success)
      add(id, "effect-schema", JSON.stringify(e));
    if (e.type === "when")
      [...e.then, ...(e.otherwise ?? [])].forEach((child) =>
        checkEffect(child, id),
      );
    if (e.type === "schedule") e.effects.forEach((e) => checkEffect(e, id));
    if (e.type === "item" && !items[e.id]) add(id, "item-reference", e.id);
    if (e.type === "engagement" && !taxonomy.some((t) => t.id === e.key))
      add(id, "taxonomy-reference", e.key);
    if (e.type === "knowledge" && !factLabels[e.fact])
      add(id, "fact-reference", e.fact);
    if ((e.type === "lock" || e.type === "unlock") && !scenes[e.scene])
      add(id, "scene-reference", e.scene);
    if (e.type === "message" && e.theme && !e.fallback)
      add(id, "boundary-fallback", "Themed message lacks a safe substitute.");
  };
  for (const s of Object.values(scenes)) {
    if (!cards[s.id]) add(s.id, "scene-card", "Missing pre-draft scene card.");
    if (!s.ending && !s.choices.length)
      add(s.id, "dead-end", "Non-ending scene has no exits.");
    if (!s.ending && !s.choices.some((c) => !c.theme && !c.when))
      add(
        s.id,
        "agency",
        "All exits are conditional; runtime reachability needs review.",
        "review",
      );
    const ids = new Set<string>();
    for (const c of s.choices) {
      if (ids.has(c.id)) add(s.id, "duplicate-choice", c.id);
      ids.add(c.id);
      if (!scenes[c.to]) add(s.id, "missing-destination", c.to);
      if (c.minutes < 0 || !Number.isFinite(c.minutes))
        add(s.id, "time", "Invalid duration.");
      (c.effects ?? []).forEach((e) => checkEffect(e, s.id));
    }
    const fingerprints = s.choices.map((c) =>
      JSON.stringify({ to: c.to, effects: c.effects, minutes: c.minutes }),
    );
    if (new Set(fingerprints).size < fingerprints.length)
      add(
        s.id,
        "choice-convergence",
        "Two choices have the same destination, cost and effects.",
        "review",
      );
    (s.onEnter ?? []).forEach((e) => checkEffect(e, s.id));
    for (const p of s.passages) {
      if (p.theme && (!p.safe || !p.implied))
        add(
          s.id,
          "boundary-fallback",
          "Themed passage requires implied and skip versions.",
        );
      for (const fact of p.reveals ?? []) {
        if (!factLabels[fact]) add(s.id, "fact-reference", fact);
        if (!s.card.mayReveal.includes(fact))
          add(
            s.id,
            "card-information-contract",
            `Fact ${fact} is not in the card’s permitted revelations.`,
          );
      }
      const lower = p.text.toLowerCase();
      if (
        /you[’']re playing with fire|you have no idea|you intrigue me|you[’']re more complicated than/i.test(
          p.text,
        )
      )
        add(s.id, "generic-dialogue", p.text, "review");
      if ((p.text.match(/\.\.\.|…/g) ?? []).length > 1)
        add(s.id, "ellipses", p.text, "review");
      if (p.speaker) {
        const prior = seenLines.get(lower);
        if (prior && prior.speaker !== p.speaker)
          add(
            s.id,
            "voice-contamination",
            `Same dialogue also belongs to ${prior.speaker} in ${prior.scene}.`,
            "review",
          );
        seenLines.set(lower, { scene: s.id, speaker: p.speaker });
        const words = p.text.split(/\s+/).length;
        if (words > 70)
          add(
            s.id,
            "exposition-monologue",
            `${p.speaker}: ${words} words without interruption.`,
            "review",
          );
      }
    }
    const text = s.passages.map((p) => p.text).join(" ");
    if (text.split(/\s+/).length > 550)
      add(
        s.id,
        "pacing",
        "Long scene; review whether it ends strongly.",
        "review",
      );
  }
  for (const [id, npc] of Object.entries(characters))
    if (npc.age < 18) add(id, "age", "Major NPC must explicitly be an adult.");
  const reachable = new Set<string>();
  const visit = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    scenes[id]?.choices.forEach((c) => visit(c.to));
  };
  visit("arrival");
  for (const id of Object.keys(scenes))
    if (!reachable.has(id))
      add(id, "unreachable", "No graph path from opening.");
  return findings;
}
const findings = audit();
const errors = findings.filter((f) => f.severity === "error");
const wordCount = Object.values(scenes)
  .flatMap((s) => s.passages)
  .reduce((n, p) => n + p.text.split(/\s+/).length, 0);
const report = {
  scenes: Object.keys(scenes).length,
  authoredWords: wordCount,
  errors: errors.length,
  reviewFlags: findings.filter((f) => f.severity === "review").length,
  findings,
};
console.log(JSON.stringify(report, null, 2));
writeFileSync(
  "artifacts/narrative-qa.json",
  JSON.stringify(report, null, 2) + "\n",
);
if (errors.length) process.exitCode = 1;
