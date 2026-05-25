import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { clearConfigCache, loadConfigWithSource } from "@dbt-doctor/core";
import type { DbtDoctorConfig } from "@dbt-doctor/types";

const loadConfig = (rootDirectory: string): DbtDoctorConfig | null =>
  loadConfigWithSource(rootDirectory)?.config ?? null;

const tempRootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-config-test-"));

afterAll(() => {
  fs.rmSync(tempRootDirectory, { recursive: true, force: true });
});

describe("loadConfig", () => {
  describe(".dbt-doctor", () => {
    let propsDirectory: string;

    beforeAll(() => {
      propsDirectory = path.join(tempRootDirectory, "with-props-file");
      fs.mkdirSync(propsDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(propsDirectory, ".dbt-doctor"),
        `
score_mode=files
preset=strict
fail_on=error
ignore.rules=dbt-doctor/no-select-star
`,
      );
    });

    it("loads config from .dbt-doctor", () => {
      clearConfigCache();
      const config = loadConfig(propsDirectory);
      expect(config).toEqual({
        scoreMode: "files",
        preset: "strict",
        failOn: "error",
        ignore: { rules: ["dbt-doctor/no-select-star"] },
      });
    });

    it("loads scan options", () => {
      const optionsDirectory = path.join(tempRootDirectory, "with-scan-options");
      fs.mkdirSync(optionsDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(optionsDirectory, ".dbt-doctor"),
        `
ignore.rules=dbt-doctor/no-select-star
lint=true
verbose=true
diff=main
`,
      );
      clearConfigCache();
      expect(loadConfig(optionsDirectory)).toEqual({
        ignore: { rules: ["dbt-doctor/no-select-star"] },
        lint: true,
        verbose: true,
        diff: "main",
      });
    });

    it("loads diff as boolean", () => {
      const boolDiffDirectory = path.join(tempRootDirectory, "with-bool-diff");
      fs.mkdirSync(boolDiffDirectory, { recursive: true });
      fs.writeFileSync(path.join(boolDiffDirectory, ".dbt-doctor"), "diff=true\n");
      clearConfigCache();
      expect(loadConfig(boolDiffDirectory)?.diff).toBe(true);
    });

    it("loads preset and scoreMode", () => {
      const tier4Directory = path.join(tempRootDirectory, "tier-4-config");
      fs.mkdirSync(tier4Directory, { recursive: true });
      fs.writeFileSync(
        path.join(tier4Directory, ".dbt-doctor"),
        `
preset=enterprise
score_mode=files
`,
      );
      clearConfigCache();
      expect(loadConfig(tier4Directory)).toEqual({
        preset: "enterprise",
        scoreMode: "files",
      });
    });
  });

  describe("no config", () => {
    it("returns null when no .dbt-doctor is found", () => {
      const emptyDirectory = path.join(tempRootDirectory, "no-config");
      fs.mkdirSync(emptyDirectory, { recursive: true });
      clearConfigCache();
      expect(loadConfig(emptyDirectory)).toBeNull();
    });

    it("returns null when .dbt-doctor is a directory (EISDIR)", () => {
      const directoryConfigRoot = path.join(tempRootDirectory, "eisdir-config");
      fs.mkdirSync(directoryConfigRoot, { recursive: true });
      fs.mkdirSync(path.join(directoryConfigRoot, ".dbt-doctor"), { recursive: true });
      clearConfigCache();
      expect(loadConfig(directoryConfigRoot)).toBeNull();
    });
  });

  describe("empty config", () => {
    it("returns an empty config object for a comment-only file", () => {
      const emptyPropsDirectory = path.join(tempRootDirectory, "comment-only-props");
      fs.mkdirSync(emptyPropsDirectory, { recursive: true });
      fs.writeFileSync(path.join(emptyPropsDirectory, ".dbt-doctor"), "# no options yet\n");
      clearConfigCache();
      expect(loadConfig(emptyPropsDirectory)).toEqual({});
    });
  });

  describe("loadConfigWithSource", () => {
    it("returns the directory the config was loaded from", () => {
      const sourceDir = path.join(tempRootDirectory, "with-source");
      fs.mkdirSync(sourceDir, { recursive: true });
      fs.writeFileSync(path.join(sourceDir, ".dbt-doctor"), "root_dir=apps/web\n");
      clearConfigCache();
      const loaded = loadConfigWithSource(sourceDir);
      expect(loaded?.sourceDirectory).toBe(sourceDir);
      expect(loaded?.config.rootDir).toBe("apps/web");
    });

    it("returns the ancestor directory when the config lives upstream", () => {
      const ancestorDir = path.join(tempRootDirectory, "with-source-ancestor");
      const childDir = path.join(ancestorDir, "packages", "ui");
      fs.mkdirSync(childDir, { recursive: true });
      fs.writeFileSync(path.join(ancestorDir, ".dbt-doctor"), "root_dir=apps/web\n");
      clearConfigCache();
      const loaded = loadConfigWithSource(childDir);
      expect(loaded?.sourceDirectory).toBe(ancestorDir);
    });
  });

  describe("ancestor config inheritance", () => {
    it("finds config from parent directory when not present locally", () => {
      const parentDirectory = path.join(tempRootDirectory, "monorepo-inherit");
      const childDirectory = path.join(parentDirectory, "packages", "ui");
      fs.mkdirSync(childDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(parentDirectory, ".dbt-doctor"),
        "ignore.rules=from-monorepo-root\n",
      );
      clearConfigCache();
      expect(loadConfig(childDirectory)).toEqual({
        ignore: { rules: ["from-monorepo-root"] },
      });
    });

    it("prefers local config over ancestor config", () => {
      const parentDirectory = path.join(tempRootDirectory, "monorepo-local-wins");
      const childDirectory = path.join(parentDirectory, "packages", "ui");
      fs.mkdirSync(childDirectory, { recursive: true });
      fs.writeFileSync(path.join(parentDirectory, ".dbt-doctor"), "ignore.rules=from-parent\n");
      fs.writeFileSync(path.join(childDirectory, ".dbt-doctor"), "ignore.rules=from-child\n");
      clearConfigCache();
      expect(loadConfig(childDirectory)).toEqual({
        ignore: { rules: ["from-child"] },
      });
    });

    it("returns null when no config exists anywhere in the ancestor chain", () => {
      const isolatedDirectory = path.join(tempRootDirectory, "no-config-anywhere", "deep", "path");
      fs.mkdirSync(isolatedDirectory, { recursive: true });
      clearConfigCache();
      expect(loadConfig(isolatedDirectory)).toBeNull();
    });
  });
});
