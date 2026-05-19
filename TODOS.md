# React Doctor / React Review TODOs

## P0 - Trust-Breaking False Positives

### [ ] Separate PR regressions from baseline health in React Review

Status: hosted/product, confirmed by screenshot.

Source:

- Screenshot: score 70, "Needs Improvement", "Below 90", but "This PR leaves the React health score unchanged."

Fix:

- Track baseline score, PR score, delta, new diagnostics, and fixed diagnostics.
- Use neutral wording when unchanged:
  - `Repository score remains 70/100. This PR did not introduce React Review regressions.`
  - `Baseline is below 90, but this PR leaves the score unchanged.`
- Warn/fail only on worsened score or new blocking diagnostics unless absolute-score gating is explicitly configured.

### [ ] Fix ReDoS risk in glob pattern compilation

Status: confirmed current, open.

Link: https://github.com/joachimhodana/dbt-doctor/pull/243

Fix:

- Add max pattern length and max wildcard count.
- Reject pathological patterns with clear config errors.
- Prefer a proven glob matcher if possible.
- Add tests for worst-case patterns.

## P1 - CI, Docs, Config, Product Semantics

### [ ] Reconcile offline scoring behavior

Status: confirmed current.

Link: https://github.com/joachimhodana/dbt-doctor/issues/89

Current problem:

- `inspect.ts` omits score in offline mode.
- README says offline skips score API and no score is shown.
- `action.yml` says offline will "calculate score locally."

Fix:

- Implement local score calculation or update `action.yml` and marketplace docs.
- Add tests for `--offline`, `--score --offline`, Action offline score output, and CI auto-offline.

### [ ] Stop recommending `joachimhodana/dbt-doctor@main`

Status: confirmed current.

Links:

- https://github.com/joachimhodana/dbt-doctor/issues/75
- https://github.com/joachimhodana/dbt-doctor/issues/79

Current problem:

- README still uses `uses: joachimhodana/dbt-doctor@main`.
- `@main` was explicitly reported as supply-chain risk.
- No `.github/workflows/release.yml` was found.

Fix:

- Recommend stable action tags.
- Ensure release workflow exists.
- Ensure released action inputs match docs.
- Document npm/action/marketing version mapping.

### [ ] Expose `--annotations` through `action.yml`

Status: partially addressed.

Link: https://github.com/joachimhodana/dbt-doctor/issues/81

Fix:

- Add `annotations` input.
- Pass `--annotations` when enabled.
- Document annotations-only, comments-only, or both.

### [x] Add category-level rule controls

Status: landed.

Done:

- Added the ESLint / oxlint-shaped severity surface: top-level
  `rules` and `categories` fields on `DbtDoctorConfig`, each a
  `Record<string, "error" | "warn" | "off">`. `rules` is the exact
  ESLint `.eslintrc` / flat-config shape; `categories` mirrors
  oxlint's `categories` field, keyed by React Doctor's display
  categories. Per-rule wins over per-category. Applied at lint
  registration time so `"off"` short-circuits before the rule runs,
  and re-stamped post-lint so `--fail-on`, the score, the CLI
  summary, and external-plugin rules all see the user-chosen
  severity.
