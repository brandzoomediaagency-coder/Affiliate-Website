"use client";

import { useRef, useState, useTransition } from "react";
import { DownloadCloud, Info } from "lucide-react";
import { lookupListingFromApi, saveListing } from "@/lib/actions/admin/listings";
import type { Tables } from "@/lib/supabase/database.types";
import { AdminForm, ErrorFor, SubmitButton } from "./admin-form";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label, Select, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/misc";
import { useToast } from "@/components/providers/toast-provider";

export type MerchantOption = {
  id: string;
  name: string;
  allowedDomains: string[];
  allowManualPrices: boolean;
  priceMaxAgeHours: number | null;
  programs: Array<{ id: string; name: string; isDefault: boolean }>;
  adapter: { label: string; supportsApi: boolean; configured: boolean; idHint: string };
};

function toLocal(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(new Date(value).getTime() + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export function ListingForm({
  listing,
  productId,
  products,
  merchants,
}: {
  listing?: Tables<"product_listings"> | null;
  productId?: string;
  products?: Array<{ id: string; name: string }>;
  merchants: MerchantOption[];
}) {
  const [merchantId, setMerchantId] = useState(listing?.merchant_id ?? merchants[0]?.id ?? "");
  const merchant = merchants.find((m) => m.id === merchantId);
  const formRef = useRef<HTMLDivElement>(null);
  const [lookup, start] = useTransition();
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const setField = (name: string, value: string | number | null | undefined) => {
    const el = formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
    if (el && value !== null && value !== undefined) el.value = String(value);
  };

  return (
    <AdminForm action={saveListing.bind(null, listing?.id ?? null)}>
      <div ref={formRef} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink-900">Merchant & link</h2>
          {productId ? (
            <input type="hidden" name="product_id" value={productId} />
          ) : (
            <div>
              <Label htmlFor="product_id">Product</Label>
              <Select id="product_id" name="product_id" defaultValue={listing?.product_id ?? ""} required>
                <option value="">— Select product —</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <ErrorFor name="product_id" />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="merchant_id">Merchant *</Label>
              <Select id="merchant_id" name="merchant_id" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} required>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <ErrorFor name="merchant_id" />
            </div>
            <div>
              <Label htmlFor="program_id">Affiliate programme</Label>
              <Select id="program_id" name="program_id" defaultValue={listing?.program_id ?? ""} key={merchantId}>
                <option value="">Default programme</option>
                {merchant?.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="variant_label">Variant (optional)</Label>
              <Input id="variant_label" name="variant_label" defaultValue={listing?.variant_label ?? ""} placeholder="e.g. 8GB/128GB, Black" maxLength={120} />
              <ErrorFor name="variant_label" />
            </div>
          </div>

          <div>
            <Label htmlFor="merchant_product_id">Merchant product id</Label>
            <div className="flex flex-wrap gap-2">
              <Input id="merchant_product_id" name="merchant_product_id" defaultValue={listing?.merchant_product_id ?? ""} placeholder={merchant?.adapter.idHint} className="max-w-xs" />
              {merchant?.adapter.supportsApi && (
                <Button
                  variant="outline"
                  disabled={lookup || !merchant.adapter.configured}
                  title={merchant.adapter.configured ? "Fetch details from the official API" : "API credentials not configured"}
                  onClick={() => {
                    const id = formRef.current?.querySelector<HTMLInputElement>('[name="merchant_product_id"]')?.value ?? "";
                    start(async () => {
                      const res = await lookupListingFromApi(merchantId, id);
                      setApiMessage(res.message);
                      if (res.ok && res.product) {
                        setField("affiliate_url", res.product.affiliateUrl);
                        setField("destination_url", res.product.affiliateUrl?.split("?")[0]);
                        setField("current_price", res.product.price);
                        setField("previous_price", res.product.previousPrice);
                        setField("availability", res.product.availability);
                        const useApi = formRef.current?.querySelector<HTMLInputElement>('[name="use_api"]');
                        if (useApi) useApi.checked = true;
                        toast({ tone: "success", title: "Fetched from official API" });
                      }
                    });
                  }}
                >
                  <DownloadCloud /> {lookup ? "Fetching…" : "Fetch from API"}
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-500">
              {merchant?.adapter.supportsApi
                ? merchant.adapter.configured
                  ? `${merchant.adapter.label} is configured — you can prefill from the official API.`
                  : `${merchant.adapter.label} credentials are not configured; enter details manually.`
                : "Optional reference id from the merchant (used for API refresh if available)."}
            </p>
            {apiMessage && <p className="mt-1 text-sm text-ink-600">{apiMessage}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="destination_url">Product page URL (destination) *</Label>
              <Input id="destination_url" name="destination_url" type="url" defaultValue={listing?.destination_url ?? ""} required placeholder="https://www.amazon.in/dp/…" />
              <ErrorFor name="destination_url" />
            </div>
            <div>
              <Label htmlFor="affiliate_url">Affiliate URL *</Label>
              <Input id="affiliate_url" name="affiliate_url" type="url" defaultValue={listing?.affiliate_url ?? ""} required placeholder="Tagged link from your affiliate programme" />
              <ErrorFor name="affiliate_url" />
            </div>
          </div>
          <p className="flex gap-2 text-xs text-ink-500">
            <Info className="size-4 shrink-0" />
            Paste the exact link issued by your programme (Amazon SiteStripe / tagged URL, Flipkart affiliate link, or your Meesho programme/network link).
            Links are used as-is — never shortened or masked. Allowed domains for {merchant?.name}: {merchant?.allowedDomains.join(", ") || "none configured"}.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink-900">Price & availability (optional)</h2>
          {merchant && !merchant.allowManualPrices && (
            <Notice tone="warning">
              {merchant.name} prices are only shown publicly when sourced from its official API and refreshed within{" "}
              {merchant.priceMaxAgeHours ?? 24} hours. Manually entered prices are stored but not displayed; shoppers will see “Check Price”.
            </Notice>
          )}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="current_price">Current price (₹)</Label>
              <Input id="current_price" name="current_price" inputMode="decimal" defaultValue={listing?.current_price ?? ""} />
              <ErrorFor name="current_price" />
            </div>
            <div>
              <Label htmlFor="previous_price">Previous price (₹)</Label>
              <Input id="previous_price" name="previous_price" inputMode="decimal" defaultValue={listing?.previous_price ?? ""} />
            </div>
            <div>
              <Label htmlFor="previous_price_type">Previous price is</Label>
              <Select id="previous_price_type" name="previous_price_type" defaultValue={listing?.previous_price_type ?? "mrp"}>
                <option value="mrp">M.R.P. shown by merchant</option>
                <option value="list_price">List price</option>
                <option value="was_price">Merchant&apos;s earlier price</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="availability">Availability</Label>
              <Select id="availability" name="availability" defaultValue={listing?.availability ?? "unknown"}>
                <option value="unknown">Unknown (check on store)</option>
                <option value="in_stock">In stock</option>
                <option value="limited_stock">Limited stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="preorder">Pre-order</option>
              </Select>
            </div>
          </div>
          <label className="flex items-start gap-2.5 text-sm text-ink-800">
            <Checkbox name="price_verified_now" className="mt-0.5" />
            <span>
              <strong>I verified this price on the merchant&apos;s site just now.</strong>
              <span className="block text-xs text-ink-500">
                Required to save a new or changed price. The page shows this timestamp.
                {listing?.price_checked_at ? ` Last verified: ${new Date(listing.price_checked_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.` : ""}
              </span>
              <ErrorFor name="price_checked_at" />
            </span>
          </label>
          {merchant?.adapter.supportsApi && merchant.adapter.configured && (
            <label className="flex items-start gap-2.5 text-sm text-ink-800">
              <Checkbox name="use_api" className="mt-0.5" />
              <span>
                <strong>Use live data from the official {merchant.adapter.label} when saving</strong>
                <span className="block text-xs text-ink-500">The server re-fetches price, availability and link from the API and records the API as the price source.</span>
              </span>
            </label>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="coupon_code">Coupon code</Label>
              <Input id="coupon_code" name="coupon_code" defaultValue={listing?.coupon_code ?? ""} maxLength={60} />
            </div>
            <div>
              <Label htmlFor="offer_details">Offer details</Label>
              <Input id="offer_details" name="offer_details" defaultValue={listing?.offer_details ?? ""} maxLength={500} placeholder="As stated by the merchant" />
            </div>
            <div>
              <Label htmlFor="offer_expires_at">Offer expires (IST)</Label>
              <Input id="offer_expires_at" name="offer_expires_at" type="datetime-local" defaultValue={toLocal(listing?.offer_expires_at)} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink-900">Status</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
              <Checkbox name="is_active" defaultChecked={listing?.is_active ?? true} /> Active (shown publicly)
            </label>
            <div>
              <Label htmlFor="sort_order">Display order</Label>
              <Input id="sort_order" name="sort_order" type="number" min={0} defaultValue={listing?.sort_order ?? 0} />
            </div>
          </div>
          <div>
            <Label htmlFor="internal_notes">Internal notes</Label>
            <Textarea id="internal_notes" name="internal_notes" defaultValue={listing?.internal_notes ?? ""} rows={2} />
          </div>
        </section>
        <div className="flex justify-end">
          <SubmitButton>{listing ? "Save listing" : "Add listing"}</SubmitButton>
        </div>
      </div>
    </AdminForm>
  );
}
