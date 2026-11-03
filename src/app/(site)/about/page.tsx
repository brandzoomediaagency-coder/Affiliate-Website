import { InfoPage, infoPageMetadata } from "@/components/shared/info-page";

export const generateMetadata = () => infoPageMetadata("about", "/about");

export default function AboutPage() {
  return <InfoPage pageKey="about" path="/about" showUpdated={false} />;
}
