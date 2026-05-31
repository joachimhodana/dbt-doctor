import { DocsNavbar } from "@/components/docs/docs-navbar";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { MarkdownContent } from "@/components/docs/markdown-content";
import { RulesMarkdownContent } from "@/components/docs/rules-markdown-content";
import type { DocsNode } from "@/utils/docs";

interface DocsLayoutProps {
  navigation: DocsNode[];
  markdown: string;
  currentHref: string;
}

const isRulesReferencePage = (href: string): boolean =>
  href === "/docs/rules" || href.startsWith("/docs/rules#");

interface PageHeading {
  id: string;
  title: string;
  level: number;
}

const slugifyHeading = (value: string): string =>
  value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const extractPageHeadings = (markdown: string): PageHeading[] =>
  markdown
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^(#{2,3})\s+(.+?)(?:\s+\{#([\w-]+)\})?\s*$/);
      if (!match) return null;
      const level = match[1].length;
      const title = match[2].trim();
      const id = match[3] ?? slugifyHeading(title);
      return { id, title, level };
    })
    .filter((heading): heading is PageHeading => heading !== null);

export const DocsLayout = ({ navigation, markdown, currentHref }: DocsLayoutProps) => {
  const headings = extractPageHeadings(markdown);

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_50%_0%,#2a1a16_0%,#0a0a0a_55%)] font-mono text-base leading-relaxed">
      <DocsNavbar />
      <div className="mx-auto flex w-full max-w-[112rem] flex-col md:flex-row md:items-stretch">
        <DocsSidebar items={navigation} currentHref={currentHref} />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 lg:py-8">
          {isRulesReferencePage(currentHref) ? (
            <RulesMarkdownContent markdown={markdown} />
          ) : (
            <MarkdownContent markdown={markdown} />
          )}
        </div>
        {headings.length > 0 && (
          <aside className="hidden w-56 shrink-0 border-l border-orange-200/10 px-3 py-6 md:block lg:w-64 lg:px-4 lg:py-8">
            <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto">
              <p className="mb-3 text-xs uppercase tracking-wide text-neutral-500">On this page</p>
              <ul className="space-y-1">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="block rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-[#141414] hover:text-neutral-200"
                      style={{ paddingLeft: `${heading.level === 3 ? 16 : 8}px` }}
                    >
                      {heading.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
