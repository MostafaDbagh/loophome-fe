import { notFound } from "next/navigation";

/** Unknown paths under a locale render the branded [locale]/not-found page, not Next's bare 404. */
export default function CatchAll() {
  notFound();
}
