import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Looks like a language prefix ("fr", "en-us") but isn't one of ours. */
const FOREIGN_LOCALE = /^\/(?!ar(?:\/|$)|en(?:\/|$))[a-z]{2}(?:-[a-z]{2})?(?:\/|$)/i;

export function proxy(request: NextRequest) {
  // /fr/store would otherwise redirect to /ar/fr/store and then 404; answer 404 directly.
  if (FOREIGN_LOCALE.test(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL(`/${routing.defaultLocale}/_not-found`, request.url));
  }
  const response = intl(request);
  // Locale redirects never change (no detection), so make them permanent for search engines.
  const location = response.headers.get("location");
  if (response.status === 307 && location) return NextResponse.redirect(new URL(location, request.url), 308);
  return response;
}

export const config = {
  // Skip API, Next internals, admin, metadata images and anything with a file extension (llms.txt, robots.txt…).
  matcher: ["/((?!api|_next|_vercel|admin|og|icon|apple-icon|.*\\..*).*)"],
};
