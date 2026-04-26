import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      electron({
        main: {
          entry: "electron/main.ts",
          vite: {
            define: {
              "process.env.PATREON_CLIENT_ID": JSON.stringify(
                env.PATREON_CLIENT_ID,
              ),
              "process.env.PATREON_CLIENT_SECRET": JSON.stringify(
                env.PATREON_CLIENT_SECRET,
              ),
            },
            build: {
              outDir: "dist-electron",
              rollupOptions: {
                external: ["better-sqlite3"],
              },
            },
          },
        },
        preload: {
          input: path.join(__dirname, "electron/preload.ts"),
        },
        renderer: process.env.NODE_ENV === "test" ? undefined : {},
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
