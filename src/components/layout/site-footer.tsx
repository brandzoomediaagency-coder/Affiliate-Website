import Link from "next/link";
import { cacheLife } from "next/cache";
import { footerNav } from "@/config/site";
import { getSiteSettings } from "@/lib/data/settings";
import { getMerchants } from "@/lib/data/merchants";
import { Logo } from "@/components/shared/brand";
import { SocialIcon } from "@/components/shared/icons";
import { ConsentResetButton } from "@/components/providers/analytics";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function SiteFooter() {
  const [settings, merchants] = await Promise.all([getSiteSettings(), getMerchants()]);
  const social = Object.entries(settings.socialLinks).filter(([, url]) => Boolean(url));

  return (
    <footer className="mt-16 bg-ink-950 pb-24 text-ink-300 lg:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo brandName={settings.brandName} logoUrl={settings.logoUrl} inverted />
          <p className="max-w-sm text-sm leading-relaxed">{settings.footerAbout}</p>
          {social.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Social media">
              {social.map(([platform, url]) => (
                <li key={platform}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="grid size-9 place-items-center rounded-xl bg-white/5 text-white transition hover:bg-white/15"
                    aria-label={`${settings.brandName} on ${platform === "x" ? "X" : platform[0]!.toUpperCase() + platform.slice(1)}`}
                  >
                    <SocialIcon platform={platform} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {settings.contactEmail && (
            <p className="text-sm">
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                {settings.contactEmail}
              </a>
            </p>
          )}
        </div>

        <FooterColumn title="Explore" links={[...footerNav.explore]} />
        <FooterColumn title="Company" links={[...footerNav.company]} />
        <FooterColumn title="Policies" links={[...footerNav.legal]}>
          <li>
            <ConsentResetButton />
          </li>
        </FooterColumn>
        <FooterColumn title="Stores" links={merchants.map((m) => ({ href: `/stores/${m.slug}`, label: m.name }))} />
      </div>

      <div className="border-t border-white/10">
        <div className="container-page space-y-3 py-6 text-xs leading-relaxed text-ink-400">
          <p>
            <strong className="text-ink-300">Affiliate disclosure:</strong> {settings.affiliateDisclosureShort}{" "}
            {settings.amazonAssociateStatement}
          </p>
          <p>
            {settings.brandName} is an independent product discovery website. We do not sell products, process payments
            or offer cashback or rewards. Store names and trademarks belong to their respective owners and are used only
            to identify where a product is available; their use does not imply endorsement.
          </p>
          <p>
            © <CopyrightYear /> {settings.brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  children,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
  children?: React.ReactNode;
}) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 text-sm font-bold text-white">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
        {children}
      </ul>
    </nav>
  );
}
