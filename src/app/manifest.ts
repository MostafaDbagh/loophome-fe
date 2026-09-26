import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeLoop — New and used home items in the UAE",
    short_name: "HomeLoop",
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
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
