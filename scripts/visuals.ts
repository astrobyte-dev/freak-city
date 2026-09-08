import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { rooms } from "../src/content/spaces";
import { generationDefinition } from "../src/content/visuals/generation";
import { visualManifests } from "../src/content/visuals/manifest";
import { newGame, advanceTime } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";
import { assetProblems } from "./visual-assets";
import { assetRoles, type AssetRole } from "../src/visuals/types";
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    room: { type: "string" },
    role: { type: "string" },
    variant: { type: "string" },
    count: { type: "string" },
    seed: { type: "string" },
    steps: { type: "string" },
    width: { type: "string" },
    height: { type: "string" },
    "pixel-width": { type: "string" },
    "display-width": { type: "string" },
    colors: { type: "string" },
    contrast: { type: "string" },
    device: { type: "string" },
    revision: { type: "string" },
    reference: { type: "string" },
    strength: { type: "string" },
    strengths: { type: "string" },
    layout: { type: "boolean" },
    adapter: { type: "string" },
    output: { type: "string" },
    generate: { type: "boolean" },
    fixture: { type: "boolean" },
    "dry-run": { type: "boolean" },
    "allow-cpu": { type: "boolean" },
    offline: { type: "boolean" },
    validate: { type: "boolean" },
  },
});
if (values.validate) {
  const problems = assetProblems();
  const world = ensureWorld(newGame()).world!;
  for (const manifest of Object.values(visualManifests))
    for (const id of Object.keys(manifest.anchors)) {
      const entity = world.entities[id];
      if (
        !entity ||
        !entity.aliases.length ||
        (entity.location !== manifest.roomId &&
          entity.properties.otherSide !== manifest.roomId)
      )
        problems.push(`Invalid canonical anchor: ${manifest.roomId}/${id}`);
    }
  if (problems.length) throw new Error(problems.join("\n"));
  console.log(
    "Visual assets and canonical anchors validated. No model or network required.",
  );
} else {
  if (
    values.adapter &&
    (values.reference || values.strength || values.strengths)
  )
    throw new Error(
      "Reference options require the integrated adapter; they cannot be silently discarded by an external adapter.",
    );
  const role = (values.role ?? "texture") as AssetRole;
  if (!assetRoles.includes(role))
    throw new Error(`Unknown asset role: ${role}`);
  if (
    role === "canonical-room" &&
    values.variant &&
    values.variant !== "canonical"
  )
    throw new Error(
      "Canonical rooms have one identity: use --variant canonical or omit --variant; time belongs to runtime lighting.",
    );
  const requested = values.room ?? positionals[0];
  const selected = requested
    ? [requested === "velvet-bar" ? "bar" : requested]
    : Object.keys(rooms);
  if ((values.generate || values.fixture || values.layout) && !requested)
    throw new Error(
      "Select one --room for candidate generation. Whole-city batches are intentionally not automatic.",
    );
  const state = ensureWorld(newGame());
  const at: Record<string, number> = {
    early: 1435,
    night: 1460,
    late: 1600,
    closing: 1700,
    dawn: 1755,
    day: 1900,
    base: 1428,
  };
  if (values.variant && values.variant !== "canonical") {
    if (at[values.variant] === undefined) throw new Error("Unknown variant");
    advanceTime(state, at[values.variant] - state.time);
  }
  mkdirSync(".visuals/jobs", { recursive: true });
  for (const room of selected) {
    const job = generationDefinition(room, state, role);
    const path = resolve(
      `.visuals/jobs/${room}${role === "texture" ? "" : `--${role}`}.json`,
    );
    writeFileSync(path, JSON.stringify(job, null, 2) + "\n");
    console.log(`Prepared ${room} / ${role}: ${path}`);
    if (values.layout) {
      if (values.generate || values.fixture || values.adapter)
        throw new Error(
          "Create and validate the layout separately before generation.",
        );
      const result = spawnSync(
        process.env.VISUAL_PYTHON ?? "python3",
        [
          "tools/visual-gen/layout_reference.py",
          "--manifest",
          path,
          "--output",
          values.output ?? `.visuals/layouts/${room}/v1`,
        ],
        { stdio: "inherit", shell: false },
      );
      if (result.error || result.status !== 0)
        throw new Error("Layout validation failed");
    } else if (values.adapter) {
      const output = resolve(values.output ?? `.visuals/generated/${room}`);
      mkdirSync(output, { recursive: true });
      const result = spawnSync(
        resolve(values.adapter),
        ["--manifest", path, "--output", output],
        { stdio: "inherit", shell: false },
      );
      if (result.error || result.status !== 0)
        throw new Error(`Local adapter failed for ${room}`);
    } else if (requested) {
      const args = [
        "tools/visual-gen/adapter.py",
        "--manifest",
        path,
        "--role",
        role,
        "--output",
        values.output ?? `.visuals/generated/${room}`,
      ];
      for (const key of [
        "variant",
        "count",
        "seed",
        "steps",
        "width",
        "height",
        "pixel-width",
        "display-width",
        "colors",
        "contrast",
        "device",
        "revision",
        "reference",
        "strength",
        "strengths",
      ] as const)
        if (values[key]) args.push(`--${key}`, values[key]!);
      if (values.fixture) args.push("--backend", "fixture");
      if (values["dry-run"] || (!values.generate && !values.fixture))
        args.push("--dry-run");
      if (values["allow-cpu"]) args.push("--allow-cpu");
      if (values.offline) args.push("--offline");
      const result = spawnSync(process.env.VISUAL_PYTHON ?? "python3", args, {
        stdio: "inherit",
        shell: false,
      });
      if (result.error || result.status !== 0)
        throw new Error(
          "Local visual adapter failed; see its diagnostic above",
        );
    }
  }
  console.log(
    "Drafts stay in .visuals/. Human review and explicit promotion are required before shipping.",
  );
}
