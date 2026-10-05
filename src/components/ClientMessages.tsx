import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Sends only these message namespaces to the client components inside it, so one page's form copy isn't
 * inlined into every page's HTML. A nested provider replaces the layout's messages (it doesn't merge them):
 * list every namespace the client components inside use, including root keys such as ConsentText's "sell.privacy".
 */
export async function ClientMessages({ namespaces, children }: { namespaces: string[]; children: React.ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={Object.fromEntries(namespaces.filter((ns) => ns in messages).map((ns) => [ns, messages[ns]]))}>
      {children}
    </NextIntlClientProvider>
  );
}
