import { contentRoute } from "@/lib/contentRoute";
import { routes } from "@/lib/seo/config";

const route = contentRoute({ metaTitleKey: "meta2.conditionGrades", key: "conditionGrades", path: routes.conditionGrades, schemaType: "WebPage", cta: { labelKey: "home.shop", href: routes.store } });
export const generateMetadata = route.generateMetadata;
export default route.Page;
