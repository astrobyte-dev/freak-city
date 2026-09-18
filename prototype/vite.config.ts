import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/__prototype/",
  publicDir: false,
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  plugins: [
    {
      name: "local-experiment-only",
      configResolved(config) {
        if (config.command === "build")
          throw new Error("This experiment is development-only.");
      },
    },
  ],
  test: { include: ["*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
