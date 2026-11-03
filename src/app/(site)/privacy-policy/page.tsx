import { InfoPage, infoPageMetadata } from "@/components/shared/info-page";

export const generateMetadata = () => infoPageMetadata("privacyPolicy", "/privacy-policy");

export default function PrivacyPolicyPage() {
  return <InfoPage pageKey="privacyPolicy" path="/privacy-policy" />;
}
