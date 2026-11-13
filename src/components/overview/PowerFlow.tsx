import { fmtW } from "@/components/ui/tokens";

/** Estado derivado del instante actual: una sola fuente de verdad para frase y diagrama. */
export type FlowState = {
  pvW: number;
  loadW: number;
  genW: number;
  soc: number | null;
};

const ACTIVE = 30; // W por debajo de los cuales una rama se considera apagada

export function flowHeadline(s: FlowState): { title: React.ReactNode; detail: string } {
  const surplus = s.pvW - s.loadW;
  const sun = <span className="text-[var(--c-solar)]">sol</span>;
  const batt = <span className="text-[var(--c-battery)]">batería</span>;
  const gen = <span className="text-[var(--c-generator)]">generador</span>;

  if (s.genW > ACTIVE) {
    return {
      title: <>El {gen} está andando.</>,
      detail: `Aporta ${fmtW(s.genW)}. La casa consume ${fmtW(s.loadW)} y los paneles entregan ${fmtW(s.pvW)}.`,
    };
  }
  if (s.pvW > ACTIVE && surplus > ACTIVE) {
    return {
      title: <>La casa vive del {sun}, y sobra para la {batt}.</>,
      detail: `Consumís ${fmtW(s.loadW)}. Los paneles entregan ${fmtW(s.pvW)} y el excedente de ${fmtW(surplus)} carga la batería.`,
    };
  }
  if (s.pvW > ACTIVE) {
    return {
      title: <>El {sun} y la {batt} sostienen la casa.</>,
      detail: `Consumís ${fmtW(s.loadW)}. Los paneles cubren ${fmtW(s.pvW)} y la batería pone ${fmtW(-surplus)}.`,
    };
  }
  return {
    title: <>Sin sol: la casa vive de la {batt}.</>,
    detail: `Consumís ${fmtW(s.loadW)}${s.soc != null ? ` y la batería está al ${Math.round(s.soc)} %` : ""}.`,
  };
}

const NODE_R = 46;

