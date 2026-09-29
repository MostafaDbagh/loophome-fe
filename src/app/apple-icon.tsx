import { ImageResponse } from "next/og";
import { appIconSvg, svgDataUri } from "@/components/brand";

// iOS home-screen icon: full-bleed square, iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<img src={svgDataUri(appIconSvg(0))} width={180} height={180} alt="" />, size);
}
