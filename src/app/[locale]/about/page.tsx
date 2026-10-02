import { contentRoute } from "@/lib/contentRoute";
import { routes } from "@/lib/seo/config";

const route = contentRoute({ metaTitleKey: "meta2.about", metaTitleKeyServices: "meta2.aboutServices", key: "about", path: routes.about, schemaType: "AboutPage", cta: { labelKey: "home.shop", href: routes.store } });
export const generateMetadata = route.generateMetadata;
export default route.Page;
