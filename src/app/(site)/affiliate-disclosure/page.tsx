import { getSiteSettings } from "@/lib/data/settings";
import { InfoPage, infoPageMetadata } from "@/components/shared/info-page";
import { Notice } from "@/components/ui/misc";

export const generateMetadata = () => infoPageMetadata("affiliateDisclosure", "/affiliate-disclosure");

export default async function AffiliateDisclosurePage() {
  const settings = await getSiteSettings();
  const body =
    settings.affiliateDisclosureContent ||
    `${settings.affiliateDisclosureShort}\n\nWhen you click a store link you are taken to the merchant's website, where the merchant handles checkout, payment, delivery and returns. {{brand}} does not offer cashback or rewards.`;
  return (
    <InfoPage pageKey="affiliateDisclosure" path="/affiliate-disclosure" body={body}>
      <Notice tone="info" title="Amazon Associates disclosure">
        <p className="text-base font-semibold">{settings.amazonAssociateStatement}</p>
      </Notice>
    </InfoPage>
  );
}
