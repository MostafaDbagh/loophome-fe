import { ImageResponse } from "next/og";
import { appIconSvg, svgDataUri } from "@/components/brand";

// App icon (manifest, PWA) and the JSON-LD logo. Browser tabs use the 16px-tuned icon1.svg.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<img src={svgDataUri(appIconSvg())} width={512} height={512} alt="" />, size);
}
