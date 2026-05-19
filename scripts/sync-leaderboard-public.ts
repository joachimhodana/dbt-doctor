import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDirectory, "..");
const sourcePath = join(repoRoot, "benchmarks", "results", "leaderboard.json");
const destinationPath = join(repoRoot, "packages", "website", "public", "leaderboard.json");

const raw = await readFile(sourcePath, "utf-8");
await writeFile(destinationPath, raw.endsWith("\n") ? raw : `${raw}\n`, "utf-8");
