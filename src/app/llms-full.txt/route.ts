import { ApiUnavailableError, getAllProducts, getBlog, getCategories, getSettings } from "@/lib/api";
import { formatLlmsFull, TEXT_HEADERS } from "@/lib/seo/llms";

export const revalidate = 300;

export async function GET() {
  try {
    const [categories, categoriesAr, products, settings, settingsAr, blog] = await Promise.all([
      getCategories("en"),
      getCategories("ar"),
      getAllProducts("en", 2000),
      getSettings("en"),
      getSettings("ar"),
      getBlog("en", { limit: 50 }),
    ]);
    if (!settings || !settingsAr) throw new ApiUnavailableError("Missing public settings");
    return new Response(formatLlmsFull({ categories, categoriesAr, products, settings, settingsAr, posts: blog.items }), {
      headers: TEXT_HEADERS,
    });
  } catch (error) {
    // Keep Next's build-time/dynamic control-flow errors intact.
    if (!(error instanceof ApiUnavailableError)) throw error;
    return new Response("Service information is temporarily unavailable. Please use the official contact page.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "300", "X-Robots-Tag": "noindex" },
    });
  }
}
