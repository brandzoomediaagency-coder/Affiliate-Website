import "server-only";
import { createSessionClient } from "@/lib/supabase/clients";
import { getAdapter } from "@/lib/affiliate/registry";
import type { MerchantOption } from "@/components/admin/listing-form";

const ID_HINTS: Record<string, string> = {
  amazon_creators: "ASIN, e.g. B0XXXXXXXX",
  flipkart_affiliate: "Flipkart product id (pid)",
  meesho: "Meesho product reference (optional)",
  generic: "Merchant product id (optional)",
};

/** Merchants with programme + adapter capabilities for the listing form. */
export async function getMerchantFormOptions(): Promise<MerchantOption[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("merchants")
    .select("id, name, allowed_domains, allow_manual_prices, price_max_age_hours, affiliate_programs(id, name, is_default, adapter_key)")
    .order("sort_order")
    .order("name");
  return (data ?? []).map((m) => {
    const def = m.affiliate_programs.find((p) => p.is_default) ?? m.affiliate_programs[0];
    const adapter = getAdapter(def?.adapter_key);
    return {
      id: m.id,
      name: m.name,
      allowedDomains: m.allowed_domains,
      allowManualPrices: m.allow_manual_prices,
      priceMaxAgeHours: m.price_max_age_hours,
      programs: m.affiliate_programs.map((p) => ({ id: p.id, name: p.name, isDefault: p.is_default })),
      adapter: {
        label: adapter.label,
        supportsApi: adapter.supportsApi,
        configured: adapter.isConfigured(),
        idHint: ID_HINTS[adapter.key] ?? ID_HINTS.generic!,
      },
    };
  });
}
