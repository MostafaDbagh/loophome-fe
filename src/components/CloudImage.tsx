"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

const CLOUDINARY_UPLOAD = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

/**
 * Cloudinary resizes and converts on its CDN (w_, q_auto, f_auto), so product photos skip the
 * Next image optimizer: no extra server round trip or first-view processing, which cut
 * the LCP "load delay" on the store and product pages. Other images use the default loader.
 */
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) =>
  src.replace("/image/upload/", `/image/upload/c_limit,w_${width},q_${quality ?? "auto"},f_auto/`);

export function CloudImage({ alt, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image alt={alt} {...props} loader={CLOUDINARY_UPLOAD.test(src) ? cloudinaryLoader : undefined} />;
}
