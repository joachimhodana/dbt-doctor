import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LEADERBOARD_TOP_COUNT = 10;
const MARKER_START = "<!-- LEADERBOARD:START -->";
const MARKER_END = "<!-- LEADERBOARD:END -->";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(scriptDirectory, "..");
const LEADERBOARD_PATH = join(REPO_ROOT, "benchmarks", "results", "leaderboard.json");
const WEBSITE_PUBLIC_PATH = join(REPO_ROOT, "packages", "website", "public", "leaderboard.json");

interface LeaderboardEntry {
  slug: string;
  name: string;
  githubUrl: string;
  packageName: string;
  score: number;
  errorCount: number;
  warningCount: number;
  fileCount: number;
  commitSha: string;
  scannedAt: string;
}

interface LeaderboardFile {
  schemaVersion: number;
  generatedAt: string;
  doctorVersion: string;
  source: { repo: string; path: string; docs: string };
  entries: LeaderboardEntry[];
}

const readLeaderboard = async (): Promise<LeaderboardFile> => {
  const raw = await readFile(LEADERBOARD_PATH, "utf-8");
  const leaderboard = JSON.parse(raw) as LeaderboardFile;
  if (!Array.isArray(leaderboard.entries)) {
    throw new Error(`Invalid leaderboard file: ${LEADERBOARD_PATH}`);
  }
  return leaderboard;
};

const renderLeaderboardTable = (entries: LeaderboardEntry[]): string => {
  const header = ["| #  | Repo | Score |", "| -- | ---- | ----: |"];
  if (entries.length === 0) {
    return [...header, "| — | _No entries yet — see `benchmarks/README.md`_ | — |"].join("\n");
  }
  const rows = entries.slice(0, LEADERBOARD_TOP_COUNT).map((entry, innerIndex) => {
    const rank = String(innerIndex + 1).padEnd(2, " ");
    return `| ${rank} | [${entry.name}](${entry.githubUrl}) | ${entry.score} |`;
  });
  return [...header, ...rows].join("\n");
};

const renderLeaderboardSection = (entries: LeaderboardEntry[]): string => {
  const table = renderLeaderboardTable(entries);
  return `${MARKER_START}\n<!-- prettier-ignore -->\n${table}\n\n${MARKER_END}`;
};

const replaceLeaderboardSection = (markdown: string, replacement: string): string => {
  const startIndex = markdown.indexOf(MARKER_START);
  const endIndex = markdown.indexOf(MARKER_END);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `Leaderboard markers not found in README. Expected ${MARKER_START} ... ${MARKER_END}.`,
    );
  }
  const before = markdown.slice(0, startIndex);
  const after = markdown.slice(endIndex + MARKER_END.length);
  return `${before}${replacement}${after}`;
};

const syncWebsitePublic = async (leaderboard: LeaderboardFile): Promise<void> => {
  const formatted = `${JSON.stringify(leaderboard, null, 2)}\n`;
  await writeFile(WEBSITE_PUBLIC_PATH, formatted, "utf-8");
};

const main = async (): Promise<void> => {
  const leaderboard = await readLeaderboard();
  const sortedEntries = leaderboard.entries.toSorted(
    (leftEntry, rightEntry) => rightEntry.score - leftEntry.score,
  );
  const replacement = renderLeaderboardSection(sortedEntries);

  const readmePath = join(REPO_ROOT, "packages", "dbt-doctor", "README.md");
  const previousMarkdown = await readFile(readmePath, "utf-8");
  const updatedMarkdown = replaceLeaderboardSection(previousMarkdown, replacement);

  let didChange = false;
  if (previousMarkdown !== updatedMarkdown) {
    await writeFile(readmePath, updatedMarkdown, "utf-8");
    didChange = true;
    console.log(
      `Updated README leaderboard with ${Math.min(LEADERBOARD_TOP_COUNT, sortedEntries.length)} entries.`,
    );
  } else {
    console.log("README leaderboard already up to date.");
  }

  await syncWebsitePublic(leaderboard);
  console.log(`Synced ${LEADERBOARD_PATH} → ${WEBSITE_PUBLIC_PATH}`);
  if (!didChange) {
    console.log("Done.");
  }
};

await main();
