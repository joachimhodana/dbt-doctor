import { describe, expect, it } from "vitest";
import { parseDbtDoctorProps } from "@dbt-doctor/core";

describe("parseDbtDoctorProps", () => {
  it("parses scalar props", () => {
    expect(
      parseDbtDoctorProps(`
# example project
score_mode=files
preset=enterprise
fail_on=warning
offline=false
skip_sqlfluff=true
use_sqlfluff=true
manifest_path=artifacts/fusion/manifest.json
fail_project_under=7.5
fail_any_item_under=5.25
`),
    ).toEqual({
      scoreMode: "files",
      preset: "enterprise",
      failOn: "warning",
      offline: false,
      skipSqlfluff: true,
      useSqlfluff: true,
      manifestPath: "artifacts/fusion/manifest.json",
      failProjectUnder: 7.5,
      failAnyItemUnder: 5.25,
    });
  });

  it("parses ignore lists and severity maps", () => {
    expect(
      parseDbtDoctorProps(`
ignore.rules=dbt-doctor/no-select-star,dbt-doctor/per-model-schema-yml
ignore.files=models/legacy/**
ignore.tags=design
rules.dbt-doctor/no-select-star=off
rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$
rules.model-name-contract.min_segments=2
rules.model-name-contract.enabled=true
rules.model-name-contract.owners=analytics,finance
categories.Architecture=error
surfaces.score.excludeTags=design
`),
    ).toEqual({
      ignore: {
        rules: ["dbt-doctor/no-select-star", "dbt-doctor/per-model-schema-yml"],
        files: ["models/legacy/**"],
        tags: ["design"],
      },
      rules: { "dbt-doctor/no-select-star": "off" },
      ruleConfig: {
        "model-name-contract": {
          pattern: "^(stg|int|fct|dim)_[a-z0-9_]+$",
          minSegments: 2,
          enabled: true,
          owners: ["analytics", "finance"],
        },
      },
      categories: { Architecture: "error" },
      surfaces: { score: { excludeTags: ["design"] } },
    });
  });
});
