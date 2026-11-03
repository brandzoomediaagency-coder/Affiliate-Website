import Link from "next/link";
import { getSiteSettings } from "@/lib/data/settings";
import { buildCategoryTree, getAllCategories } from "@/lib/data/categories";
import { Logo } from "@/components/shared/brand";
import { ProductSearch } from "@/components/product/product-search";
import { DesktopNav, MobileMenu, UserMenu, WishlistLink, type NavCategory } from "./header-client";

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getSiteSettings(), getAllCategories()]);
  const navCategories: NavCategory[] = buildCategoryTree(categories).map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    children: c.children.map((ch) => ({ slug: ch.slug, name: ch.name })),
  }));

  return (
    <>
      {settings.announcementText && (
        <div className="bg-ink-900 text-center text-xs font-medium text-white sm:text-sm">
          <div className="container-page py-2">
            {settings.announcementUrl ? (
              <Link href={settings.announcementUrl} className="underline-offset-4 hover:underline">
                {settings.announcementText}
              </Link>
            ) : (
              settings.announcementText
            )}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <div className="container-page flex h-16 items-center gap-3 lg:h-[4.5rem] lg:gap-6">
          <MobileMenu categories={navCategories} />
          <Logo brandName={settings.brandName} logoUrl={settings.logoUrl} className="shrink-0" />
          <div className="hidden flex-1 md:block md:max-w-xl lg:max-w-2xl">
            <ProductSearch />
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <WishlistLink />
            <UserMenu />
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <ProductSearch />
        </div>
        <div className="hidden border-t border-line/70 lg:block">
          <div className="container-page flex h-12 items-center">
            <DesktopNav categories={navCategories} />
          </div>
        </div>
      </header>
    </>
  );
}
