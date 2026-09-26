import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Looks like a language prefix ("fr", "en-us") but isn't one of ours. */
const FOREIGN_LOCALE = /^\/(?!ar(?:\/|$)|en(?:\/|$))[a-z]{2}(?:-[a-z]{2})?(?:\/|$)/i;
const OUR_LOCALE = /^\/(ar|en)(?=\/|$)/i;

/**
 * Canonical form in one step: no trailing slash, lowercase locale, locale prefix present.
 * e.g. "/AR/store/" → "/ar/store", "/store/" → "/ar/store" (the rest of the path keeps its case).
 */
function canonicalPath(pathname: string): string {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (OUR_LOCALE.test(trimmed)) return trimmed.replace(OUR_LOCALE, (m) => m.toLowerCase());
  return `/${routing.defaultLocale}${trimmed === "/" ? "" : trimmed}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  // /fr/store would otherwise redirect to /ar/fr/store and then 404; answer 404 directly.
  if (FOREIGN_LOCALE.test(trimmed)) {
    return NextResponse.rewrite(new URL(`/${routing.defaultLocale}/_not-found`, request.url));
  }

  // Trailing slash, uppercase locale and missing locale are fixed in a single permanent redirect.
  const target = canonicalPath(pathname);
  if (target !== pathname) {
    // A plain URL: NextURL.clone() would re-add the trailing slash we're removing.
    return NextResponse.redirect(new URL(`${target}${request.nextUrl.search}`, request.url), 308);
  }

  const response = intl(request);
  const location = response.headers.get("location");
  if (response.status === 307 && location) return NextResponse.redirect(new URL(location, request.url), 308);
  return response;
}

export const config = {
  // Skip API, Next internals, admin, metadata images and anything with a file extension (llms.txt, robots.txt…).
  matcher: ["/((?!api|_next|_vercel|admin|og|icon|apple-icon|.*\\..*).*)"],
};
