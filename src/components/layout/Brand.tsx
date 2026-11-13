import Link from "next/link";

/** Logo: sol estilizado sobre tile con gradiente cálido + wordmark. Server-compatible. */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[10px] bg-gradient-to-br from-amber-300 to-orange-500 text-neutral-900 shadow-[0_6px_16px_-6px_rgba(245,158,11,0.7)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </svg>
    </span>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="solar-fs · inicio">
      <BrandMark />
      <span className="text-[15px] font-semibold tracking-tight text-[var(--text)]">
        solar<span className="text-[var(--accent)]">-fs</span>
      </span>
    </Link>
  );
}
