import { buildMetadata } from "@/lib/seo/metadata";
import { WishlistView } from "@/components/account/wishlist-view";
import { Breadcrumbs } from "@/components/shared/navigation";
import { PageHeader } from "@/components/ui/misc";

export const generateMetadata = () => buildMetadata({ title: "Wishlist", path: "/wishlist", noindex: true });

/** Public wishlist page: works for guests (device storage) and signed-in users. */
export default function WishlistPage() {
  return (
    <>
      <PageHeader title="Your wishlist" description="Products you've saved for later.">
        <Breadcrumbs items={[{ name: "Wishlist", href: "/wishlist" }]} />
      </PageHeader>
      <div className="container-page py-8">
        <WishlistView />
      </div>
    </>
  );
}
