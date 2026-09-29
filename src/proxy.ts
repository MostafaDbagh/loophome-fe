import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Looks like a language prefix ("fr", "en-us") but isn't one of ours. */
const FOREIGN_LOCALE = /^\/(?!ar(?:\/|$)|en(?:\/|$))[a-z]{2}(?:-[a-z]{2})?(?:\/|$)/i;
const OUR_LOCALE = /^\/(ar|en)(?=\/|$)/i;
/** A first segment with a dot is a file (ads.txt, wp-login.php, .well-known/…), never a locale. */
const FILE_PATH = /^\/[^/]*\./;
/** The files this site serves; any other file path is a 404 without rendering pages or calling the API. */
const OUR_FILES =
  /^\/(?:\.well-known\/)?(?:robots\.txt|sitemap\.xml|llms\.txt|llms-full\.txt|ai\.txt|manifest\.webmanifest|favicon\.ico|og-(?:en|ar)\.png)$/;

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

/**
 * 308 to a path on the public host that served the request. request.url is the server's internal
 * origin behind a proxy or CDN (e.g. http://localhost:3000), so the forwarded host/scheme win.
 * (Next rejects a relative Location here.)
 */
function permanent(request: NextRequest, location: string) {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || request.nextUrl.protocol.replace(":", "");
  const base = host ? `${proto}://${host}` : request.url;
  return NextResponse.redirect(new URL(location, base), 308);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (FILE_PATH.test(pathname)) {
    if (OUR_FILES.test(pathname)) return NextResponse.next();
    return new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  // /fr/store would otherwise redirect to /en/fr/store and then 404; answer 404 directly.
  if (FOREIGN_LOCALE.test(trimmed)) {
    return NextResponse.rewrite(new URL(`/${routing.defaultLocale}/_not-found`, request.url));
  }

  // Trailing slash, uppercase locale and missing locale are fixed in a single permanent redirect.
  const target = canonicalPath(pathname);
  if (target !== pathname) {
    return permanent(request, `${target}${request.nextUrl.search}`);
  }

  const response = intl(request);
  const location = response.headers.get("location");
  if (response.status === 307 && location) {
    const url = new URL(location, request.url);
    return permanent(request, `${url.pathname}${url.search}`);
  }
  return response;
}

export const config = {
  // Skip API, Next internals, admin and metadata images. File paths come through so junk ones 404 early.
  matcher: ["/((?!api|_next|_vercel|admin|icon|apple-icon).*)"],
};
