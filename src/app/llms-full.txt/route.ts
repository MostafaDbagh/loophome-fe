import { getAllProducts, getCategories, getSettings } from "@/lib/api";
import { formatLlmsFull, TEXT_HEADERS } from "@/lib/seo/llms";

export const revalidate = 600;

export async function GET() {
  const [categories, products, settings] = await Promise.all([
    getCategories("en"),
    getAllProducts("en"),
    getSettings("en"),
  ]);
  return new Response(formatLlmsFull(categories, products, settings), { headers: TEXT_HEADERS });
}
