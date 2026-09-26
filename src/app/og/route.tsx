import { ImageResponse } from "next/og";

/**
 * Default 1200×630 share image. Product pages pass their own photo instead.
 * Latin text only: Arabic would need a bundled Arabic font to render in next/og.
 */
/** Rendered once at build; it only changes with a deploy. */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "#141414",
          background: "#EFE8DD",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800 }}>HomeLoop</div>
        <div style={{ fontSize: 44, marginTop: 24, maxWidth: 950 }}>
          Refurbished furniture, appliances & home items
        </div>
        <div style={{ fontSize: 32, marginTop: 40, color: "#6F6A63" }}>
          Dubai · Abu Dhabi · Sharjah · across the UAE
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
