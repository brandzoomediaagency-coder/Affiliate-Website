import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

/**
 * Merchant identity. Shows the logo only when its use is authorised in the
 * admin; otherwise a neutral initials badge with the merchant name, so we
 * never imply an official partnership through borrowed branding.
 */
export function MerchantMark({
  name,
  logoUrl,
  logoUsagePermitted,
  brandColor,
  size = "md",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  logoUsagePermitted?: boolean;
  brandColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "size-7 text-[0.65rem]" : size === "lg" ? "size-14 text-base" : "size-10 text-xs";
  if (logoUrl && logoUsagePermitted) {
    const px = size === "sm" ? 28 : size === "lg" ? 56 : 40;
    return (
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white", dims, className)}>
        <Image src={logoUrl} alt={`${name} logo`} width={px} height={px} className="size-full object-contain p-1" />
      </span>
    );
  }
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl font-extrabold text-white", dims, className)}
      style={{ backgroundColor: brandColor || "#2a3557" }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
