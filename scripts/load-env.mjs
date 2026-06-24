import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

function parseEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return key ? [key, value] : null;
}

export async function loadEnvFiles() {
  for (const filename of [".env.local", ".env"]) {
    try {
      const contents = await readFile(resolve(process.cwd(), filename), "utf8");

      for (const line of contents.split(/\r?\n/)) {
        const parsed = parseEnvLine(line);

        if (!parsed) {
          continue;
        }

        const [key, value] = parsed;

        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }
  }
}
