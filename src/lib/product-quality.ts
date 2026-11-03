import { stripMarkdown } from "@/lib/utils";

export type QualityInput = {
  short_description: string | null;
  overview: string | null;
  description: string | null;
  key_features: string[];
  imageCount: number;
  activeListingCount: number;
  specCount: number;
  categoryId: string | null;
};

export type QualityCheck = { ok: boolean; issues: string[]; checklist: Array<{ label: string; done: boolean }> };

/**
 * Minimum content standard before a product page can be published, so we
 * never create thin, near-empty indexable pages.
 */
export function assessProductQuality(p: QualityInput): QualityCheck {
  const editorialText = stripMarkdown(`${p.overview ?? ""} ${p.description ?? ""}`);
  const checklist = [
    { label: "Category assigned", done: Boolean(p.categoryId) },
    { label: "Short description (40+ characters)", done: (p.short_description?.trim().length ?? 0) >= 40 },
    { label: "Original overview/description (300+ characters)", done: editorialText.length >= 300 },
    { label: "At least 3 key features or 3 specifications", done: p.key_features.length >= 3 || p.specCount >= 3 },
    { label: "At least one image with alt text", done: p.imageCount >= 1 },
    { label: "At least one active merchant listing", done: p.activeListingCount >= 1 },
  ];
  const issues = checklist.filter((c) => !c.done).map((c) => c.label);
  return { ok: issues.length === 0, issues, checklist };
}
