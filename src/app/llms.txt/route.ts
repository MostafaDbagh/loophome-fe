import { getAllProducts, getCategories, getSettings } from "@/lib/api";
import { formatLlms, TEXT_HEADERS } from "@/lib/seo/llms";

export const revalidate = 600;

export async function GET() {
  const [categories, products, settings] = await Promise.all([
    getCategories("en"),
    getAllProducts("en", 30),
    getSettings("en"),
  ]);
  return new Response(formatLlms(categories, products, settings), { headers: TEXT_HEADERS });
}
