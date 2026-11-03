import { InfoPage, infoPageMetadata } from "@/components/shared/info-page";

export const generateMetadata = () => infoPageMetadata("editorialPolicy", "/editorial-policy");

export default function EditorialPolicyPage() {
  return <InfoPage pageKey="editorialPolicy" path="/editorial-policy" />;
}
