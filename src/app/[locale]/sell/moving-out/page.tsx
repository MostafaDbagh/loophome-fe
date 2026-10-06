import { contentRoute } from "@/lib/contentRoute";
import { routes } from "@/lib/seo/config";

const route = contentRoute({ sellService: true, metaTitleKey: "meta2.movingOut", secondary: { labelKey: "sell.movingCta", href: routes.moving }, key: "movingOut", path: routes.sellMovingOut, schemaType: "WebPage", needs: "sellToUs", parent: { labelKey: "meta.breadcrumb.sell", labelKeyList: "meta.breadcrumb.sellList", path: routes.sell }, cta: { labelKey: "sell.getOffer", href: routes.sell } });
export const generateMetadata = route.generateMetadata;
export default route.Page;
