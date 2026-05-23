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

export const DocsLayout = ({ navigation, markdown, currentHref }: DocsLayoutProps) => (
  <div className="min-h-screen bg-[radial-gradient(120%_120%_at_50%_0%,#2a1a16_0%,#0a0a0a_55%)] font-mono text-base leading-relaxed">
    <DocsNavbar />
    <div className="mx-auto flex w-full max-w-[96rem] flex-col md:flex-row md:items-stretch">
      <DocsSidebar items={navigation} currentHref={currentHref} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 lg:py-8">
        {isRulesReferencePage(currentHref) ? (
          <RulesMarkdownContent markdown={markdown} />
        ) : (
          <MarkdownContent markdown={markdown} />
        )}
      </div>
    </div>
  </div>
);
