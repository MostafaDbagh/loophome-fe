import { getAllProducts, getBlog, getCategories, getSettings } from "@/lib/api";
import { formatLlms, lastUpdated, TEXT_HEADERS } from "@/lib/seo/llms";

export const revalidate = 600;

export async function GET() {
  const [categories, products, settings, settingsAr, blog] = await Promise.all([
    getCategories("en"),
    getAllProducts("en", 30),
    getSettings("en"),
    getSettings("ar"),
    getBlog("en", { limit: 50 }),
  ]);
  return new Response(formatLlms({ categories, products, settings, settingsAr, posts: blog.items }), {
    headers: { ...TEXT_HEADERS, "Last-Modified": new Date(lastUpdated(products)).toUTCString() },
  });
}
