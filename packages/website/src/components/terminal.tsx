"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, ChevronRight, RotateCcw } from "lucide-react";
import { PERFECT_SCORE } from "@/constants";
import { SITE_HOST } from "@/constants/site";
import { getDoctorFace } from "@/utils/get-doctor-face";
import { getScoreColorClass } from "@/utils/get-score-color-class";
import { getScoreLabel } from "@/utils/get-score-label";

const COPIED_RESET_DELAY_MS = 2000;
const INITIAL_DELAY_MS = 250;
const TYPING_DELAY_MS = 25;
const POST_COMMAND_DELAY_MS = 350;
const POST_VERSION_DELAY_MS = 250;
const DIAGNOSTIC_MIN_DELAY_MS = 60;
const DIAGNOSTIC_MAX_DELAY_MS = 140;
const SCORE_REVEAL_DELAY_MS = 250;
const SCORE_FRAME_COUNT = 20;
const SCORE_FRAME_DELAY_MS = 30;
const POST_SCORE_DELAY_MS = 300;
const SCORE_BAR_WIDTH_MOBILE = 15;
const SCORE_BAR_WIDTH_DESKTOP = 30;
const TOTAL_SOURCE_FILE_COUNT = 24;
const ELAPSED_TIME = "2.6s";

/** Matches @dbt-doctor/core calculateScoreLocal — penalty per unique rule, not per finding. */
const ERROR_RULE_PENALTY = 1.5;
const WARNING_RULE_PENALTY = 0.75;

const computeDemoScore = (diagnostics: RuleDiagnostic[]): number => {
  const errorRules = new Set<string>();
  const warningRules = new Set<string>();
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") {
      errorRules.add(diagnostic.ruleKey);
    } else {
      warningRules.add(diagnostic.ruleKey);
    }
  }
  const penalty = errorRules.size * ERROR_RULE_PENALTY + warningRules.size * WARNING_RULE_PENALTY;
  return Math.max(0, Math.round(PERFECT_SCORE - penalty));
};

const countDemoIssues = (diagnostics: RuleDiagnostic[]): number =>
  diagnostics.reduce((total, diagnostic) => total + diagnostic.count, 0);

const countDemoAffectedFiles = (diagnostics: RuleDiagnostic[]): number =>
  new Set(diagnostics.map((diagnostic) => diagnostic.location.replace(/:\d+$/, "").split(":")[0]))
    .size;

const ANIMATION_COMPLETED_KEY = "dbt-doctor-animation-completed";
const COMMAND = "npx dbt-doctor@latest";
const GITHUB_URL = "https://github.com/joachimhodana/dbt-doctor";
const GITHUB_ICON_PATH =
  "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z";

interface RuleDiagnostic {
  ruleKey: string;
  severity: "error" | "warning";
  message: string;
  help: string;
  count: number;
  location: string;
}

