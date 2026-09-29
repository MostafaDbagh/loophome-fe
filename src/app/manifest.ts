import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LoopHome — New and used home items in the UAE",
    short_name: "LoopHome",
    id: "/",
    description: "Buy used and refurbished furniture and appliances, or sell your items, across the UAE.",
    lang: "en-AE",
    dir: "ltr",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ["shopping"],
    // Brand pack: src/assets/app-icons (copied to public/app-icons).
    icons: [
      { src: "/app-icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/app-icons/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
