import NextLink from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type HastNode = { type: string; tagName?: string; properties?: Record<string, unknown>; children?: HastNode[]; value?: string };

const textOf = (n: HastNode): string => (n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(textOf).join(""));
const elements = (n: HastNode | undefined, tag: string) => (n?.children ?? []).filter((c) => c.tagName === tag);

/**
 * Accessible tables: header cells get scope="col", and in comparison tables whose top-left
 * header is empty, each row's first cell becomes a row header (th scope="row"). Without this,
 * screen readers (and Lighthouse's td-has-header check) can't tie values to their row label.
 */
function rehypeTableHeaders() {
  const walk = (node: HastNode) => {
    if (node.tagName === "table") {
      const headCells = elements(elements(elements(node, "thead")[0], "tr")[0], "th");
      for (const th of headCells) th.properties = { ...th.properties, scope: "col" };
      const rowHeaders = headCells.length > 1 && textOf(headCells[0]).trim() === "";
      if (rowHeaders) {
        for (const tr of elements(elements(node, "tbody")[0], "tr")) {
          const first = elements(tr, "td")[0];
          if (first) {
            first.tagName = "th";
            first.properties = { ...first.properties, scope: "row" };
          }
        }
      }
    }
    node.children?.forEach(walk);
  };
  return (tree: HastNode) => walk(tree);
}

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
        rehypePlugins={[rehypeTableHeaders]}
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
