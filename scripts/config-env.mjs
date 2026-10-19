import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";

// Shell values win, then .env.local, then .env. Never copy the environment
// into generated browser data; generators select explicit inputs only.
export async function loadConfigEnv(root) {
  if (process.env.TEMPLATE_DEFAULTS === "1") return;
  for (const name of [".env.local", ".env"]) {
    const content = await readFile(new URL(name, root), "utf8").catch(
      (error) => {
        if (error.code === "ENOENT") return "";
        throw error;
      },
    );
    for (const [key, value] of Object.entries(parseEnv(content))) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}
