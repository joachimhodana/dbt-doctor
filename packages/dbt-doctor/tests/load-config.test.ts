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
  describe("dbt-doctor.config.json", () => {
    let configDirectory: string;

    beforeAll(() => {
      configDirectory = path.join(tempRootDirectory, "with-config-file");
      fs.mkdirSync(configDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(configDirectory, "dbt-doctor.config.json"),
        JSON.stringify({
          ignore: {
            rules: ["react/no-danger", "dbt-doctor/no-giant-component"],
            files: ["src/generated/**"],
          },
        }),
      );
    });

    it("loads config from dbt-doctor.config.json", () => {
      const config = loadConfig(configDirectory);
      expect(config).toEqual({
        ignore: {
          rules: ["react/no-danger", "dbt-doctor/no-giant-component"],
          files: ["src/generated/**"],
        },
      });
    });
  });

  describe("package.json dbtDoctor key", () => {
    let packageJsonDirectory: string;

    beforeAll(() => {
      packageJsonDirectory = path.join(tempRootDirectory, "with-package-json-config");
      fs.mkdirSync(packageJsonDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(packageJsonDirectory, "package.json"),
        JSON.stringify({
          name: "test-project",
          dbtDoctor: {
            ignore: {
              rules: ["jsx-a11y/no-autofocus"],
            },
          },
        }),
      );
    });

    it("loads config from package.json dbtDoctor key", () => {
      const config = loadConfig(packageJsonDirectory);
      expect(config).toEqual({
        ignore: {
          rules: ["jsx-a11y/no-autofocus"],
        },
      });
    });
  });

  describe("config file takes precedence", () => {
    let precedenceDirectory: string;

    beforeAll(() => {
      precedenceDirectory = path.join(tempRootDirectory, "precedence");
      fs.mkdirSync(precedenceDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(precedenceDirectory, "dbt-doctor.config.json"),
        JSON.stringify({ ignore: { rules: ["from-config-file"] } }),
      );
      fs.writeFileSync(
        path.join(precedenceDirectory, "package.json"),
        JSON.stringify({
          name: "test",
          dbtDoctor: { ignore: { rules: ["from-package-json"] } },
        }),
      );
    });

    it("prefers dbt-doctor.config.json over package.json", () => {
      const config = loadConfig(precedenceDirectory);
      expect(config?.ignore?.rules).toEqual(["from-config-file"]);
    });
  });

  describe("no config", () => {
    let emptyDirectory: string;

    beforeAll(() => {
      emptyDirectory = path.join(tempRootDirectory, "no-config");
      fs.mkdirSync(emptyDirectory, { recursive: true });
    });

    it("returns null when no config is found", () => {
      const config = loadConfig(emptyDirectory);
      expect(config).toBeNull();
    });

    it("returns null when config path is a directory instead of a file (EISDIR)", () => {
      const directoryConfigRoot = path.join(tempRootDirectory, "eisdir-config");
      fs.mkdirSync(directoryConfigRoot, { recursive: true });
      fs.mkdirSync(path.join(directoryConfigRoot, "dbt-doctor.config.json"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(directoryConfigRoot, "package.json"), { recursive: true });

      const config = loadConfig(directoryConfigRoot);
      expect(config).toBeNull();
    });
  });

  describe("scan options in config", () => {
    let optionsDirectory: string;

    beforeAll(() => {
      optionsDirectory = path.join(tempRootDirectory, "with-scan-options");
      fs.mkdirSync(optionsDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(optionsDirectory, "dbt-doctor.config.json"),
        JSON.stringify({
          ignore: { rules: ["react/no-danger"] },
          lint: true,
          verbose: true,
          diff: "main",
        }),
      );
    });

    it("loads scan options alongside ignore config", () => {
      const config = loadConfig(optionsDirectory);
      expect(config).toEqual({
        ignore: { rules: ["react/no-danger"] },
        lint: true,
        verbose: true,
        diff: "main",
      });
    });

    it("loads diff as boolean", () => {
      const boolDiffDirectory = path.join(tempRootDirectory, "with-bool-diff");
      fs.mkdirSync(boolDiffDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(boolDiffDirectory, "dbt-doctor.config.json"),
        JSON.stringify({ diff: true }),
      );
      const config = loadConfig(boolDiffDirectory);
      expect(config?.diff).toBe(true);
    });
  });

  describe("invalid config", () => {
    let invalidJsonDirectory: string;
    let nonObjectDirectory: string;

    beforeAll(() => {
      invalidJsonDirectory = path.join(tempRootDirectory, "invalid-json");
      fs.mkdirSync(invalidJsonDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(invalidJsonDirectory, "dbt-doctor.config.json"),
        "not valid json{{{",
      );

      nonObjectDirectory = path.join(tempRootDirectory, "non-object-config");
      fs.mkdirSync(nonObjectDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(nonObjectDirectory, "dbt-doctor.config.json"),
        JSON.stringify([1, 2, 3]),
      );
    });

    it("returns null and warns for malformed JSON", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config = loadConfig(invalidJsonDirectory);
      expect(config).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse"));
      warnSpy.mockRestore();
    });

    it("returns null and warns when config is not an object", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config = loadConfig(nonObjectDirectory);
      expect(config).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("must be a JSON object"));
      warnSpy.mockRestore();
    });

    it("falls through to package.json when config file has malformed JSON", () => {
      const fallbackDirectory = path.join(tempRootDirectory, "malformed-with-fallback");
      fs.mkdirSync(fallbackDirectory, { recursive: true });
      fs.writeFileSync(path.join(fallbackDirectory, "dbt-doctor.config.json"), "not valid json{{{");
      fs.writeFileSync(
        path.join(fallbackDirectory, "package.json"),
        JSON.stringify({
          name: "test",
          dbtDoctor: { ignore: { rules: ["from-fallback"] } },
        }),
      );

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config = loadConfig(fallbackDirectory);
      expect(config).toEqual({ ignore: { rules: ["from-fallback"] } });
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });

    it("falls through to package.json when config file is not an object", () => {
      const nonObjectFallbackDirectory = path.join(tempRootDirectory, "non-object-with-fallback");
      fs.mkdirSync(nonObjectFallbackDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(nonObjectFallbackDirectory, "dbt-doctor.config.json"),
        JSON.stringify([1, 2, 3]),
      );
      fs.writeFileSync(
        path.join(nonObjectFallbackDirectory, "package.json"),
        JSON.stringify({
          name: "test",
          dbtDoctor: { ignore: { rules: ["from-non-object-fallback"] } },
        }),
      );

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config = loadConfig(nonObjectFallbackDirectory);
      expect(config).toEqual({ ignore: { rules: ["from-non-object-fallback"] } });
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });

    it("ignores non-object dbtDoctor key in package.json", () => {
      const arrayConfigDirectory = path.join(tempRootDirectory, "array-pkg-config");
      fs.mkdirSync(arrayConfigDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(arrayConfigDirectory, "package.json"),
        JSON.stringify({ name: "test", dbtDoctor: "not-an-object" }),
      );
      const config = loadConfig(arrayConfigDirectory);
      expect(config).toBeNull();
    });
  });

  describe("loadConfigWithSource", () => {
    it("returns the directory the config was loaded from", () => {
      const sourceDir = path.join(tempRootDirectory, "with-source");
      fs.mkdirSync(sourceDir, { recursive: true });
      fs.writeFileSync(
        path.join(sourceDir, "dbt-doctor.config.json"),
        JSON.stringify({ rootDir: "apps/web" }),
      );
      clearConfigCache();
      const loaded = loadConfigWithSource(sourceDir);
      expect(loaded?.sourceDirectory).toBe(sourceDir);
      expect(loaded?.config.rootDir).toBe("apps/web");
    });

    it("returns the ancestor directory when the config lives upstream", () => {
      const ancestorDir = path.join(tempRootDirectory, "with-source-ancestor");
      const childDir = path.join(ancestorDir, "packages", "ui");
      fs.mkdirSync(childDir, { recursive: true });
      fs.writeFileSync(
        path.join(ancestorDir, "dbt-doctor.config.json"),
        JSON.stringify({ rootDir: "apps/web" }),
      );
      clearConfigCache();
      const loaded = loadConfigWithSource(childDir);
      expect(loaded?.sourceDirectory).toBe(ancestorDir);
    });
  });

  describe("rootDir validation", () => {
    it("strips a non-string rootDir and warns", () => {
      const badRootDirDir = path.join(tempRootDirectory, "bad-root-dir");
      fs.mkdirSync(badRootDirDir, { recursive: true });
      fs.writeFileSync(
        path.join(badRootDirDir, "dbt-doctor.config.json"),
        JSON.stringify({ rootDir: 42 }),
      );
      clearConfigCache();
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
      const config = loadConfig(badRootDirDir);
      expect(config?.rootDir).toBeUndefined();
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining(`config field "rootDir" must be a string`),
      );
      stderrSpy.mockRestore();
    });

    it("preserves a valid string rootDir untouched", () => {
      const goodRootDirDir = path.join(tempRootDirectory, "good-root-dir");
      fs.mkdirSync(goodRootDirDir, { recursive: true });
      fs.writeFileSync(
        path.join(goodRootDirDir, "dbt-doctor.config.json"),
        JSON.stringify({ rootDir: "apps/web" }),
      );
      clearConfigCache();
      const config = loadConfig(goodRootDirDir);
      expect(config?.rootDir).toBe("apps/web");
    });
  });

  describe("ancestor config inheritance", () => {
    it("finds config from parent directory when not present locally", () => {
      const parentDirectory = path.join(tempRootDirectory, "monorepo-inherit");
      const childDirectory = path.join(parentDirectory, "packages", "ui");
      fs.mkdirSync(childDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(parentDirectory, "dbt-doctor.config.json"),
        JSON.stringify({ ignore: { rules: ["from-monorepo-root"] } }),
      );

      const config = loadConfig(childDirectory);
      expect(config).toEqual({ ignore: { rules: ["from-monorepo-root"] } });
    });

    it("prefers local config over ancestor config", () => {
      const parentDirectory = path.join(tempRootDirectory, "monorepo-local-wins");
      const childDirectory = path.join(parentDirectory, "packages", "ui");
      fs.mkdirSync(childDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(parentDirectory, "dbt-doctor.config.json"),
        JSON.stringify({ ignore: { rules: ["from-parent"] } }),
      );
      fs.writeFileSync(
        path.join(childDirectory, "dbt-doctor.config.json"),
        JSON.stringify({ ignore: { rules: ["from-child"] } }),
      );

      const config = loadConfig(childDirectory);
      expect(config).toEqual({ ignore: { rules: ["from-child"] } });
    });

    it("finds config from package.json dbtDoctor key in ancestor", () => {
      const parentDirectory = path.join(tempRootDirectory, "monorepo-pkg-inherit");
      const childDirectory = path.join(parentDirectory, "packages", "app");
      fs.mkdirSync(childDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(parentDirectory, "package.json"),
        JSON.stringify({
          name: "monorepo",
          dbtDoctor: { customRulesOnly: true },
        }),
      );

      const config = loadConfig(childDirectory);
      expect(config).toEqual({ customRulesOnly: true });
    });

    it("returns null when no config exists anywhere in the ancestor chain", () => {
      const isolatedDirectory = path.join(tempRootDirectory, "no-config-anywhere", "deep", "path");
      fs.mkdirSync(isolatedDirectory, { recursive: true });

      const config = loadConfig(isolatedDirectory);
      expect(config).toBeNull();
    });
  });

  describe("tier-4 config fields", () => {
    let tier4Directory: string;

    beforeAll(() => {
      tier4Directory = path.join(tempRootDirectory, "tier-4-config");
      fs.mkdirSync(tier4Directory, { recursive: true });
      fs.writeFileSync(
        path.join(tier4Directory, "dbt-doctor.config.json"),
        JSON.stringify({
          preset: "enterprise",
          scoreMode: "files",
          baseline: "baselines/known.json",
        }),
      );
    });

    it("loads preset, scoreMode, and baseline from config file", () => {
      expect(loadConfig(tier4Directory)).toEqual({
        preset: "enterprise",
        scoreMode: "files",
        baseline: "baselines/known.json",
      });
    });
  });
});
