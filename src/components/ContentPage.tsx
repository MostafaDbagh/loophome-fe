import type { Section } from "@/content/pages";

/** Long-form text page (About, legal, guides, sell landing pages): title, intro, numbered sections. */
export function ContentPage({
  title,
  intro,
  updated,
  sections,
  children,
  footer,
}: {
  title: string;
  intro: string;
  updated?: string;
  sections: Section[];
  children?: React.ReactNode;
  /** Shown after the sections, e.g. a call-to-action. */
  footer?: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-8 pt-10">
      {children}
      <header className="border-b border-border pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {updated && <p className="mt-3 text-sm text-muted">{updated}</p>}
        <p className="mt-5 text-lg leading-relaxed text-ink/80">{intro}</p>
      </header>
      <div className="divide-y divide-border">
        {sections.map((s, i) => (
          <section key={s.heading} id={s.id} className="scroll-mt-20 py-7">
            <div className="flex items-baseline gap-3">
              <span aria-hidden className="text-sm font-semibold text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl font-bold">{s.heading}</h2>
            </div>
            <div className="mt-3 space-y-3 leading-relaxed text-ink/80">
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      {footer}
    </article>
  );
}
