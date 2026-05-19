import { PERFECT_SCORE } from "@/constants";
import { getScoreLabel } from "@/utils/get-score-label";

const SCORE_ERROR_RULE_PENALTY = 1.5;
const SCORE_WARNING_RULE_PENALTY = 0.75;
const MAX_FILE_RATIO_PENALTY = 40;
const SCORE_FINDINGS_PER_PENALTY_POINT = 7;
const SCORE_VOLUME_PENALTY_CAP = 15;
const DEFAULT_SCORE_MODE = "files";

const MAX_REQUEST_BODY_BYTES = 1_000_000;
const MAX_DIAGNOSTICS_PER_REQUEST = 50_000;

interface DiagnosticInput {
  plugin: string;
  rule: string;
  severity: "error" | "warning";
  message: string;
  help: string;
  line: number;
  column: number;
  category: string;
  filePath?: string;
}

type ScoreMode = "unique-rules" | "files";

interface ScoreRequestBody {
  diagnostics: DiagnosticInput[];
  scoreMode?: ScoreMode;
  totalFilesScanned?: number;
}

const uniqueRulePenalty = (diagnostics: DiagnosticInput[]): number => {
  const errorRules = new Set<string>();
  const warningRules = new Set<string>();

  for (const diagnostic of diagnostics) {
    const ruleKey = `${diagnostic.plugin}/${diagnostic.rule}`;
    if (diagnostic.severity === "error") {
      errorRules.add(ruleKey);
    } else {
      warningRules.add(ruleKey);
    }
  }

  return (
    errorRules.size * SCORE_ERROR_RULE_PENALTY + warningRules.size * SCORE_WARNING_RULE_PENALTY
  );
};

const fileRatioPenalty = (
  diagnostics: DiagnosticInput[],
  totalFilesScanned: number | undefined,
): number => {
  const affectedFiles = new Set(
    diagnostics.map((diagnostic) => diagnostic.filePath).filter(Boolean),
  ).size;
  const total = Math.max(totalFilesScanned ?? affectedFiles, 1);
  return Math.round((affectedFiles / total) * MAX_FILE_RATIO_PENALTY);
};

const volumePenalty = (diagnosticCount: number): number =>
  Math.min(
    SCORE_VOLUME_PENALTY_CAP,
    Math.floor(diagnosticCount / SCORE_FINDINGS_PER_PENALTY_POINT),
  );

const calculateScore = (
  diagnostics: DiagnosticInput[],
  scoreMode: ScoreMode,
  totalFilesScanned: number | undefined,
): number => {
  if (diagnostics.length === 0) return PERFECT_SCORE;

  const rulePenalty = uniqueRulePenalty(diagnostics);
  const filesPenalty = scoreMode === "files" ? fileRatioPenalty(diagnostics, totalFilesScanned) : 0;
  const findingsPenalty = volumePenalty(diagnostics.length);

  return Math.max(0, Math.round(PERFECT_SCORE - rulePenalty - filesPenalty - findingsPenalty));
};

const isValidDiagnostic = (value: unknown): value is DiagnosticInput => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.plugin === "string" &&
    typeof record.rule === "string" &&
    (record.severity === "error" || record.severity === "warning") &&
    typeof record.message === "string" &&
    typeof record.help === "string" &&
    typeof record.line === "number" &&
    typeof record.column === "number" &&
    typeof record.category === "string" &&
    (record.filePath === undefined || typeof record.filePath === "string")
  );
};

const isValidScoreMode = (value: unknown): value is ScoreMode =>
  value === "unique-rules" || value === "files";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS = (): Response => new Response(null, { status: 204, headers: CORS_HEADERS });

const respondError = (status: number, message: string): Response =>
  Response.json({ error: message }, { status, headers: CORS_HEADERS });

export const POST = async (request: Request): Promise<Response> => {
  const ip = (request as { ip?: string }).ip || request.headers.get("x-forwarded-for") || "unknown";
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BODY_BYTES) {
    return respondError(413, "Request body exceeds 1MB");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray((body as { diagnostics: unknown }).diagnostics)
  ) {
    return respondError(400, "Request body must contain a 'diagnostics' array");
  }

  const requestBody = body as ScoreRequestBody;
  const diagnostics = requestBody.diagnostics;
  if (diagnostics.length > MAX_DIAGNOSTICS_PER_REQUEST) {
    return respondError(413, "Too many diagnostics in a single request");
  }

  const isValidPayload = diagnostics.every((entry: unknown) => isValidDiagnostic(entry));

  if (!isValidPayload) {
    return respondError(
      400,
      "Each diagnostic must have 'plugin', 'rule', 'severity', 'message', 'help', 'line', 'column', and 'category'",
    );
  }

  const scoreMode = isValidScoreMode(requestBody.scoreMode)
    ? requestBody.scoreMode
    : DEFAULT_SCORE_MODE;
  const totalFilesScanned =
    typeof requestBody.totalFilesScanned === "number" && requestBody.totalFilesScanned > 0
      ? requestBody.totalFilesScanned
      : undefined;

  const score = calculateScore(diagnostics, scoreMode, totalFilesScanned);

  console.log({ ip, score, scoreMode, totalFilesScanned }, diagnostics.length);

  return Response.json({ score, label: getScoreLabel(score) }, { headers: CORS_HEADERS });
};
