import { contentRoute } from "@/lib/contentRoute";
import { routes } from "@/lib/seo/config";

const route = contentRoute({ metaTitleKey: "meta2.privacy", key: "privacy", path: routes.privacy, schemaType: "WebPage", legal: true });
export const generateMetadata = route.generateMetadata;
export default route.Page;
