import { contentRoute } from "@/lib/contentRoute";
import { routes } from "@/lib/seo/config";

const route = contentRoute({ sellService: true, metaTitleKey: "meta2.sellAppliances", key: "sellAppliances", path: routes.sellAppliances, schemaType: "WebPage", parent: { labelKey: "meta.breadcrumb.sell", path: routes.sell }, cta: { labelKey: "sell.getOffer", href: routes.sell } });
export const generateMetadata = route.generateMetadata;
export default route.Page;
