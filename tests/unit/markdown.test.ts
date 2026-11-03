import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("builds a table of contents and demotes H1", () => {
    const { html, toc } = renderMarkdown("# Title\n\n## First section\n\n### Detail\n\n## First section");
    expect(html).toContain('<h2 id="title">');
    expect(toc.map((t) => t.id)).toEqual(["title", "first-section", "detail", "first-section-2"]);
  });
  it("strips scripts, event handlers and javascript: links", () => {
    const { html } = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[x](javascript:alert(1))');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });
  it("marks merchant links as sponsored and external links as noopener", () => {
    const { html } = renderMarkdown("[a](https://www.amazon.in/dp/X?tag=t-21) [b](https://www.bis.gov.in/) [c](/products)");
    expect(html).toMatch(/href="https:\/\/www\.amazon\.in[^"]*" rel="sponsored nofollow noopener"/);
    expect(html).toMatch(/href="https:\/\/www\.bis\.gov\.in\/" rel="noopener noreferrer" target="_blank"/);
    expect(html).toContain('href="/products"');
  });
  it("wraps tables for horizontal scrolling", () => {
    const { html } = renderMarkdown("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toContain('<div class="table-wrap"');
  });
});
