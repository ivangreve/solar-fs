import { SectionCard } from "./SectionCard";

/**
 * Card pensada para alojar un chart (el chart en sí es un client component que
 * se pasa como children). La card es server-compatible.
 */
export function ChartCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SectionCard title={title} className={className}>
      {children}
    </SectionCard>
  );
}
