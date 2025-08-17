import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex items-center gap-1 text-sm text-gray-500">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {c.href && !isLast ? (
                <Link href={c.href} className="hover:text-gray-700 hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium">{c.label}</span>
              )}
              {!isLast && <span className="px-1 text-gray-400">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
