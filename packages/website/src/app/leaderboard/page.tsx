import type { Metadata } from "next";
import Link from "next/link";
import { PERFECT_SCORE } from "@/constants";
import { clampScore } from "@/utils/clamp-score";
import { getDoctorFace } from "@/utils/get-doctor-face";
import { getScoreColorClass } from "@/utils/get-score-color-class";

const SCORE_BAR_WIDTH = 20;
const REVALIDATE_SECONDS = 60 * 60;
const COMMAND = "npx dbt-doctor@latest";
const BENCHMARKS_DOCS_URL =
  "https://github.com/joachimhodana/dbt-doctor/blob/main/benchmarks/README.md";
const LEADERBOARD_JSON_PATH = "/leaderboard.json";
const BOX_TOP = "\u250C\u2500\u2500\u2500\u2500\u2500\u2510";
const BOX_BOTTOM = "\u2514\u2500\u2500\u2500\u2500\u2500\u2518";

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

export const metadata: Metadata = {
  title: "Leaderboard - dbt Doctor",
  description:
    "Scores for popular open-source dbt projects, diagnosed by dbt Doctor. Data lives in the dbt-doctor benchmarks folder.",
};

const formatGeneratedAt = (isoTimestamp: string): string => {
  const parsedDate = new Date(isoTimestamp);
  if (Number.isNaN(parsedDate.getTime())) return isoTimestamp;
  return `${parsedDate.toISOString().replace("T", " ").slice(0, 16)} UTC`;
};

const fetchLeaderboard = async (): Promise<LeaderboardFile | null> => {
  try {
    const response = await fetch(LEADERBOARD_JSON_PATH, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const leaderboard = (await response.json()) as LeaderboardFile;
    if (!Array.isArray(leaderboard.entries)) return null;
    return leaderboard;
  } catch {
    return null;
  }
};

const ScoreBar = ({ score }: { score: number }) => {
  const clampedScore = clampScore(score);
  const filledCount = Math.round((clampedScore / PERFECT_SCORE) * SCORE_BAR_WIDTH);
  const emptyCount = SCORE_BAR_WIDTH - filledCount;
  const colorClass = getScoreColorClass(clampedScore);

  return (
    <span className="text-xs sm:text-sm">
      <span className={colorClass}>{"\u2588".repeat(filledCount)}</span>
      <span className="text-neutral-700">{"\u2591".repeat(emptyCount)}</span>
    </span>
  );
};

const LeaderboardRow = ({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => {
  const colorClass = getScoreColorClass(entry.score);

  return (
    <div className="group grid grid-cols-[2rem_1fr_auto] items-center border-b border-white/5 py-2 transition-colors hover:bg-white/2 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] sm:py-2.5">
      <span className="text-right text-neutral-600">{rank}</span>

      <a
        href={entry.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 truncate text-white transition-colors hover:text-blue-400 sm:ml-4"
      >
        {entry.name}
        <span className="ml-2 hidden text-sm text-neutral-500 sm:inline">{entry.packageName}</span>
      </a>

      <span className="ml-4 hidden sm:inline">
        <ScoreBar score={entry.score} />
      </span>

      <span className="ml-4 text-right">
        <span className={`${colorClass} font-medium`}>{entry.score}</span>
        <span className="text-neutral-600">/{PERFECT_SCORE}</span>
      </span>
    </div>
  );
};

const LeaderboardPage = async () => {
  const leaderboard = await fetchLeaderboard();
  const sortedEntries = leaderboard
    ? leaderboard.entries.toSorted((leftEntry, rightEntry) => rightEntry.score - leftEntry.score)
    : [];
  const topScore = sortedEntries[0]?.score ?? 0;
  const [eyes, mouth] = getDoctorFace(topScore);
  const topScoreColor = getScoreColorClass(topScore);

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl bg-[#0a0a0a] p-6 pb-32 font-mono text-base leading-relaxed text-neutral-300 sm:p-8 sm:pb-40 sm:text-lg">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-neutral-300"
        >
          <img src="/favicon.svg" alt="dbt Doctor" width={20} height={20} />
          <span>dbt-doctor</span>
        </Link>
      </div>

      {leaderboard && (
        <div className="mb-2">
          <pre className={`${topScoreColor} leading-tight`}>
            {`  ${BOX_TOP}\n  \u2502 ${eyes} \u2502\n  \u2502 ${mouth} \u2502\n  ${BOX_BOTTOM}`}
          </pre>
        </div>
      )}

      <div className="mb-1 text-xl text-white">Leaderboard</div>
      <div className="mb-2 text-neutral-500">Scores for popular open-source dbt projects.</div>

      {leaderboard && (
        <div className="mb-8 text-sm text-neutral-600">
          {sortedEntries.length} repos scanned with v{leaderboard.doctorVersion} on{" "}
          {formatGeneratedAt(leaderboard.generatedAt)}.
        </div>
      )}

      {leaderboard ? (
        <div className="mb-8">
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry, innerIndex) => (
              <LeaderboardRow key={entry.slug} entry={entry} rank={innerIndex + 1} />
            ))
          ) : (
            <div className="text-neutral-500">No entries yet.</div>
          )}
        </div>
      ) : (
        <div className="mb-8 text-red-400">
          Could not load the leaderboard right now. See{" "}
          <a
            href={BENCHMARKS_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-red-300"
          >
            benchmarks/README.md
          </a>
          .
        </div>
      )}

      <div className="min-h-[1.4em]" />

      <div className="text-neutral-500">Run it on your dbt project:</div>
      <div className="mt-2">
        <span className="border border-white/20 px-3 py-1.5 text-white">{COMMAND}</span>
      </div>

      <div className="min-h-[1.4em]" />
      <div className="min-h-[1.4em]" />

      <div className="text-neutral-500">
        {"+ "}
        <a
          href={BENCHMARKS_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 transition-colors hover:text-green-300 hover:underline"
        >
          Add your project
        </a>
        <span className="text-neutral-600">{" - open a PR in benchmarks/"}</span>
      </div>
    </div>
  );
};

export default LeaderboardPage;
