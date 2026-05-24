import { promises as fs } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";

const DOCS_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "docs");

interface DocsEntry {
  name: string;
  absolutePath: string;
  relativePath: string;
  segments: string[];
}

export interface DocsNode {
  id: string;
  title: string;
  href: string;
  depth: number;
  children: DocsNode[];
}

interface RulesNavCategory {
  id: string;
  title: string;
  rules: string[];
}

interface RulesNavFile {
  categories: RulesNavCategory[];
}

export interface DocsPage {
  title: string;
  markdown: string;
  href: string;
}

const SLUG_PREFIX_REGEX = /^(\d+)[-_](.+)$/;
const HEADING_REGEX = /^#\s+(.+)$/m;

const stripOrderingPrefix = (value: string): string => {
  const match = value.match(SLUG_PREFIX_REGEX);
  return match ? match[2] : value;
};

const toTitle = (value: string): string =>
  stripOrderingPrefix(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const compareByOrder = (left: string, right: string): number => {
  const leftMatch = left.match(SLUG_PREFIX_REGEX);
  const rightMatch = right.match(SLUG_PREFIX_REGEX);

  if (leftMatch && rightMatch) {
    const leftOrder = Number.parseInt(leftMatch[1], 10);
    const rightOrder = Number.parseInt(rightMatch[1], 10);
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
  }

  if (leftMatch && !rightMatch) return -1;
  if (!leftMatch && rightMatch) return 1;

  return left.localeCompare(right);
};

const getMarkdownTitle = (markdown: string, fallback: string): string => {
  const heading = markdown.match(HEADING_REGEX)?.[1]?.trim();
  return heading || fallback;
};

const slugToHref = (segments: string[]): string => {
  const cleaned = segments[segments.length - 1] === "index" ? segments.slice(0, -1) : segments;
  return cleaned.length === 0 ? "/docs" : `/docs/${cleaned.join("/")}`;
};

const resolveDocFromSlug = async (slug: string[]): Promise<DocsEntry | null> => {
  const directFilePath = path.join(DOCS_ROOT, ...slug);
  const fileCandidate = `${directFilePath}.md`;

  try {
    const fileStats = await fs.stat(fileCandidate);
    if (fileStats.isFile()) {
      return {
        name: path.basename(fileCandidate),
        absolutePath: fileCandidate,
        relativePath: path.relative(DOCS_ROOT, fileCandidate).split(path.sep).join("/"),
        segments: [...slug],
      };
    }
  } catch {}

  const indexCandidate = path.join(directFilePath, "index.md");
  try {
    const indexStats = await fs.stat(indexCandidate);
    if (indexStats.isFile()) {
      return {
        name: "index.md",
        absolutePath: indexCandidate,
        relativePath: path.relative(DOCS_ROOT, indexCandidate).split(path.sep).join("/"),
        segments: [...slug, "index"],
      };
    }
  } catch {}

  return null;
};

const readTitleFromFile = async (absolutePath: string, fallback: string): Promise<string> => {
  const markdown = await fs.readFile(absolutePath, "utf8");
  return getMarkdownTitle(markdown, fallback);
};

const buildDirectoryNode = async (
  directory: string,
  relativeSegments: string[],
  depth: number,
): Promise<DocsNode[]> => {
  const dirEntries = await fs.readdir(directory, { withFileTypes: true });
  const sorted = [...dirEntries].sort((left, right) => compareByOrder(left.name, right.name));

  const indexFile = sorted.find((entry) => entry.isFile() && entry.name === "index.md");
  const mdFiles = sorted.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md",
  );
  const subdirectories = sorted.filter((entry) => entry.isDirectory());

  const children: DocsNode[] = [];

  for (const fileEntry of mdFiles) {
    const fileName = fileEntry.name.replace(/\.md$/, "");
    const fileSegments = [...relativeSegments, fileName];
    const absolutePath = path.join(directory, fileEntry.name);

    children.push({
      id: fileSegments.join("/"),
      title: await readTitleFromFile(absolutePath, toTitle(fileName)),
      href: slugToHref(fileSegments),
      depth: indexFile ? depth + 1 : depth,
      children: [],
    });
  }

  for (const directoryEntry of subdirectories) {
    const nestedSegments = [...relativeSegments, directoryEntry.name];
    const nestedDirectory = path.join(directory, directoryEntry.name);
    const nestedNodes = await buildDirectoryNode(nestedDirectory, nestedSegments, depth + 1);

    children.push(...nestedNodes);
  }

  if (!indexFile) {
    return children;
  }

  const indexAbsolutePath = path.join(directory, indexFile.name);
  const indexSegments = [...relativeSegments, "index"];

  return [
    {
      id: indexSegments.join("/"),
      title: await readTitleFromFile(
        indexAbsolutePath,
        toTitle(relativeSegments.at(-1) ?? "Documentation"),
      ),
      href: slugToHref(indexSegments),
      depth,
      children,
    },
  ];
};

