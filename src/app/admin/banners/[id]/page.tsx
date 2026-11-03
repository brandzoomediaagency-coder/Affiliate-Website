import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/clients";
import { deleteBanner, saveBanner } from "@/lib/actions/admin/catalog";
import { AdminForm, ConfirmAction } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { BannerFields } from "../banner-fields";

export default async function EditBannerPage({ params }: PageProps<"/admin/banners/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createSessionClient();
  const { data: banner } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
  if (!banner) notFound();
  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={banner.title}
        back={{ href: "/admin/banners", label: "Banners" }}
        actions={
          <ConfirmAction action={deleteBanner.bind(null, id)} confirm="Delete this banner?" variant="danger">
            Delete
          </ConfirmAction>
        }
      />
      <AdminForm action={saveBanner.bind(null, id)}>
        <BannerFields banner={banner} />
      </AdminForm>
    </div>
  );
}