/** Diagrama de flujo en vivo: Paneles → Inversor → Consumo, con Batería y Generador. */
export function PowerFlow({ state }: { state: FlowState }) {
  const { pvW, loadW, genW, soc } = state;
  const surplus = pvW - loadW;
  const pvOn = pvW > ACTIVE;
  const genOn = genW > ACTIVE;
  const batOn = Math.abs(surplus) > ACTIVE && (pvOn || soc != null);
  const charging = surplus > 0;
  const socPct = soc == null ? 0 : Math.max(0, Math.min(100, soc));
  const circ = 2 * Math.PI * NODE_R;

  const dim = "var(--border)";
  const lineLabel = "var(--text-muted)";

  return (
    <svg
      viewBox="0 0 760 350"
      className="mt-5 block h-auto w-full"
      role="img"
      aria-label={`Flujo de energía: paneles ${fmtW(pvW)}, consumo ${fmtW(loadW)}${soc != null ? `, batería ${Math.round(soc)} por ciento` : ""}${genOn ? `, generador ${fmtW(genW)}` : ", generador apagado"}.`}
    >
      {/* líneas */}
      <g fill="none" strokeLinecap="round">
        <line x1="150" y1="110" x2="330" y2="110" style={{ stroke: dim }} strokeWidth="6" />
        {pvOn && <line x1="150" y1="110" x2="330" y2="110" className="flow-line" style={{ stroke: "var(--c-solar)" }} strokeWidth="6" />}
        <line x1="430" y1="110" x2="610" y2="110" style={{ stroke: dim }} strokeWidth="6" />
        <line x1="430" y1="110" x2="610" y2="110" className="flow-line" style={{ stroke: "var(--c-load)" }} strokeWidth="3" />
        <line x1="380" y1="140" x2="380" y2="224" style={{ stroke: dim }} strokeWidth="6" />
        {batOn && (
          <line
            x1="380" y1={charging ? 140 : 224} x2="380" y2={charging ? 224 : 140}
            className="flow-line" style={{ stroke: "var(--c-battery)" }} strokeWidth="5"
          />
        )}
        <line x1="142" y1="236" x2="352" y2="134" style={{ stroke: genOn ? "var(--c-generator)" : dim }} strokeWidth={genOn ? 4 : 3} strokeDasharray={genOn ? "6 6" : "3 8"} className={genOn ? "flow-line" : undefined} />
      </g>

      {/* Paneles */}
      <circle cx="100" cy="110" r={NODE_R} style={{ fill: "var(--surface-2)", stroke: pvOn ? "var(--c-solar)" : dim }} strokeWidth="2" />
      <circle cx="100" cy="110" r="10" style={{ fill: "var(--c-solar)" }} />
      <g style={{ stroke: "var(--c-solar)" }} strokeWidth="2.4" strokeLinecap="round"><path d="M100 88v6M100 126v6M78 110h6M116 110h6M84.5 94.5l4.2 4.2M111.3 121.3l4.2 4.2M115.5 94.5l-4.2 4.2M88.7 121.3l-4.2 4.2" /></g>
      <text x="100" y="194" textAnchor="middle" style={{ fill: lineLabel }} className="text-[14px] max-sm:text-[24px]">Paneles</text>
      <text x="100" y="224" textAnchor="middle" style={{ fill: "var(--c-solar)", fontFamily: "var(--font-jetbrains)" }} className="text-[22px] max-sm:text-[32px]" fontWeight="500">{fmtW(pvW)}</text>

      {/* Inversor */}
      <circle cx="380" cy="110" r="30" style={{ fill: "var(--surface-2)", stroke: dim }} strokeWidth="2" />
      <path d="M366 112h8l4-10 4 16 4-6h8" fill="none" style={{ stroke: "var(--text)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="380" y="62" textAnchor="middle" style={{ fill: "var(--text-faint)" }} className="text-[13px] max-sm:text-[22px]">Inversor</text>

      {/* Consumo */}
      <circle cx="660" cy="110" r={NODE_R} style={{ fill: "var(--surface-2)", stroke: "var(--c-load)" }} strokeWidth="2" />
      <path d="M640 114l20-18 20 18M646 110v18h28v-18" fill="none" style={{ stroke: "var(--c-load)" }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="660" y="194" textAnchor="middle" style={{ fill: lineLabel }} className="text-[14px] max-sm:text-[24px]">Consumo</text>
      <text x="660" y="224" textAnchor="middle" style={{ fill: "var(--c-load)", fontFamily: "var(--font-jetbrains)" }} className="text-[22px] max-sm:text-[32px]" fontWeight="500">{fmtW(loadW)}</text>

      {/* Batería */}
      <circle cx="380" cy="274" r={NODE_R} style={{ fill: "var(--surface-2)", stroke: dim }} strokeWidth="6" />
      {soc != null && (
        <circle cx="380" cy="274" r={NODE_R} fill="none" style={{ stroke: "var(--c-battery)" }} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(socPct / 100) * circ} ${circ}`} transform="rotate(-90 380 274)" />
      )}
      <text x="380" y="282" textAnchor="middle" style={{ fill: "var(--text)", fontFamily: "var(--font-jetbrains)" }} className="text-[24px] max-sm:text-[28px]" fontWeight="500">{soc != null ? `${Math.round(soc)}%` : "—"}</text>
      <text x="436" y="262" style={{ fill: lineLabel }} className="text-[14px] max-sm:text-[24px]">Batería{batOn ? (charging ? " ↑" : " ↓") : ""}</text>
      {batOn && (
        <text x="436" y="292" style={{ fill: "var(--c-battery)", fontFamily: "var(--font-jetbrains)" }} className="text-[22px] max-sm:text-[32px]" fontWeight="500">
          {charging ? "+" : "−"}{fmtW(Math.abs(surplus))}
        </text>
      )}

      {/* Generador */}
      <circle cx="100" cy="274" r="36" style={{ fill: "var(--surface)", stroke: genOn ? "var(--c-generator)" : dim }} strokeWidth="2" strokeDasharray={genOn ? undefined : "4 5"} />
      <path d="M104 258l-12 18h9l-3 14 12-19h-9z" fill="none" style={{ stroke: genOn ? "var(--c-generator)" : "var(--text-faint)" }} strokeWidth="2" strokeLinejoin="round" />
      <text x="100" y="334" textAnchor="middle" style={{ fill: genOn ? "var(--c-generator)" : "var(--text-faint)" }} className="text-[14px] max-sm:text-[24px]">
        {genOn ? `Generador · ${fmtW(genW)}` : "Generador"}
      </text>
    </svg>
  );
}
