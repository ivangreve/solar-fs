/** Contenedor centrado para el contenido de una página. Server-compatible. */
export function PageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto max-w-6xl px-6 py-8 ${className}`}>{children}</div>;
}
