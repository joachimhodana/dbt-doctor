"use client";

import { useEffect, useMemo, useRef } from "react";
import { markdownToHtml } from "@/utils/docs-markdown";

const COPY_FEEDBACK_DURATION_MS = 2000;

const PROSE_CLASS =
  "docs-prose rounded-xl border border-orange-200/15 bg-[#0b0b0b]/90 p-6 text-neutral-300 shadow-[0_0_0_1px_rgba(255,105,74,0.04)] sm:p-8";

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
};

export const RulesMarkdownContent = ({ markdown }: { markdown: string }) => {
  const articleRef = useRef<HTMLElement>(null);
  const html = useMemo(() => markdownToHtml(markdown, { ruleCopyLinks: true }), [markdown]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const onCopyClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest<HTMLButtonElement>("button[data-copy-url]");
      if (!button || !root.contains(button)) return;

      event.preventDefault();
      event.stopPropagation();

      const relativeUrl = button.getAttribute("data-copy-url");
      if (!relativeUrl) return;

      const fullUrl = new URL(relativeUrl, window.location.href).href;
      const copied = await copyTextToClipboard(fullUrl);
      if (!copied) return;

      button.classList.add("docs-copy-link--copied");
      window.setTimeout(() => button.classList.remove("docs-copy-link--copied"), COPY_FEEDBACK_DURATION_MS);
    };

    root.addEventListener("click", onCopyClick);
    return () => root.removeEventListener("click", onCopyClick);
  }, [html]);

  return (
    <article ref={articleRef} className={PROSE_CLASS} dangerouslySetInnerHTML={{ __html: html }} />
  );
};
