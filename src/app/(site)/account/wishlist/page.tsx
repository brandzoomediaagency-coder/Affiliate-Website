import { buildMetadata } from "@/lib/seo/metadata";
import { WishlistView } from "@/components/account/wishlist-view";

export const generateMetadata = () => buildMetadata({ title: "My wishlist", path: "/account/wishlist", noindex: true });

export default function AccountWishlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">My wishlist</h1>
        <p className="mt-1 text-ink-500">Products you&apos;ve saved. Prices and availability can change — check the store before buying.</p>
      </div>
      <WishlistView />
    </div>
  );
}
