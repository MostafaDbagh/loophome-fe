import { getAllProducts, getCategories, getSettings } from "@/lib/api";
import { formatLlmsFull, lastUpdated, TEXT_HEADERS } from "@/lib/seo/llms";

export const revalidate = 600;

export async function GET() {
  const [categories, products, settings, settingsAr] = await Promise.all([
    getCategories("en"),
    getAllProducts("en"),
    getSettings("en"),
    getSettings("ar"),
  ]);
  return new Response(formatLlmsFull({ categories, products, settings, settingsAr }), {
    headers: { ...TEXT_HEADERS, "Last-Modified": new Date(lastUpdated(products)).toUTCString() },
  });
}
