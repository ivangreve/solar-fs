import Link from "next/link";

/** Marca: sol lineal en ámbar, sin tile ni degradé. Server-compatible. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className="text-[var(--c-solar)]">
      <circle cx="14" cy="14" r="5.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2.5v3M14 22.5v3M2.5 14h3M22.5 14h3M5.9 5.9l2.1 2.1M20 20l2.1 2.1M22.1 5.9L20 8M8 20l-2.1 2.1" />
      </g>
    </svg>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Solar FS · inicio">
      <BrandMark />
      <span className="text-[17px] font-bold tracking-tight text-[var(--text)]">Solar FS</span>
    </Link>
  );
}
