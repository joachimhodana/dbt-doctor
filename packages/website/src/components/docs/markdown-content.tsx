import { markdownToHtml } from "@/utils/docs-markdown";

export const MarkdownContent = ({ markdown }: { markdown: string }) => {
  const html = markdownToHtml(markdown);

  return (
    <article
      className="docs-prose rounded-xl border border-orange-200/15 bg-[#0b0b0b]/90 p-6 text-neutral-300 shadow-[0_0_0_1px_rgba(255,105,74,0.04)] sm:p-8"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
