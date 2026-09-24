"use client";
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const element = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      if (element.current) element.current.textContent = String(value);
      previous.current = value;
      return;
    }
    const animation = animate(previous.current, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (current) => {
        if (element.current)
          element.current.textContent = String(Math.round(current));
      },
    });
    previous.current = value;
    return () => animation.stop();
  }, [value, reduced]);
  return (
    <span className={className} aria-label={String(value)}>
      <span ref={element} aria-hidden="true">
        {value}
      </span>
    </span>
  );
}
