import { rooms } from "../src/content/spaces";
import { timeBands } from "../src/visuals/types";
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
    const relative = asset.file;
    if (!rooms[asset.roomId] || !["base", ...timeBands].includes(asset.variant))
      problems.push(
        `Unknown room or variant: ${asset.roomId}/${asset.variant}`,
      );
    if (
      !/^visuals\/generated\/[a-z0-9][a-z0-9.-]*\.(webp|avif)$/.test(relative)
    ) {
      problems.push(`Unsafe or unsupported asset path: ${relative}`);
      continue;
    }
    const key = `${asset.roomId}:${asset.variant}`;
    if (variants.has(key)) problems.push(`Duplicate room variant: ${key}`);
    variants.add(key);
    if (listed.has(relative)) problems.push(`Duplicate asset: ${relative}`);
    listed.add(relative);
    if (asset.status !== "reviewed" && asset.status !== "canonical")
      problems.push(`Unreviewed asset: ${relative}`);
    if (
      !asset.review?.by?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(asset.review.at) ||
      asset.review.backgroundOnly !== true ||
      asset.review.worldFactsChecked !== true
    )
      problems.push(`Missing human review: ${relative}`);
    if (asset.width !== 640 || asset.height !== 448)
      problems.push(`Expected a 640 x 448 plate: ${relative}`);
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
