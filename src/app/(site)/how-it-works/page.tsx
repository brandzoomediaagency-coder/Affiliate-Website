import { InfoPage, infoPageMetadata } from "@/components/shared/info-page";

export const generateMetadata = () => infoPageMetadata("howItWorks", "/how-it-works");

export default function HowItWorksPage() {
  return <InfoPage pageKey="howItWorks" path="/how-it-works" showUpdated={false} />;
}
