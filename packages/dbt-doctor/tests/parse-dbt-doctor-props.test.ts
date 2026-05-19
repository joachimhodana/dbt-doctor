import { describe, expect, it } from "vitest";
import { parseDbtDoctorProps } from "@dbt-doctor/core";

describe("parseDbtDoctorProps", () => {
  it("parses scalar props", () => {
    expect(
      parseDbtDoctorProps(`
# affiliates
score_mode=files
preset=enterprise
fail_on=warning
offline=false
skip_sqlfluff=true
`),
    ).toEqual({
      scoreMode: "files",
      preset: "enterprise",
      failOn: "warning",
      offline: false,
      skipSqlfluff: true,
    });
  });

  it("parses ignore lists and severity maps", () => {
    expect(
      parseDbtDoctorProps(`
ignore.rules=dbt-doctor/no-select-star,dbt-doctor/per-model-schema-yml
ignore.files=models/legacy/**
ignore.tags=design
rules.dbt-doctor/no-select-star=off
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
      categories: { Architecture: "error" },
      surfaces: { score: { excludeTags: ["design"] } },
    });
  });

  it("parses baseline as boolean or path", () => {
    expect(parseDbtDoctorProps("baseline=true")).toEqual({ baseline: true });
    expect(parseDbtDoctorProps("baseline=.dbt-doctor-baseline.json")).toEqual({
      baseline: ".dbt-doctor-baseline.json",
    });
  });
});
