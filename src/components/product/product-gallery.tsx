"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/data/types";
import { SmartImage } from "@/components/shared/smart-image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-white p-6 sm:p-10">
        <div className="relative size-full">
          <SmartImage
            src={current?.url}
            alt={current?.altText || productName}
            source={current?.source}
            sizes="(min-width: 1024px) 560px, 100vw"
            priority
          />
        </div>
      </div>
      {current?.credit && (
        <p className="text-xs text-ink-400">
          Image:{" "}
          {current.sourceUrl ? (
            <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {current.credit}
            </a>
          ) : (
            current.credit
          )}
        </p>
      )}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1.5 transition sm:size-20",
                i === active ? "border-brand-500" : "border-line hover:border-brand-200",
              )}
            >
              <span className="relative block size-full">
                <SmartImage src={img.url} alt="" source={img.source} sizes="80px" />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
