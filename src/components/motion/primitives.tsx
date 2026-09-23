import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../../lib/utils";

/**
 * Motion layer.
 *
 * WHY no animation library: every effect here is a CSS transition driven by a
 * single IntersectionObserver. Nothing runs in the scroll loop, so the page
 * stays smooth on low-power phones, and `prefers-reduced-motion` removes the
 * transform entirely instead of merely shortening it.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <Tag
      ref={ref as never}
      style={reduced ? undefined : { transitionDelay: `${delay}ms` }}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "motion-safe:opacity-0 motion-safe:translate-y-4",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Slow radial glow behind the page. Pure CSS, GPU-composited, hidden from
 * assistive technology and disabled under reduced motion.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-[15%] -top-[20%] h-[65vw] w-[65vw] rounded-full bg-primary/10 blur-3xl motion-safe:animate-[ambient-drift_26s_ease-in-out_infinite]" />
      <div className="absolute -right-[20%] top-[45%] h-[55vw] w-[55vw] rounded-full bg-accent/20 blur-3xl motion-safe:animate-[ambient-drift_34s_ease-in-out_infinite_reverse]" />
    </div>
  );
}
