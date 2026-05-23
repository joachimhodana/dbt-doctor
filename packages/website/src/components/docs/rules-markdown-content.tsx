"use client";

import { useCallback } from "react";
import { markdownToHtml } from "@/utils/docs-markdown";

const COPY_FEEDBACK_DURATION_MS = 2000;

const PROSE_CLASS =
  "docs-prose rounded-xl border border-orange-200/15 bg-[#0b0b0b]/90 p-6 text-neutral-300 shadow-[0_0_0_1px_rgba(255,105,74,0.04)] sm:p-8";

export const RulesMarkdownContent = ({ markdown }: { markdown: string }) => {
  const html = markdownToHtml(markdown, { ruleCopyLinks: true });

  const handleClick = useCallback(async (event: React.MouseEvent<HTMLElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-url]");
    if (!button) return;

    event.preventDefault();
    const relativeUrl = button.dataset.copyUrl;
    if (!relativeUrl) return;

    const fullUrl = `${window.location.origin}${relativeUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    button.classList.add("docs-copy-link--copied");
    window.setTimeout(() => button.classList.remove("docs-copy-link--copied"), COPY_FEEDBACK_DURATION_MS);
  }, []);

  return (
    <article
      className={PROSE_CLASS}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
};
