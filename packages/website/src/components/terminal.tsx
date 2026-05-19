"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, ChevronRight, RotateCcw } from "lucide-react";
import { PERFECT_SCORE } from "@/constants";
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
const TARGET_SCORE = 42;
const SCORE_BAR_WIDTH_MOBILE = 15;
const SCORE_BAR_WIDTH_DESKTOP = 30;
const TOTAL_ISSUE_COUNT = 18;
const TOTAL_SOURCE_FILE_COUNT = 24;
const AFFECTED_FILE_COUNT = 12;
const ELAPSED_TIME = "2.1s";

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

const DIAGNOSTICS: RuleDiagnostic[] = [
  {
    ruleKey: "dbt-doctor/no-select-star",
    severity: "warning",
    message: "Avoid SELECT * in dbt models",
    help: "List columns explicitly for stable contracts and clearer lineage.",
    count: 4,
    location: "models/staging/stripe_customers.sql:12",
  },
  {
    ruleKey: "dbt-doctor/staging-prefix",
    severity: "warning",
    message: 'Staging model "stripe_customers" should use stg_ prefix',
    help: "Rename to stg_<name> for consistent layer naming.",
    count: 1,
    location: "models/staging/stripe_customers.sql",
  },
  {
    ruleKey: "dbt-doctor/prefer-ref-over-raw-source",
    severity: "warning",
    message: "Model may reference another relation without ref()",
    help: "Use {{ ref('model_name') }} for dbt lineage and environment safety.",
    count: 2,
    location: "models/intermediate/int_orders.sql:8",
  },
  {
    ruleKey: "dbt-doctor/schema-description",
    severity: "warning",
    message: 'Model "fct_revenue" is missing a description',
    help: "Add a description field under the model in schema.yml.",
    count: 3,
    location: "models/marts/schema.yml:14",
  },
  {
    ruleKey: "dbt-doctor/no-run-query-in-model",
    severity: "error",
    message: "run_query() should not be used in model SQL",
    help: "Move imperative queries to macros or pre-hooks, not model files.",
    count: 1,
    location: "models/marts/dim_users.sql:5",
  },
];

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
          dbt Doctor <span className="text-neutral-500">(www.dbt.doctor)</span>
        </div>
      </div>
    </div>
  );
};

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
    : "shrink-0 text-white/50 transition-colors group-hover:text-white";

  return (
    <div className="group flex items-center gap-4 border border-white/20 px-3 py-1.5 transition-colors hover:bg-white/5">
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
  visibleDiagnosticCount: DIAGNOSTICS.length,
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

      for (let index = 0; index < DIAGNOSTICS.length; index++) {
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
    <div className="mx-auto min-h-screen w-full max-w-3xl bg-[#0a0a0a] p-6 pb-32 font-mono text-base leading-relaxed text-neutral-300 sm:p-8 sm:pb-40 sm:text-lg">
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
          <div className="text-neutral-500">Snowflake, BigQuery, Redshift, Postgres, DuckDB, and more.</div>
          <Spacer />
        </FadeIn>
      )}

      {state.visibleDiagnosticCount > 0 && (
        <div>
          {DIAGNOSTICS.slice(0, state.visibleDiagnosticCount).map((diagnostic) => (
            <FadeIn key={diagnostic.ruleKey}>
              <DiagnosticItem diagnostic={diagnostic} />
            </FadeIn>
          ))}
        </div>
      )}

      {state.score !== null && (
        <FadeIn>
          <ScoreHeader score={state.score} />
          <Spacer />
        </FadeIn>
      )}

      {state.showCountsSummary && (
        <FadeIn>
          <div>
            <span className="text-neutral-500">{"  "}</span>
            <span className="text-red-400">{TOTAL_ISSUE_COUNT} issues</span>
            <span className="text-neutral-500">
              {`  across ${AFFECTED_FILE_COUNT}/${TOTAL_SOURCE_FILE_COUNT} files  in ${ELAPSED_TIME}`}
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
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/20 px-3 py-1.5 text-white transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              Leaderboard
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-white/20 bg-white px-3 py-1.5 text-black transition-all hover:bg-white/90 active:scale-[0.98]"
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
          <div className="mb-3 text-xs text-neutral-600">
            dbt-doctor is a direct fork and adaptation of{" "}
            <a
              href="https://react.doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
            >
              react.doctor
            </a>{" "}
            by{" "}
            <a
              href="https://million.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
            >
              Million
            </a>
            , rebuilt for dbt (SQL, YAML, and Jinja).
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
  );
};

export default Terminal;