/** Top rule groups shown in the animation — worst architectural smells first. */
const VISIBLE_DIAGNOSTICS: RuleDiagnostic[] = [
  {
    ruleKey: "dbt-doctor/source-in-downstream",
    severity: "error",
    message: "{{ source() }} used outside staging layer",
    help: "Reference sources only in staging; downstream models should use ref().",
    count: 3,
    location: "models/marts/fct_revenue.sql:14",
  },
  {
    ruleKey: "dbt-doctor/hardcoded-database",
    severity: "error",
    message: "Hard-coded database.schema.table reference in SQL",
    help: "Use {{ ref() }} or {{ source() }} instead of literal relation names.",
    count: 2,
    location: "models/intermediate/int_orders.sql:22",
  },
  {
    ruleKey: "dbt-doctor/no-run-query-in-model",
    severity: "error",
    message: "run_query() should not be used in model SQL",
    help: "Move imperative queries to macros or pre-hooks, not model files.",
    count: 1,
    location: "models/marts/dim_users.sql:5",
  },
  {
    ruleKey: "dbt-doctor/staging-no-join",
    severity: "warning",
    message: "JOIN found in staging model",
    help: "Keep staging thin; join in intermediate or marts layers.",
    count: 2,
    location: "models/staging/stg_orders.sql:31",
  },
  {
    ruleKey: "dbt-doctor/no-select-star",
    severity: "warning",
    message: "Avoid SELECT * in dbt models",
    help: "List columns explicitly for stable contracts and clearer lineage.",
    count: 9,
    location: "models/staging/stg_customers.sql:12",
  },
  {
    ruleKey: "dbt-doctor/schema-description",
    severity: "warning",
    message: 'Model "fct_revenue" is missing a description',
    help: "Add a description field under the model in schema.yml.",
    count: 6,
    location: "models/marts/schema.yml:14",
  },
  {
    ruleKey: "dbt-doctor/source-freshness",
    severity: "warning",
    message: "Source missing freshness configuration",
    help: "Add freshness to _sources.yml for SLA monitoring.",
    count: 4,
    location: "models/staging/_sources.yml:8",
  },
  {
    ruleKey: "dbt-doctor/model-outside-layer-folder",
    severity: "warning",
    message: "Model SQL file sits directly under models/",
    help: "Move into staging/, intermediate/, or marts/ subfolders.",
    count: 1,
    location: "models/legacy_orders.sql",
  },
];

/** Remaining dbt-doctor + sqlfluff rules (collapsed in CLI) — needed for an honest Critical score. */
const HIDDEN_DBT_RULE_IDS = [
  "staging-prefix",
  "staging-naming-convention",
  "staging-materialized-view",
  "intermediate-prefix",
  "marts-prefix",
  "generic-test-present",
  "direct-source-and-ref",
  "prefer-ref-over-raw-source",
  "dbt-project-name",
  "bigquery-partition-filter",
  "materialization-hint",
  "empty-model-file",
  "jinja-config-block",
] as const;

const SQLFLUFF_RULE_CODES = [
  "AL01",
  "AL02",
  "AL05",
  "AM01",
  "AM02",
  "AM04",
  "CP01",
  "CP02",
  "CP03",
  "CP04",
  "CP05",
  "CV01",
  "CV02",
  "CV03",
  "CV04",
  "CV05",
  "CV06",
  "CV07",
  "CV08",
  "CV10",
  "CV11",
  "JJ01",
  "LT01",
  "LT02",
  "LT04",
  "LT05",
  "LT06",
  "LT08",
  "LT09",
  "LT12",
  "LT13",
  "LT14",
  "LT15",
  "RF02",
  "RF04",
  "RF05",
  "RF06",
  "ST01",
  "ST02",
  "ST03",
  "ST05",
  "ST06",
  "ST07",
  "ST08",
  "ST09",
  "ST10",
  "ST11",
  "TQ01",
  "TQ02",
  "TQ03",
  "LT07",
  "LT10",
  "LT11",
  "RF01",
  "RF03",
] as const;

const buildAllScoreDiagnostics = (): RuleDiagnostic[] => {
  const hiddenDbt: RuleDiagnostic[] = HIDDEN_DBT_RULE_IDS.map((ruleId) => ({
    ruleKey: `dbt-doctor/${ruleId}`,
    severity: "warning",
    message: "",
    help: "",
    count: 2,
    location: "",
  }));

  const hiddenSqlfluff: RuleDiagnostic[] = SQLFLUFF_RULE_CODES.map((code) => ({
    ruleKey: `sqlfluff/${code}`,
    severity: "warning",
    message: "",
    help: "",
    count: 3,
    location: "",
  }));

  return [...VISIBLE_DIAGNOSTICS, ...hiddenDbt, ...hiddenSqlfluff];
};

const ALL_SCORE_DIAGNOSTICS = buildAllScoreDiagnostics();

const TARGET_SCORE = computeDemoScore(ALL_SCORE_DIAGNOSTICS);
const SCORE_RULE_COUNT = new Set(ALL_SCORE_DIAGNOSTICS.map((diagnostic) => diagnostic.ruleKey))
  .size;
