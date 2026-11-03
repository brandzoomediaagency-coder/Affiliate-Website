import { saveBanner } from "@/lib/actions/admin/catalog";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { BannerFields } from "../banner-fields";

export default function NewBannerPage() {
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Add banner" back={{ href: "/admin/banners", label: "Banners" }} />
      <AdminForm action={saveBanner.bind(null, null)}>
        <BannerFields />
      </AdminForm>
    </div>
  );
}
