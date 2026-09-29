/** HomeLoop mark: a house with a loop arrow cut out (even-odd), 100×100. The 16px browser-tab version is src/app/icon1.svg. */
export const MARK_PATH =
  "M50 8 L92.2 44.6 Q94 46.2 94 48.8 V88 Q94 94 88 94 H12 Q6 94 6 88 V48.8 Q6 46.2 7.8 44.6 Z M62.44 49.08 A20.2 20.2 0 1 1 31.69 56.46 L39.31 60.01 A11.8 11.8 0 1 0 57.26 55.7 Z M44.2 62.3 L40.16 48.23 L26.8 54.18 Z";

export const INK = "#141414";
export const OFF_WHITE = "#FAF8F5";

/** Off-white mark on an ink tile, 512×512 viewBox; `radius` 0 for a full-bleed square (iOS rounds it). */
export const appIconSvg = (radius = 112) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${radius}" fill="${INK}"/><path fill="${OFF_WHITE}" fill-rule="evenodd" transform="translate(86 82.6) scale(3.4)" d="${MARK_PATH}"/></svg>`;

export const svgDataUri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
