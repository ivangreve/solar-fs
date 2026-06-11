"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

/** Cuenta hasta `value` al montar / cambiar. Formatea cada frame con `format`. */
export function AnimatedNumber({
  value,
  format,
  duration = 0.9,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span>{format(display)}</span>;
}
