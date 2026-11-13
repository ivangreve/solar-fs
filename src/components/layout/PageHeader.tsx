import Link from "next/link";

/** Encabezado de página: breadcrumb opcional, título, subtítulo y slot de acciones/meta. */
export function PageHeader({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="eyebrow mb-2 inline-flex items-center gap-1 transition-colors hover:text-[var(--text)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {back.label}
          </Link>
        )}
        <h1 className="truncate text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-[2.125rem]">{title}</h1>
        {subtitle && <p className="num mt-1 text-sm tracking-normal text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