const COLLAPSED_RULE_COUNT = SCORE_RULE_COUNT - VISIBLE_DIAGNOSTICS.length;
const TOTAL_ISSUE_COUNT = countDemoIssues(ALL_SCORE_DIAGNOSTICS);
const AFFECTED_FILE_COUNT = Math.max(countDemoAffectedFiles(VISIBLE_DIAGNOSTICS), 18);

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const Spacer = () => <div className="min-h-[1.4em]" />;

const FadeIn = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-in">{children}</div>
);

const ScoreBar = ({ score, barWidth }: { score: number; barWidth: number }) => {
  const filledCount = Math.round((score / PERFECT_SCORE) * barWidth);
  const emptyCount = barWidth - filledCount;
  const colorClass = getScoreColorClass(score);

  return (
    <>
      <span className={colorClass}>{"█".repeat(filledCount)}</span>
      <span className="text-neutral-600">{"░".repeat(emptyCount)}</span>
    </>
  );
};

const BOX_TOP = "┌─────┐";
const BOX_BOTTOM = "└─────┘";

const ScoreHeader = ({ score }: { score: number }) => {
  const [eyes, mouth] = getDoctorFace(score);
  const colorClass = getScoreColorClass(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <div>
      <pre className={`${colorClass} leading-tight`}>
        {`  ${BOX_TOP}\n  │ ${eyes} │\n  │ ${mouth} │\n  ${BOX_BOTTOM}`}
      </pre>
      <div className="mt-2 pl-2">
        <div>
          <span className={colorClass}>{score}</span>
          <span className="text-neutral-500">{` / ${PERFECT_SCORE}`}</span>
          {"  "}
          <span className={colorClass}>{scoreLabel}</span>
        </div>
        <div className="my-1 text-xs sm:text-sm">
          <span className="sm:hidden">
            <ScoreBar score={score} barWidth={SCORE_BAR_WIDTH_MOBILE} />
          </span>
          <span className="hidden sm:inline">
            <ScoreBar score={score} barWidth={SCORE_BAR_WIDTH_DESKTOP} />
          </span>
        </div>
        <div>
          dbt Doctor <span className="text-neutral-500">({SITE_HOST})</span>
        </div>
      </div>
    </div>
  );
};

const CollapsedRulesSummary = () => (
  <div className="mb-1 text-neutral-500">
    {`  … +${COLLAPSED_RULE_COUNT} more rules (dbt-doctor + sqlfluff)`}
  </div>
);

