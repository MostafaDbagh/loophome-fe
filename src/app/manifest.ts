import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "هوم لوب — أغراض منزلية مجدّدة في الإمارات",
    short_name: "هوم لوب",
    id: "/",
    description: "اشترِ أثاثاً وأجهزة مستعملة ومجدّدة أو بِع أغراضك في جميع أنحاء الإمارات.",
    lang: "ar-AE",
    dir: "rtl",
    start_url: "/ar",
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
