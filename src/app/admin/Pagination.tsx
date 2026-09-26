"use client";

import { fill, type AdminText } from "./i18n";

export /** Always-visible pager: previous/next plus numbered pages (current ±1, first and last). */
function Pagination({ page, pages, onPage, t }: { page: number; pages: number; onPage: (p: number) => void; t: AdminText }) {
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return (
    <nav aria-label={fill(t.page, { page, pages })} className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-ghost px-3! py-1.5! text-sm disabled:opacity-40">
        {t.prev}
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-muted">…</span>}
          <button
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={`grid size-9 place-items-center rounded-full text-sm font-semibold ${n === page ? "bg-ink text-white" : "border border-border hover:border-ink/40"}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="btn-ghost px-3! py-1.5! text-sm disabled:opacity-40">
        {t.next}
      </button>
      <span className="w-full text-center text-xs text-muted">{fill(t.page, { page, pages })}</span>
    </nav>
  );
}
