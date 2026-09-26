import type { Product } from "@/lib/api";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, preloadFirst = false }: { products: Product[]; preloadFirst?: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} preload={preloadFirst && i === 0} />
      ))}
    </div>
  );
}