- Composes with the existing `surfaces` controls (per-channel
  visibility) and `ignore.tags` (whole-family suppression for
  behavioral groupings like `"design"` / `"test-noise"` /
  `"migration-hint"` that don't align with a single category). Use
  `rules` / `categories` to change severity across every channel
  at once.
- Bucket-derived auto-tags so cross-cutting controls can target whole
  families without each rule repeating the tag — `"react-native"` on
  every rule in the `react-native/` bucket, `"server-action"` on every
  rule in the `server/` bucket, and explicit `"migration-hint"` on
  `no-react19-deprecated-apis`, `no-react-dom-deprecated-apis`,
  `no-legacy-class-lifecycles`, and `no-legacy-context-api`.
- README documents the five rule families called out in the original
  fix (`design`, `test-noise`, `react-native`, `server-action`,
  `migration-hint`) with copy-pasteable JSON examples.

### [ ] Support mature-codebase adoption workflows natively

Status: user feedback, `dbt-doctor@0.0.31`.

Sources:

- Team disabled duplicate `react/*`, `jsx-a11y/*`, `react-hooks-js/*`, and `react-hooks/exhaustive-deps` rules because ESLint already covers them.
- Team disabled `dbt-doctor/no-barrel-import` because barrel files are an intentional public API pattern and not a Vite perf concern.
- Team disabled 8 CSS/animation perf rules after autofixes degraded `prefers-reduced-motion` behavior by making animations complete instantly and look stuck.
- Team built custom pre-commit, CI, PR comment, dashboard, parallel worker, and per-module config plumbing around React Doctor.

Remaining:

- Make CSS/animation autofixes `prefers-reduced-motion` aware and mark risky autofixes separately from safe ones.
- Add native diff-only/touched-line enforcement for staged files and PRs.
- Add baseline mode so existing violations can be tracked without blocking new commits.
- Emit first-class PR comment data or provide built-in sticky PR comments with violation summaries and autofix guidance.
- Support per-module/package reports, scores, trends, ownership, and backlog counts for monorepos.
- Add native parallel runner controls and config inheritance/per-module overrides.
- Make `no-barrel-import` bundler/framework aware, or add an official way to mark barrel files as intentional public APIs.

### [ ] Make test-noise suppression consistent

Status: partially addressed.

Fix:

- Audit every rule.
- Tag noisy test rules:
  - remaining async defer rules,
  - JS micro-performance,
  - fixture-heavy UI rules.
- Keep hooks correctness, accessibility correctness, and security enabled in tests.

### [ ] Improve suppression ergonomics

Status: partially addressed.

Sources:

- Issue #206 suppression friction.
- Historical issues: #144, #158, #159, #161.

Fix:

- Show exact suppression snippet in PR comments.
- Accept bare rule IDs when unambiguous.
- Link each PR comment group to suppression docs.

### [ ] Finish Husky/lint-staged docs

Status: open.

Links:

- Issue: https://github.com/joachimhodana/dbt-doctor/issues/203
- PR: https://github.com/joachimhodana/dbt-doctor/pull/213
- Related: #74, #115, #31

Fix:

- Land or replace #213.
- Explain `--diff`, `--staged`, `--full`, partially staged files, and index-vs-working-tree behavior.
- Add recipes for Husky, lint-staged, Lefthook, and pre-commit.

### [ ] Decide custom `package.json` path support

Status: open duplicate PRs.

Links:

- https://github.com/joachimhodana/dbt-doctor/pull/214
- https://github.com/joachimhodana/dbt-doctor/pull/32

Fix:

- Pick `--package-json <path>` or another stable API.
- Avoid cache bugs when same source dir is analyzed with different manifests.
- Close duplicate PR.

### [ ] Keep React dependency detection robust in non-standard workspaces

Status: partially addressed.

Sources:

- "No React dependency found" reports in Bun workspaces, catalog setups, and non-standard `package.json` layouts.
- Related fixed issues: #27, #87, #101, #105, #116, #191.
- Related open PRs: #214, #32.

Fix:

- Keep regression coverage for pnpm/Bun catalogs, grouped catalogs, peer deps, and dev deps.
- Improve error text with nearest detected package and suggested `--package-json` / `--project` fix.
- Do not regress root-project and monorepo package discovery.

### [ ] Track large-codebase crash and resource failure modes

Status: partially addressed by #262.

Sources:

- PR: https://github.com/joachimhodana/dbt-doctor/pull/262
- High RAM / OOM / SIGABRT reports on large monorepos.
- Historical dead-code crashes: #77, #132, #135, #149.
- Historical large command/path issue: #46.

Fix:

- Keep crash regressions even after Knip removal.
- Add clearer partial-output/error reporting for scan aborts.
- Document memory expectations and large-repo mitigations.
- Re-check Windows/path-length behavior outside dead-code scanning.

### [ ] Clarify React Doctor vs React Review

Status: hosted/product.

User confusion:

- "Should we use react doctor or react review?"
- "Is there additional benefit if already using dbt-doctor?"
- "So a dbt-doctor clone?"

Fix:

- React Doctor: local CLI, packages, CI command, offline/local workflows.
- React Review: hosted dashboard, GitHub App, PR comments, baseline/delta, team workflow.
- Add "Already using React Doctor?" migration path.

### [ ] Fix hosted private-repo / repo-not-found failures

Status: hosted/product.

Fix:

- Audit private repo auth path.
- Distinguish not installed, missing permission, private repo, rate limit, unsupported host, and backend failure.
- Add reconnect/retry path.

### [ ] Add non-GitHub / self-hosted GitLab integration path

Status: hosted/product.

Source:

- Self-hosted GitLab user said they feel left out.

Fix:

- Decide support level for GitLab SaaS, self-hosted GitLab, generic CI annotations, and webhook-based hosted Review.
- Publish current workaround using CLI JSON/SARIF or CI output.
- Add GitLab CI recipe if hosted integration is not immediate.

### [ ] Improve install flow and post-install empty states

Status: hosted/product.

Sources:

- Fintech user cannot install third-party GHAs.
- User saw scary full-account GitHub access.
- User installed but could not see lints.

Fix:

- Make GitHub App, OAuth, GHA, CLI, and enterprise/self-hosted paths explicit.
- Explain selected-repo vs account-wide access before redirect.
- Add states for waiting, queued, running, no issues, comment failed, repo access failed, unsupported project, backend error.
- Alert internally when install succeeds but no analysis/comment appears.

### [ ] Keep local and hosted privacy/data behavior explicit

Status: partially addressed.

Links:

- https://github.com/joachimhodana/dbt-doctor/issues/35
- https://github.com/joachimhodana/dbt-doctor/issues/89
- https://github.com/joachimhodana/dbt-doctor/issues/92

Fix:

- Explain what CLI sends to score/share APIs.
- Explain what `--offline` disables.
- Explain hosted Review repo/code access.
- Explain local CLI-only mode and share-link opt-out.

### [ ] Improve score-change communication

Status: partially addressed.

Sources:

- 89 -> 49.
- 93 -> 68.
- 44/100 with hundreds of warnings.

Fix:

- Add release notes for material rule changes.
- Show why scores changed: new rules, changed severities, formula, unique error/warning rules.
- Avoid encouraging blind 100/100 chasing.

### [ ] Add clear release/version mapping

Status: partially addressed.

Fix:

- Publish mapping for marketing version, npm version, action tag, and hosted Review version.
- Include rule diff and expected score impact in releases.

### [ ] Verify local report/export support and docs

Status: partially addressed.

Links:

- #47
- #60
- #88

Fix:

- Confirm current JSON/report/share outputs.
- Document local-only report workflow.
- Add SARIF or generic report path if needed for non-GitHub CI.

## P2 - Platform and Product Expansion

### [ ] Decide dangerous CI/security config detection

Status: product.

Source:

- User suggested detecting dangerous configs like `pull_request_target` plus shared caches.

Candidate checks:

- `pull_request_target` on untrusted PRs.
- Shared caches in publish/release pipelines.
- Cache poisoning.
- Unpinned third-party actions.
- Overbroad `GITHUB_TOKEN` permissions.
- Secrets exposed to PR code.
- Publish jobs after untrusted build/test.
- Unsafe `workflow_run`.

### [ ] Reframe positioning away from generic "React review bot"

Status: product.

Source:

- User said they did not naturally feel a strong urge to install a "react review bot."

Better wedges:

- Catch bad agent-generated React before merge.
- Stop hooks/rendering/server-client bugs in PRs.
- Framework-aware React CI guardrail.
- Security/correctness-first React reviewer.
- React Review plus repo/CI security checks.

### [ ] Improve hosted React Review PR comment and dashboard polish

Status: hosted/product.

Sources:

- v1 feedback called out dashboard/error states and PR comment quality.
- Competitive feedback criticized whimsical, filler, low-value, or over-broad bot comments.

Fix:

- Put new regressions first and baseline findings separately.
- Collapse low-value warnings by default.
- Keep comments concise, serious, and actionable.
- Improve dashboard empty/error states and copy.

### [ ] Add Preact support position

Status: platform.

Fix:

- Decide no support, best effort, Preact-specific mode, or rule subset.
- Detect `preact`, `preact/compat`, and `@preact/signals`.
- Document unsupported React-specific rules.

### [ ] Clarify React Native coverage

Status: partially addressed.

Links:

- Support: #21, #65, #64

Fix:

- Publish RN support matrix.
- Document `rawTextWrapperComponents`.

### [ ] Decide HIR precision work priority

Status: open.

Link: https://github.com/joachimhodana/dbt-doctor/pull/164

Decision:

- HIR may reduce AST heuristic false positives.
- Do not merge until false-positive policy is stable and regressions prove it improves real cases.

### [ ] Decide TUI priority

Status: open.

Link: https://github.com/joachimhodana/dbt-doctor/pull/173

Decision:

- Useful for local exploration.
- Not a blocker for PR trust, install, or false-positive quality.
- Keep behind subcommand or beta flag.

### [ ] Decide broader ecosystem "Doctor" variants

Status: product.

Source:

- Requests mention Vue, Angular, Svelte, TypeScript, Python, Solid, and broader agent-friendly-code checks.

Decision:

- Keep React Doctor React-only, or create separate rule packs/products.
- If broadening, separate branding and diagnostics so React-specific quality is not diluted.

## Open PR Triage

- [ ] #251 `feat: port PR 217 lint rule coverage` - large rule expansion; do not land before false-positive defaults are settled.
- [ ] #243 ReDoS glob pattern fix - prioritize security review.
- [ ] #238 React Review audit - reconcile remaining React Review audit findings.
- [ ] #217 v2 Rasmus precision branch - port useful fixes intentionally.
- [ ] #214 / #32 `--package-json` - pick one API and close duplicate.
- [ ] #213 Husky/lint-staged docs - land or replace.
- [ ] #210 `fix` - retitle/body or close.
- [ ] #207 Molten Hub coverage - triage likely unrelated.
- [ ] #189 Simplified Chinese README - docs decision.
- [ ] #186 library-aware React 19/test scoping/build-entry/string lookup - partly obsolete after Knip removal; port useful parts.
- [ ] #179 index-derived key locals - decide priority.
- [ ] #173 TUI - product priority.
- [ ] #164 HIR port - precision research; high review burden.

## Open Issue Triage

- [ ] #219 React Review audit - covered by async/test noise, baseline semantics, and #238.
- [ ] #216 React Review default-branch diagnostics - covered by async/test noise, baseline semantics, and #238.
- [ ] #215 `Hello` - close unless reporter adds actionable detail.
- [ ] #203 Husky/lint-staged docs - covered by P1.

## Historical Regression Ledger

### Monorepo and discovery

- [ ] #82 Action/docs still need stale docs and release pinning fixes.

### GitHub Action and CI

- [ ] #75 / #79 release tags addressed historically, but README still uses `@main`.
- [ ] #107 Action offline input exists but description is wrong.
- [ ] #81 annotations exist in CLI but not `action.yml`.

### CLI and agent workflow

- [ ] #74 / #115 / #203 pre-commit docs and staged semantics.
- [ ] #45 changed-file scan summary still needs clear baseline/diff wording.
- [ ] #89 offline score still inconsistent.
- [ ] #47 / #60 / #88 local reports: verify current support/docs.
- [ ] #214 / #32 custom package JSON path.

### Rule quality

- [ ] #127 `no-usememo-simple-expression` needs clearer rationale/threshold docs.
- [ ] #95 `set-state-in-effect` precision remains worth tracking.
- [ ] #179 index-derived key locals open.

### Product and docs

- [ ] #99 offline docs stale because Action description conflicts.
- [ ] #188 / #97 Action docs and PR blocking partially addressed; need stable tags and delta semantics.
- [ ] #189 Simplified Chinese README open.
- [ ] #203 Husky/lint-staged docs open.
- [ ] #65 / #21 / #64 RN support exists; support matrix/docs remain open.

### Shipped enhancements

- [ ] #164 HIR port open.
- [ ] #173 TUI open.
- [ ] #57 configurable accessibility presets closed without clear current support.

## Immediate Order

1. [ ] Add remaining JS micro-perf test-file suppression.
2. [ ] Change React Review PR comment semantics to delta-first.
3. [ ] Update docs for stable action tags, offline score behavior, and annotations.
4. [ ] Triage stale PRs #210 and #207.
