import { InfoPage, infoPageMetadata } from "@/components/shared/info-page";

export const generateMetadata = () => infoPageMetadata("terms", "/terms-and-conditions");

export default function TermsPage() {
  return <InfoPage pageKey="terms" path="/terms-and-conditions" />;
}
