import { requireAdmin } from "@/lib/auth";
import { saveMerchant } from "@/lib/actions/admin/merchants";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { MerchantFields } from "../merchant-fields";

export default async function NewMerchantPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Add merchant" back={{ href: "/admin/merchants", label: "Merchants" }} />
      <AdminForm action={saveMerchant.bind(null, null)}>
        <MerchantFields />
      </AdminForm>
    </div>
  );
}
