import { rooms, sceneRooms, defaultRoom } from "../src/content/spaces";
import { scenes } from "../src/content/scenes";
import { timeBands, assetRoles } from "../src/visuals/types";
import { approvedAsset } from "../src/visuals/asset-contract";
import { visualManifests } from "../src/content/visuals/manifest";
import { generationDefinition } from "../src/content/visuals/generation";
import { newGame } from "../src/engine/game";
import { ensureWorld } from "../src/engine/parser";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { VisualAsset } from "../src/visuals/types";
export function assetProblems(root = process.cwd()): string[] {
  const registry = JSON.parse(
    readFileSync(resolve(root, "src/content/visuals/assets.json"), "utf8"),
  ) as VisualAsset[];
  const directory = resolve(root, "public/visuals/generated");
  const problems: string[] = [];
  const listed = new Set<string>();
  const variants = new Set<string>();
  for (const asset of registry) {
    const role = asset.role ?? "texture";
    const relative = asset.file;
    if (!assetRoles.includes(role))
      problems.push(`Unknown asset role: ${role}`);
    if (
      !rooms[asset.roomId] ||
      !(
        role === "canonical-room" ? ["canonical"] : ["base", ...timeBands]
      ).includes(asset.variant)
    )
      problems.push(
        `Unknown room or variant: ${asset.roomId}/${asset.variant}`,
      );
    if (
      !/^visuals\/generated\/[a-z0-9][a-z0-9.-]*\.(webp|avif)$/.test(relative)
    ) {
      problems.push(`Unsafe or unsupported asset path: ${relative}`);
      continue;
    }
    const key = `${asset.roomId}:${role}:${asset.variant}${role === "scene-illustration" ? `:${asset.illustration?.sceneId}` : ""}`;
    if (variants.has(key)) problems.push(`Duplicate room variant: ${key}`);
    variants.add(key);
    if (listed.has(relative)) problems.push(`Duplicate asset: ${relative}`);
    listed.add(relative);
    if (asset.status !== "reviewed" && asset.status !== "canonical")
      problems.push(`Unreviewed asset: ${relative}`);
    if (!approvedAsset(asset))
      problems.push(`Missing human review: ${relative}`);
    if (
      !Number.isInteger(asset.width) ||
      asset.width < 320 ||
      asset.width > 2048 ||
      asset.height !== Math.round((asset.width * 7) / 10)
    )
      problems.push(
        `Expected a 10:7 plate with rounded pixel height: ${relative}`,
      );
    if (role === "canonical-room" && rooms[asset.roomId]) {
      const manifest = visualManifests[asset.roomId];
      const job = generationDefinition(
        asset.roomId,
        ensureWorld(newGame()),
        "canonical-room",
      );
      if (
        JSON.stringify(asset.bakedEntities) !==
        JSON.stringify(job.bakedEntities)
      )
        problems.push(
          `Baked architecture differs from canonical entity state: ${relative}`,
        );
      const composition = asset.composition;
      const allowed = [
        ...job.dynamicObjects,
        ...job.dynamicDoors,
        ...job.bakedEntities.map((e) => e.id),
      ];
      const required = [
        ...job.dynamicDoors,
        ...Object.keys(manifest.anchors).filter((id) =>
          job.dynamicObjects.includes(id),
        ),
      ];
      if (
        !composition ||
        required.some((id) => !composition.anchors?.[id]) ||
        Object.keys(composition.anchors ?? {}).some(
          (id) => !allowed.includes(id),
        )
      )
        problems.push(
          `Missing or invented dynamic composition anchors: ${relative}`,
        );
      if (composition) {
        const glyphs = [
          "door",
          "window",
          "sign",
          "counter",
          "shelf",
          "stool",
          "light",
          "glass",
          "bin",
          "camera",
          "trolley",
          "fridge",
          "table",
          "kettle",
          "mug",
          "wall",
        ];
        for (const [id, a] of Object.entries(composition.anchors ?? {}))
          if (
            !glyphs.includes(a.glyph) ||
            (job.dynamicDoors.includes(id) && a.glyph !== "door")
          )
            problems.push(`Invalid composition glyph: ${relative}/${id}`);
        if (
          !Array.isArray(composition.npcZones) ||
          composition.npcZones.length < 4 ||
          !composition.atmosphereZones?.length ||
          !composition.foregroundZones?.length
        )
          problems.push(`Missing composition zones: ${relative}`);
        const zones = [
          ...Object.values(composition.anchors ?? {}),
          ...(composition.atmosphereZones ?? []),
          ...(composition.foregroundZones ?? []),
        ];
        if (
          zones.some(
            (z) =>
              ![z.x, z.y, z.width, z.height].every(Number.isFinite) ||
              z.x < 0 ||
              z.y < 0 ||
              z.width <= 0 ||
              z.height <= 0 ||
              z.x + z.width > 320 ||
              z.y + z.height > 224,
          ) ||
          (composition.npcZones ?? []).some(
            (z) =>
              !Number.isFinite(z.x) ||
              !Number.isFinite(z.y) ||
              z.x < 0 ||
              z.x > 320 ||
              z.y < 0 ||
              z.y > 224,
          )
        )
          problems.push(`Composition outside 320 x 224: ${relative}`);
      }
    }
    if (role === "scene-illustration") {
      const cue = asset.illustration;
      const scene = cue && scenes[cue.sceneId];
      if (
        !cue ||
        !scene ||
        (sceneRooms[scene.id] ?? defaultRoom[scene.location]) !==
          asset.roomId ||
        !Array.isArray(cue.timeBands) ||
        !cue.timeBands.length ||
        cue.timeBands.some((band) => !timeBands.includes(band)) ||
        !Array.isArray(cue.requiredNPCs) ||
        cue.requiredNPCs.some(
          (id) => !["mara", "celeste", "luca", "inez"].includes(id),
        ) ||
        !Array.isArray(cue.themes) ||
        cue.themes.some((theme) => !(theme in newGame().boundaries))
      )
        problems.push(
          `Invalid authored scene illustration binding: ${relative}`,
        );
    }
    const file = resolve(root, "public", relative);
    if (!existsSync(file)) {
      problems.push(`Missing asset: ${relative}`);
      continue;
    }
    const bytes = readFileSync(file);
    if (bytes.length > 150_000) problems.push(`Asset over 150 KB: ${relative}`);
    if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      problems.push(`Asset changed since human review: ${relative}`);
    const signature = bytes.toString("ascii", 0, 40);
    if (
      !(relative.endsWith(".webp")
        ? signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP"
        : signature.slice(4, 8) === "ftyp" && /avif|avis/.test(signature))
    )
      problems.push(`Image signature does not match extension: ${relative}`);
  }
  if (existsSync(directory))
    for (const file of readdirSync(directory)) {
      if (file === ".gitkeep") continue;
      if (
        !statSync(resolve(directory, file)).isFile() ||
        !listed.has(`visuals/generated/${file}`)
      )
        problems.push(
          `Unregistered production file: visuals/generated/${file}`,
        );
    }
  return problems;
}