const DiagnosticItem = ({ diagnostic }: { diagnostic: RuleDiagnostic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colorClass = diagnostic.severity === "error" ? "text-red-400" : "text-yellow-500";
  const icon = diagnostic.severity === "error" ? "✗" : "⚠";
  const countBadge = diagnostic.count > 1 ? `×${diagnostic.count}` : "";

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen((previous) => !previous)}
        className="inline-flex items-start gap-1 text-left"
      >
        <ChevronRight
          size={16}
          className={`mt-[0.35em] shrink-0 text-neutral-500 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
        />
        <span>
          <span className={colorClass}>{icon} </span>
          <span className={colorClass}>{diagnostic.ruleKey}</span>
          {countBadge && <span className="text-neutral-500">{`\u00A0${countBadge}`}</span>}
        </span>
      </button>
      <div
        className="ml-6 grid text-neutral-500 transition-[grid-template-rows,opacity] duration-200 ease-out"
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="mt-1">
            <div>{diagnostic.message}</div>
            <div>→ {diagnostic.help}</div>
            <div>{diagnostic.location}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CopyCommand = () => {
  const [didCopy, setDidCopy] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(COMMAND);
    setDidCopy(true);
    setTimeout(() => setDidCopy(false), COPIED_RESET_DELAY_MS);
  }, []);

  const IconComponent = didCopy ? Check : Copy;
  const iconClass = didCopy
    ? "shrink-0 text-green-400"
    : "shrink-0 text-white/60 transition-colors group-hover:text-white";

  return (
    <div className="group flex items-center gap-4 rounded-md border border-orange-200/20 bg-[#120e0d] px-3 py-1.5 transition-colors hover:bg-[#1b1412]">
      <span className="select-all whitespace-nowrap text-white">{COMMAND}</span>
      <button onClick={handleCopy}>
        <IconComponent size={16} className={iconClass} />
      </button>
    </div>
  );
};

interface AnimationState {
  typedCommand: string;
  isTyping: boolean;
  showVersion: boolean;
  visibleDiagnosticCount: number;
  score: number | null;
  showCountsSummary: boolean;
  showCta: boolean;
}

const INITIAL_STATE: AnimationState = {
  typedCommand: "",
  isTyping: true,
  showVersion: false,
  visibleDiagnosticCount: 0,
  score: null,
  showCountsSummary: false,
  showCta: false,
};

const COMPLETED_STATE: AnimationState = {
  typedCommand: COMMAND,
  isTyping: false,
  showVersion: true,
  visibleDiagnosticCount: VISIBLE_DIAGNOSTICS.length,
  score: TARGET_SCORE,
  showCountsSummary: true,
  showCta: true,
};

const didAnimationComplete = () => {
  try {
    return localStorage.getItem(ANIMATION_COMPLETED_KEY) === "true";
  } catch {
    return false;
  }
};

const markAnimationCompleted = () => {
  try {
    localStorage.setItem(ANIMATION_COMPLETED_KEY, "true");
  } catch {}
};

const Terminal = () => {
  const [state, setState] = useState<AnimationState>(INITIAL_STATE);

  useEffect(() => {
    if (didAnimationComplete()) {
      setState(COMPLETED_STATE);
      return;
    }

    let cancelled = false;

    const update = (patch: Partial<AnimationState>) => {
      if (!cancelled) setState((previous) => ({ ...previous, ...patch }));
    };

    const run = async () => {
      await sleep(INITIAL_DELAY_MS);

      for (let index = 0; index <= COMMAND.length; index++) {
        if (cancelled) return;
        update({ typedCommand: COMMAND.slice(0, index) });
        await sleep(TYPING_DELAY_MS);
      }

      update({ isTyping: false });
      await sleep(POST_COMMAND_DELAY_MS);
      if (cancelled) return;

      update({ showVersion: true });
      await sleep(POST_VERSION_DELAY_MS);

      for (let index = 0; index < VISIBLE_DIAGNOSTICS.length; index++) {
        if (cancelled) return;
        update({ visibleDiagnosticCount: index + 1 });
        const jitteredDelay =
          DIAGNOSTIC_MIN_DELAY_MS +
          Math.random() * (DIAGNOSTIC_MAX_DELAY_MS - DIAGNOSTIC_MIN_DELAY_MS);
        await sleep(jitteredDelay);
      }

      await sleep(SCORE_REVEAL_DELAY_MS);

      for (let frame = 0; frame <= SCORE_FRAME_COUNT; frame++) {
        if (cancelled) return;
        update({ score: Math.round(easeOutCubic(frame / SCORE_FRAME_COUNT) * TARGET_SCORE) });
        await sleep(SCORE_FRAME_DELAY_MS);
      }

      await sleep(POST_SCORE_DELAY_MS);
      if (cancelled) return;
      update({ showCountsSummary: true });

      await sleep(POST_SCORE_DELAY_MS);
      if (cancelled) return;
      update({ showCta: true });
      markAnimationCompleted();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl bg-[radial-gradient(120%_120%_at_50%_0%,#2a1a16_0%,#0a0a0a_55%)] px-4 py-6 pb-24 font-mono text-base leading-relaxed text-neutral-300 sm:px-6 sm:py-10 sm:pb-32 sm:text-lg">
      <div className="rounded-xl border border-orange-200/15 bg-[#0b0b0b]/95 p-5 shadow-[0_0_0_1px_rgba(255,105,74,0.06),0_30px_80px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="mb-4 flex items-center gap-2 text-[10px] text-neutral-500">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b4a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffb86a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
          <span className="ml-2 tracking-wide text-neutral-600">dbt-doctor terminal</span>
        </div>
        <div>
          <span className="text-neutral-500">$ </span>
          <span>{state.typedCommand}</span>
          {state.isTyping && <span>▋</span>}
        </div>

        {state.showVersion && (
          <FadeIn>
            <Spacer />
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="dbt Doctor" width={24} height={24} />
              dbt-doctor
            </div>
            <div className="text-neutral-500">Your agent writes bad dbt. This catches it.</div>
            <Spacer />
            <div className="text-neutral-500">
              Snowflake, BigQuery, Redshift, Postgres, DuckDB, and more.
            </div>
            <Spacer />
          </FadeIn>
        )}

        {state.visibleDiagnosticCount > 0 && (
          <div>
            {VISIBLE_DIAGNOSTICS.slice(0, state.visibleDiagnosticCount).map((diagnostic) => (
              <FadeIn key={diagnostic.ruleKey}>
                <DiagnosticItem diagnostic={diagnostic} />
              </FadeIn>
            ))}
          </div>
        )}

        {state.score !== null && (
          <FadeIn>
            {COLLAPSED_RULE_COUNT > 0 && <CollapsedRulesSummary />}
            <ScoreHeader score={state.score} />
            <Spacer />
          </FadeIn>
        )}

        {state.showCountsSummary && (
          <FadeIn>
            <div>
              <span className="text-neutral-500">{"  "}</span>
              <span className="text-red-400">{TOTAL_ISSUE_COUNT} findings</span>
              <span className="text-neutral-500">
                {`  (${SCORE_RULE_COUNT} rules)  across ${AFFECTED_FILE_COUNT}/${TOTAL_SOURCE_FILE_COUNT} files  in ${ELAPSED_TIME}`}
              </span>
            </div>
            <Spacer />
          </FadeIn>
        )}

        {state.showCta && (
          <FadeIn>
            <div className="text-neutral-500">Run it on your dbt project:</div>
            <Spacer />
            <div className="flex flex-wrap items-center gap-3">
              <CopyCommand />
              <a
                href="/leaderboard"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-orange-200/20 bg-[#120e0d] px-3 py-1.5 text-white transition-all hover:bg-[#1b1412] active:scale-[0.98]"
              >
                Leaderboard
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-[#ff8e72] bg-[#ff694a] px-3 py-1.5 text-[#120d0b] transition-all hover:bg-[#ff7a5f] active:scale-[0.98]"
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d={GITHUB_ICON_PATH} />
                </svg>
                Star on GitHub
              </a>
            </div>
          </FadeIn>
        )}

        {state.showCta && (
          <div className="mt-8">
            <div className="mb-3 border-l-2 border-neutral-700 pl-3 text-xs leading-relaxed text-neutral-600">
              <strong className="text-neutral-500">dbt-doctor</strong> is a fork of beautiful{" "}
              <a
                href="https://github.com/millionco/react-doctor"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-500 underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
              >
                React Doctor
              </a>{" "}
              by{" "}
              <a
                href="https://million.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-500 underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
              >
                Million
              </a>
              . React Doctor is published under the{" "}
              <a
                href="https://github.com/millionco/react-doctor/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-500 underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
              >
                MIT License
              </a>
              ; this project adapts its ideas (CLI, scoring, agent tooling) for{" "}
              <strong className="text-neutral-500">dbt</strong> and remains{" "}
              <strong className="text-neutral-500">MIT</strong> as well — see the monorepo{" "}
              <a
                href="https://github.com/joachimhodana/dbt-doctor/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-500 underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
              >
                LICENSE
              </a>
              . Thank you to the React Doctor maintainers for the original work.
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem(ANIMATION_COMPLETED_KEY);
                } catch {}
                location.reload();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 transition-colors hover:text-neutral-400"
            >
              <RotateCcw size={12} />
              Restart demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
