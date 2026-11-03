import { Suspense } from "react";
import Link from "next/link";
import { Clock, Heart, Settings } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { getProductCardsByIds } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { ProductGrid } from "@/components/product/product-grid";
import { Card, EmptyState, Notice, Skeleton } from "@/components/ui/misc";

export const generateMetadata = () => buildMetadata({ title: "My account", path: "/account", noindex: true });

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const [user, sp] = await Promise.all([requireUser("/account"), searchParams]);
  const supabase = await createSessionClient();
  const [{ data: recent }, { count: wishlistCount }] = await Promise.all([
    supabase.from("recently_viewed").select("product_id").eq("user_id", user.id).order("viewed_at", { ascending: false }).limit(8),
    supabase.from("wishlist_items").select("product_id, wishlists!inner(user_id)", { count: "exact", head: true }).eq("wishlists.user_id", user.id),
  ]);
  const recentProducts = await getProductCardsByIds((recent ?? []).map((r) => r.product_id));
  const firstName = user.fullName?.split(" ")[0];

  return (
    <div className="space-y-8">
      {first(sp.denied) && (
        <Notice tone="warning" title="Access restricted">
          That area is only available to authorised staff accounts.
        </Notice>
      )}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Hi{firstName ? `, ${firstName}` : ""} 👋</h1>
        <p className="mt-1 text-ink-500">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/account/wishlist", label: "Saved products", value: String(wishlistCount ?? 0), Icon: Heart },
          { href: "#recent", label: "Recently viewed", value: String(recentProducts.length), Icon: Clock },
          { href: "/account/profile", label: "Profile & preferences", value: "Manage", Icon: Settings },
        ].map(({ href, label, value, Icon }) => (
          <Link key={label} href={href}>
            <Card className="flex items-center gap-4 p-5 transition hover:shadow-card-hover">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xl font-extrabold text-ink-900">{value}</span>
                <span className="text-sm text-ink-500">{label}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <section id="recent" aria-labelledby="recent-heading" className="scroll-mt-40">
        <h2 id="recent-heading" className="mb-4 text-xl font-extrabold text-ink-900">
          Recently viewed
        </h2>
        {recentProducts.length ? (
          <ProductGrid products={recentProducts} sourceComponent="recently_viewed" />
        ) : (
          <EmptyState
            icon={<Clock />}
            title="Nothing here yet"
            description="Products you view while signed in will appear here. You can switch this off in your privacy settings."
          />
        )}
      </section>
    </div>
  );
}
