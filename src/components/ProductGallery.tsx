"use client";

import Image from "next/image";
import { useState } from "react";
import type { Photo } from "@/lib/api";

export function ProductGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = photos[index];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-beige">
        {current && (
          <Image
            src={current.url}
            alt={photos.length > 1 ? `${title} (${index + 1}/${photos.length})` : title}
            fill
            preload={index === 0}
            fetchPriority={index === 0 ? "high" : undefined}
            loading="eager"
            sizes="(min-width: 1152px) 552px, (min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${title} ${i + 1}`}
              aria-current={i === index}
              className={`relative size-20 shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={p.thumbUrl || p.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
