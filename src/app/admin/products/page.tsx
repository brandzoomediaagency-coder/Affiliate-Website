import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/clients";
import { first } from "@/lib/search-params";
import { formatDate } from "@/lib/utils";
import { AdminHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { Pagination } from "@/components/shared/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { Badge } from "@/components/ui/misc";

const PAGE_SIZE = 30;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const status = first(sp.status) ?? "";
  const page = Math.max(1, Number(first(sp.page) ?? "1") || 1);
  const supabase = await createSessionClient();

  let query = supabase
    .from("products")
    .select("id, name, slug, status, is_featured, is_trending, updated_at, category:categories(name), brand:brands(name), listings:product_listings(count), images:product_images(count)", {
      count: "exact",
    });
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
  if (["draft", "published", "archived"].includes(status)) query = query.eq("status", status);
  const { data, count } = await query.order("updated_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <div>
      <AdminHeader
        title="Products"
        description={`${count ?? 0} products. Products can only be published once they meet the content checklist.`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            Add product
          </Link>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Input name="q" defaultValue={q} placeholder="Search by name…" className="max-w-xs" />
        <Select name="status" defaultValue={status} className="max-w-44">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <button className={buttonVariants({ variant: "outline" })}>Filter</button>
      </form>
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Status</Th>
            <Th>Listings</Th>
            <Th>Images</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((p) => (
            <tr key={p.id} className="hover:bg-canvas/50">
              <Td>
                <Link href={`/admin/products/${p.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                  {p.name}
                </Link>
                <div className="mt-0.5 flex gap-1.5">
                  {p.brand && <span className="text-xs text-ink-400">{p.brand.name}</span>}
                  {p.is_featured && <Badge variant="brand">Featured</Badge>}
                  {p.is_trending && <Badge variant="saffron">Trending</Badge>}
                </div>
              </Td>
              <Td>{p.category?.name ?? <span className="text-ink-400">—</span>}</Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td>{p.listings?.[0]?.count ?? 0}</Td>
              <Td>{p.images?.[0]?.count ?? 0}</Td>
              <Td className="whitespace-nowrap">{formatDate(p.updated_at)}</Td>
            </tr>
          ))}
          {(data ?? []).length === 0 && (
            <tr>
              <Td className="py-10 text-center text-ink-400">
                No products found. <Link href="/admin/products/new" className="font-semibold text-brand-700">Add your first product</Link>.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)} basePath="/admin/products" searchParams={{ q, status }} />
    </div>
  );
}
