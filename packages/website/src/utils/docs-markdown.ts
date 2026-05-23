export interface MarkdownToHtmlOptions {
  /** Add copy-link buttons to `### rule-id {#rule-id}` headings (rules reference page). */
  ruleCopyLinks?: boolean;
}

const COPY_LINK_ICON_SVG = `<svg class="docs-copy-link-icon docs-copy-link-icon--default" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

const CHECK_LINK_ICON_SVG = `<svg class="docs-copy-link-icon docs-copy-link-icon--copied" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

const slugifyHeading = (value: string): string =>
  value
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseInlineMarkdown = (line: string): string => {
  const escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${href}"${attrs}>${label}</a>`;
    });
};

const isTableRow = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|", 1);
};

const isTableSeparator = (line: string): boolean =>
  /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim());

const parseTableRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const escapeHtmlAttribute = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const renderRuleHeadingHtml = (headingId: string, headingText: string): string => {
  const copyUrl = `/docs/rules#${headingId}`;
  const ariaLabel = escapeHtmlAttribute(`Copy link to ${headingId}`);
  return `<h3 id="${headingId}" class="docs-rule-heading"><button type="button" class="docs-copy-link" data-copy-url="${copyUrl}" aria-label="${ariaLabel}">${COPY_LINK_ICON_SVG}${CHECK_LINK_ICON_SVG}</button><span class="docs-rule-heading-text">${parseInlineMarkdown(headingText)}</span></h3>`;
};

export const markdownToHtml = (markdown: string, options?: MarkdownToHtmlOptions): string => {
  const lines = markdown.split(/\r?\n/);
  const chunks: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeListIfOpen = (): void => {
    if (listType) {
      chunks.push(`</${listType}>`);
      listType = null;
    }
  };

  const renderTable = (tableLines: string[]): void => {
    if (tableLines.length < 2 || !isTableSeparator(tableLines[1])) return;
    const headerCells = parseTableRow(tableLines[0]);
    const bodyLines = tableLines.slice(2);
    const rows = bodyLines.map(parseTableRow).filter((row) => row.length > 0);
    chunks.push('<div class="docs-table-wrap"><table class="docs-table">');
    chunks.push("<thead><tr>");
    for (const cell of headerCells) {
      chunks.push(`<th>${parseInlineMarkdown(cell)}</th>`);
    }
    chunks.push("</tr></thead><tbody>");
    for (const row of rows) {
      chunks.push("<tr>");
      for (const cell of row) {
        chunks.push(`<td>${parseInlineMarkdown(cell)}</td>`);
      }
      chunks.push("</tr>");
    }
    chunks.push("</tbody></table></div>");
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]!;
    if (line.startsWith("```")) {
      closeListIfOpen();

      if (inCodeBlock) {
        const escaped = codeBuffer
          .join("\n")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        chunks.push(`<pre><code>${escaped}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === "") {
      closeListIfOpen();
      continue;
    }

    if (isTableRow(line)) {
      const tableLines: string[] = [line];
      let peekIndex = lineIndex + 1;
      while (peekIndex < lines.length) {
        const peekLine = lines[peekIndex]!;
        if (peekLine.trim() === "") break;
        if (!isTableRow(peekLine) && !isTableSeparator(peekLine)) break;
        tableLines.push(peekLine);
        peekIndex += 1;
      }
      if (tableLines.length >= 2 && isTableSeparator(tableLines[1]!)) {
        closeListIfOpen();
        renderTable(tableLines);
        lineIndex = peekIndex - 1;
        continue;
      }
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+\{#([\w-]+)\})?\s*$/);
    if (headingMatch) {
      closeListIfOpen();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const headingId = headingMatch[3] ?? slugifyHeading(headingText);
      if (options?.ruleCopyLinks && level === 3 && headingMatch[3]) {
        chunks.push(renderRuleHeadingHtml(headingId, headingText));
      } else {
        chunks.push(
          `<h${level} id="${headingId}">${parseInlineMarkdown(headingText)}</h${level}>`,
        );
      }
      continue;
    }

    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (unorderedMatch) {
      if (listType !== "ul") {
        closeListIfOpen();
        chunks.push("<ul>");
        listType = "ul";
      }
      chunks.push(`<li>${parseInlineMarkdown(unorderedMatch[1].trim())}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listType !== "ol") {
        closeListIfOpen();
        chunks.push("<ol>");
        listType = "ol";
      }
      chunks.push(`<li>${parseInlineMarkdown(orderedMatch[1].trim())}</li>`);
      continue;
    }

    closeListIfOpen();

    if (line.startsWith("> ")) {
      chunks.push(`<blockquote>${parseInlineMarkdown(line.slice(2).trim())}</blockquote>`);
      continue;
    }

    chunks.push(`<p>${parseInlineMarkdown(line.trim())}</p>`);
  }

  closeListIfOpen();

  if (inCodeBlock && codeBuffer.length > 0) {
    const escaped = codeBuffer
      .join("\n")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    chunks.push(`<pre><code>${escaped}</code></pre>`);
  }

  return chunks.join("\n");
};
