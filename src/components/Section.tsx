import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function SectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 py-2 text-sm font-semibold text-ink hover:underline">
          {linkLabel}
          <span className="sr-only">: {title}</span>
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}

export function SampleNotice({ text }: { text: string }) {
  return (
    <p className="mx-auto mt-4 max-w-6xl rounded-lg border border-dashed border-sand bg-beige px-4 py-2 text-center text-sm text-ink">
      {text}
    </p>
  );
}
