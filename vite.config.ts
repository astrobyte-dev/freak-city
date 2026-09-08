import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import packageInfo from "./package.json";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const buildCommit = execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
  encoding: "utf8",
}).trim();
export default defineConfig({
  define: {
    __PLAYTEST_VERSION__: JSON.stringify(packageInfo.playtestVersion),
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
  },
  plugins: [
    react(),
    {
      name: "playtest-build-identification",
      apply: "build",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "build.json",
          source:
            JSON.stringify(
              {
                status: "PRE-ALPHA HUMAN PLAYTEST BUILD",
                version: packageInfo.playtestVersion,
                sourceCommit: buildCommit,
              },
              null,
              2,
            ) + "\n",
        });
        this.emitFile({
          type: "asset",
          fileName: "THIRD_PARTY_NOTICES.txt",
          source: readFileSync("THIRD_PARTY_NOTICES.md", "utf8"),
        });
      },
    },
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules"))
            return id.includes("zod") ? "validation" : "vendor";
        },
      },
    },
  },
  server: { host: "0.0.0.0" },
  test: { include: ["tests/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
