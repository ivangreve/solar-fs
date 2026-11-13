/** Contenedor centrado para el contenido de una página. Server-compatible. */
export function PageShell({
  children,
  className = "",
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 ${narrow ? "max-w-3xl" : "max-w-6xl"} ${className}`}>
      {children}
    </div>
  );
}
