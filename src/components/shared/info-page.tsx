import { getSiteSettings } from "@/lib/data/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { fillTemplate, pageContent, PAGES_LAST_UPDATED } from "@/content/pages";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "./navigation";
import { Markdown } from "./content-blocks";

type PageKey = keyof typeof pageContent;

export async function infoPageMetadata(key: PageKey, path: string) {
  const settings = await getSiteSettings();
  const vars = { brand: settings.brandName, email: settings.contactEmail, amazon: settings.amazonAssociateStatement };
  return buildMetadata({
    title: fillTemplate(pageContent[key].title, vars),
    description: fillTemplate(pageContent[key].description, vars),
    path,
  });
}

/** Shared layout for editorial/legal pages. */
export async function InfoPage({
  pageKey,
  path,
  body,
  children,
  showUpdated = true,
}: {
  pageKey: PageKey;
  path: string;
  body?: string;
  children?: React.ReactNode;
  showUpdated?: boolean;
}) {
  const settings = await getSiteSettings();
  const vars = { brand: settings.brandName, email: settings.contactEmail, amazon: settings.amazonAssociateStatement };
  const title = fillTemplate(pageContent[pageKey].title, vars);
  const markdown = fillTemplate(body ?? pageContent[pageKey].body, vars);

  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="container-page max-w-4xl py-8 sm:py-12">
          <Breadcrumbs items={[{ name: title, href: path }]} />
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-lg text-ink-500">{fillTemplate(pageContent[pageKey].description, vars)}</p>
          {showUpdated && <p className="mt-3 text-sm text-ink-400">Last updated {formatDate(PAGES_LAST_UPDATED)}</p>}
        </div>
      </div>
      <div className="container-page max-w-4xl space-y-8 py-10">
        {children}
        <Markdown content={markdown} className="text-[1.02rem]" />
      </div>
    </>
  );
}
