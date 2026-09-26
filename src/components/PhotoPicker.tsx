"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type PickedPhoto = { file: File; preview: string };

const MAX_BYTES = 8 * 1024 * 1024;

/** Optional photo attachments with previews (moving and technician requests). */
export function PhotoPicker({
  photos,
  onChange,
  label,
  hint,
  max = 10,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  label: string;
  hint: string;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  // Free preview URLs when the form goes away.
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function add(list: FileList | null) {
    if (!list) return;
    const picked = [...list]
      .filter((f) => f.type.startsWith("image/") && f.size <= MAX_BYTES)
      .slice(0, max - photos.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    onChange([...photos, ...picked]);
    if (input.current) input.current.value = "";
  }

  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <p className="mb-3 text-sm text-muted">{hint}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <div key={p.preview} className="relative aspect-square overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={p.preview} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(p.preview);
                onChange(photos.filter((_, j) => j !== i));
              }}
              aria-label={`${label} ${i + 1}`}
              className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            aria-label={label}
            className="grid aspect-square place-items-center rounded-lg border border-dashed border-ink/30 bg-beige/60 hover:bg-beige"
          >
            <Camera aria-hidden className="size-6" />
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => add(e.target.files)} />
    </fieldset>
  );
}

/** Appends a flat/nested body to FormData: nested objects as a[b], arrays as repeated keys. */
export function toFormData(body: Record<string, unknown>, photos: PickedPhoto[]): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => data.append(k, String(x)));
    else if (typeof v === "object") {
      for (const [ik, iv] of Object.entries(v as Record<string, unknown>)) {
        if (iv !== undefined && iv !== null) data.append(`${k}[${ik}]`, String(iv));
      }
    } else data.append(k, String(v));
  }
  photos.forEach((p) => data.append("photos", p.file));
  return data;
}
