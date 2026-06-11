/** Card base del design system. Título opcional. Server-compatible. */
export function SectionCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl p-5 ring-1 bg-[var(--surface)] ring-[var(--border)] ${className}`}
    >
      {title && <h2 className="mb-3 text-sm font-medium text-[var(--text)]">{title}</h2>}
      {children}
    </section>
  );
}