const getAllMarkdownEntries = async (): Promise<DocsEntry[]> => {
  const entries: DocsEntry[] = [];

  const walk = async (directory: string, relativeDirectory = ""): Promise<void> => {
    const dirEntries = await fs.readdir(directory, { withFileTypes: true });
    const sorted = [...dirEntries].sort((left, right) => compareByOrder(left.name, right.name));

    for (const dirent of sorted) {
      const absolutePath = path.join(directory, dirent.name);
      const relativePath = path.join(relativeDirectory, dirent.name);

      if (dirent.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else if (dirent.isFile() && dirent.name.endsWith(".md")) {
        const normalized = relativePath.split(path.sep).join("/");
        const segments = normalized.replace(/\.md$/, "").split("/");

        entries.push({
          name: dirent.name,
          absolutePath,
          relativePath: normalized,
          segments,
        });
      }
    }
  };

  await walk(DOCS_ROOT);
  return entries;
};

const buildRulesSidebarChildren = (parentDepth: number, nav: RulesNavFile): DocsNode[] =>
  nav.categories.map((category) => ({
    id: `rules/category/${category.id}`,
    title: category.title,
    href: `/docs/rules#${category.id}`,
    depth: parentDepth + 1,
    children: category.rules.map((ruleId) => ({
      id: `rules/rule/${ruleId}`,
      title: ruleId,
      href: `/docs/rules#${ruleId}`,
      depth: parentDepth + 2,
      children: [],
    })),
  }));

const attachRulesNavigation = async (nodes: DocsNode[]): Promise<DocsNode[]> => {
  const navPath = path.join(DOCS_ROOT, "rules", "nav.json");
  let nav: RulesNavFile | null = null;
  try {
    nav = JSON.parse(await fs.readFile(navPath, "utf8")) as RulesNavFile;
  } catch {
    return nodes;
  }

  if (!nav?.categories?.length) return nodes;

  const enrich = (node: DocsNode): DocsNode => {
    if (node.href === "/docs/rules") {
      return {
        ...node,
        children: buildRulesSidebarChildren(node.depth, nav!),
      };
    }
    return {
      ...node,
      children: node.children.map(enrich),
    };
  };

  return nodes.map(enrich);
};

export const getDocsNavigation = async (): Promise<DocsNode[]> => {
  const tree = await buildDirectoryNode(DOCS_ROOT, [], 0);
  return attachRulesNavigation(tree);
};

export const getDocsPage = async (slug: string[] = []): Promise<DocsPage> => {
  const resolved = await resolveDocFromSlug(slug);
  if (!resolved) {
    notFound();
  }

  const markdown = await fs.readFile(resolved.absolutePath, "utf8");
  const fallbackTitle = toTitle(resolved.segments[resolved.segments.length - 1]);

  return {
    title: getMarkdownTitle(markdown, fallbackTitle),
    markdown,
    href: slugToHref(resolved.segments),
  };
};

export const getAllDocsSlugs = async (): Promise<string[][]> => {
  const entries = await getAllMarkdownEntries();

  return entries
    .map((entry) => {
      if (entry.segments.length === 1 && entry.segments[0] === "index") {
        return [];
      }

      if (entry.segments[entry.segments.length - 1] === "index") {
        return entry.segments.slice(0, -1);
      }

      return entry.segments;
    })
    .filter((segments) => segments.length > 0);
};
