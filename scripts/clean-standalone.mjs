import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Next.js may copy project dotenv files into standalone output. Credentials
// must be supplied by the runtime, not distributed inside a build artefact.
export async function cleanStandalone(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.name === ".env" || entry.name.startsWith(".env.")) {
      await rm(path, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      await cleanStandalone(path);
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await cleanStandalone(
    fileURLToPath(new URL("../.next/standalone/", import.meta.url)),
  );
  console.log(
    "Removed dotenv files from standalone output. Supply secrets at runtime.",
  );
}
