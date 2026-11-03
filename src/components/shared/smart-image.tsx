import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product/editorial image.
 * - Merchant-API images are rendered `unoptimized` so they load directly from
 *   the merchant-provided URL (programme policies forbid re-hosting/altering).
 * - Missing images show a neutral placeholder instead of a broken image.
 */
export function SmartImage({
  src,
  alt,
  source,
  sizes,
  priority,
  className,
  fit = "contain",
}: {
  src: string | null | undefined;
  alt: string;
  source?: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  fit?: "contain" | "cover";
}) {
  if (!src) {
    return (
      <div className={cn("grid size-full place-items-center bg-gradient-to-br from-canvas to-brand-50 text-ink-300", className)}>
        <ImageOff className="size-8" aria-hidden="true" />
        <span className="sr-only">{alt || "Image not available"}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={source === "merchant_api"}
      className={cn(fit === "contain" ? "object-contain" : "object-cover", className)}
    />
  );
}
