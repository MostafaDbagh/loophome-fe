import NextLink from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Article body. Content comes from our own API (admin-written), rendered without raw HTML.
 * Internal links are already locale-prefixed, so they use next/link as-is; external links
 * open in a new tab. Styles live in `.prose-hl` (globals.css), RTL-friendly.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-hl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <NextLink href={href}>{children}</NextLink>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          table: ({ children }) => (
            <div className="table-wrap">
              <table>{children}</table>
            </div>
          ),
          // The page already has the H1; demote any stray H1 in content.
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
