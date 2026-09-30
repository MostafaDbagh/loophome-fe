import type { Product, PublicSettings, ServiceOption } from "./api";

/** Services the admin offers for this product's category. */
export function servicesFor(product: Product, settings: PublicSettings | null): ServiceOption[] {
  const categoryId = product.category?.id;
  return (settings?.services ?? []).filter((s) => !s.categories?.length || (categoryId && s.categories.includes(categoryId)));
}

/** An assembly service, whatever the admin named its key ("assembly", "furniture-assembly"…). Same rule in the API. */
export const isAssemblyService = (key: string) => /(^|-)assembly(-|$)/.test(key);

/** Fee the customer pays for a service on this product (0 = free); "free assembly" covers any assembly service. */
export const serviceFee = (service: ServiceOption, product: Product) =>
  product.freeServices?.includes(service.key) || (product.freeAssembly && isAssemblyService(service.key)) ? 0 : service.fee;

/** Mirrors the API's delivery rule so the total shown matches the order. */
export function deliveryFee(
  product: Product,
  settings: PublicSettings | null,
  fulfilment: "delivery" | "pickup",
  city: string,
): number {
  const d = settings?.delivery;
  if (!d || fulfilment === "pickup" || product.freeDelivery || d.currency !== product.currency) return 0;
  if (d.freeOver != null && product.price >= d.freeOver) return 0;
  return d.cityFees.find((c) => c.city.toLowerCase() === city.toLowerCase())?.fee ?? d.defaultFee;
}

/** Delivery is free for this item whatever the city (admin flag or price threshold). */
export const hasFreeDelivery = (product: Product, settings: PublicSettings | null) =>
  !!settings?.delivery.enabled &&
  (product.freeDelivery || (settings.delivery.freeOver != null && product.price >= settings.delivery.freeOver));
