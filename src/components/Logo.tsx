import { House } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
      <span className="grid size-9 place-items-center rounded-md bg-ink text-white">
        <House className="size-5" strokeWidth={2.25} />
      </span>
      <span className="whitespace-nowrap text-lg sm:text-xl">{name}</span>
    </Link>
  );
}
