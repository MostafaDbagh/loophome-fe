"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductsPage from "./ProductList";
import OrdersPage from "../orders/Orders";
import { isItemManagerQuery } from "./itemBuckets";

export default function AdminProductsPage() {
  return <Suspense><AllItems /></Suspense>;
}

function AllItems() {
  const params = useSearchParams();
  return isItemManagerQuery(params) ? <ProductsPage /> : <OrdersPage view="intake" />;
}
