import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Looks like a language prefix ("fr", "en-us") but isn't one of ours. */
const FOREIGN_LOCALE = /^\/(?!ar(?:\/|$)|en(?:\/|$))[a-z]{2}(?:-[a-z]{2})?(?:\/|$)/i;
const OUR_LOCALE = /^\/(ar|en)(?=\/|$)/i;

/**
 * Canonical form in one step: lowercase (every route and slug is lowercase), no repeated or
 * trailing slashes, locale prefix present. e.g. "/AR//Store/" → "/ar/store", "/store/" → "/en/store",
 * "/en/products/Sofa-HL-000001" → "/en/products/sofa-hl-000001".
 */
function canonicalPath(pathname: string): string {
  const clean = pathname.toLowerCase().replace(/\/{2,}/g, "/");
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  if (OUR_LOCALE.test(trimmed)) return trimmed;
  return `/${routing.defaultLocale}${trimmed === "/" ? "" : trimmed}`;
}

/** 308 with a relative Location, so it follows whatever public host and scheme served the request
 * (request.url is the server's internal origin behind a proxy or CDN). */
const permanent = (location: string) => new NextResponse(null, { status: 308, headers: { Location: location } });

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  // /fr/store would otherwise redirect to /en/fr/store and then 404; answer 404 directly.
  if (FOREIGN_LOCALE.test(trimmed)) {
    return NextResponse.rewrite(new URL(`/${routing.defaultLocale}/_not-found`, request.url));
  }

  // Trailing slash, uppercase locale and missing locale are fixed in a single permanent redirect.
  const target = canonicalPath(pathname);
  if (target !== pathname) {
    return permanent(`${target}${request.nextUrl.search}`);
  }

  const response = intl(request);
  const location = response.headers.get("location");
  if (response.status === 307 && location) {
    const url = new URL(location, request.url);
    return permanent(`${url.pathname}${url.search}`);
  }
  return response;
}

export const config = {
  // Skip API, Next internals, admin, metadata images and anything with a file extension (llms.txt, robots.txt…).
  matcher: ["/((?!api|_next|_vercel|admin|og|icon|apple-icon|.*\\..*).*)"],
};
