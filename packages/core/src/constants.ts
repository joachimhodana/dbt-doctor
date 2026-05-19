// SOURCE_FILE_PATTERN, GIT_LS_FILES_MAX_BUFFER_BYTES, and
// IGNORED_DIRECTORIES live in @dbt-doctor/project-info (which core
// already depends on). Re-exported here so core consumers don't have
// to know which package owns each constant.
export {
  GIT_LS_FILES_MAX_BUFFER_BYTES,
  IGNORED_DIRECTORIES,
  SOURCE_FILE_PATTERN,
} from "@dbt-doctor/project-info";

export const MILLISECONDS_PER_SECOND = 1000;

export const ERROR_PREVIEW_LENGTH_CHARS = 200;

export const PERFECT_SCORE = 100;

/** Default score mode — penalizes affected-file ratio, not just rule variety. */
export const DEFAULT_SCORE_MODE = "files" as const;

export const SCORE_ERROR_RULE_PENALTY = 1.5;

export const SCORE_WARNING_RULE_PENALTY = 0.75;

export const MAX_FILE_RATIO_PENALTY = 40;

/** One score point per N findings (capped). */
export const SCORE_FINDINGS_PER_PENALTY_POINT = 7;

export const SCORE_VOLUME_PENALTY_CAP = 15;

export const SCORE_GOOD_THRESHOLD = 75;

export const SCORE_OK_THRESHOLD = 50;

export const SCORE_BAR_WIDTH_CHARS = 50;

export const SITE_ORIGIN = "https://dbt-doctor.joachimhodana.com";

export const SITE_HOST = "dbt-doctor.joachimhodana.com";

export const SCORE_API_URL = `${SITE_ORIGIN}/api/score`;

export const SHARE_BASE_URL = `${SITE_ORIGIN}/share`;

export const FETCH_TIMEOUT_MS = 10_000;

export const SPAWN_ARGS_MAX_LENGTH_CHARS = 24_000;

export const LINTER_MAX_FILES_PER_BATCH = 100;

export const DEFAULT_BRANCH_CANDIDATES = ["main", "master"];

// JSON-format oxlint / eslint configs dbt-doctor can fold into the
// scan via oxlint's `extends` field. JS / TS configs need a runtime
// to evaluate and aren't supported by oxlint's `extends`. Listed in
// detection priority order — oxlint native first, eslint legacy as a
// compatibility fallback. Also used by tests as the source of truth.
export const GIT_SHOW_MAX_BUFFER_BYTES = 10 * 1024 * 1024;

export const CANONICAL_GITHUB_URL = "https://github.com/joachimhodana/dbt-doctor";

export const SKILL_NAME = "dbt-doctor";

// HACK: lookback cap for stacked / near-miss disable-next-line scanning.
// Larger gaps stop being intentional suppressions and become noise.
export const SUPPRESSION_NEAR_MISS_MAX_LINES = 10;

// In the default human output, show several category sections like an
// audit report, but cap each section so one noisy category does not
// bury the rest of the scan.
export const MAX_CATEGORY_GROUPS_SHOWN_NON_VERBOSE = 5;

export const MAX_RULE_GROUPS_PER_CATEGORY_NON_VERBOSE = 3;

// Minimum width of the rule-name column in the diagnostics list. Pads
// shorter rule names so the right-aligned `N sites` count stays in a
// consistent column even when one rule has a much longer identifier.
export const RULE_NAME_COLUMN_WIDTH_CHARS = 36;

export const OUTPUT_DETAIL_WRAP_WIDTH_CHARS = 88;

export const SPINNER_INDENT_CHARS = 0;

// Defense-in-depth caps for user-supplied glob patterns. Picomatch
// itself is well-hardened against many bad inputs, but ALL glob →
// JavaScript regex compilers emit backtracking-prone output when fed
// densely interleaved wildcards (e.g. `a*a*a*a*…`). These limits
// reject obviously pathological inputs with a clear config error
// before any matcher compilation, bounding worst-case work even when
// the underlying engine is robust. The wildcard cap intentionally
// leaves headroom for realistic ignore patterns
// (e.g. `**/foo/**/bar/**/baz/**/*.tsx` has 9 wildcards) while
// rejecting deeply-stacked globstars and dense alternations.
export const MAX_GLOB_PATTERN_LENGTH_CHARS = 1024;

export const MAX_GLOB_PATTERN_WILDCARD_COUNT = 24;
