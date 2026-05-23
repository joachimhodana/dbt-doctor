---
"dbt-doctor": patch
"dbt-doctor-rules": patch
"@dbt-doctor/types": patch
"@dbt-doctor/project-info": patch
"@dbt-doctor/manifest": minor
---

Add Phase 1 manifest graph support with explicit manifest path configuration.

- Introduce `@dbt-doctor/manifest` package for reading and normalizing graph artifacts.
- Add manifest-backed rules (`staging-depends-on-staging`, `unused-sources`) and skip manifest-only rules when artifact is missing.
- Add `manifestPath` config support and CLI `--manifest <path>` override for dbt Core/Fusion compatibility.
