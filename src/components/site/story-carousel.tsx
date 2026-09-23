import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";

export interface StorySlide {
  id: string;
  title: string;
  accent: string;
  text: string;
  image: string;
  imageAlt: string;
}

export function StoryCarousel({ slides, editing = false }: { slides: StorySlide[]; editing?: boolean }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const visibleSlides = slides.filter((slide) => slide.image);
  const count = visibleSlides.length;

  useEffect(() => {
    if (editing || paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [count, editing, paused]);

  useEffect(() => {
    if (active >= count) setActive(0);
  }, [active, count]);

  if (!count) return null;
  const slide = visibleSlides[active] ?? visibleSlides[0];
  if (!slide) return null;
  const move = (direction: -1 | 1) => setActive((value) => (value + direction + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="How Safar N manzil helps families"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
      onPointerDown={(event) => { startX.current = event.clientX; }}
      onPointerUp={(event) => {
        if (startX.current === null) return;
        const distance = event.clientX - startX.current;
        if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
        startX.current = null;
      }}
      className="relative overflow-hidden rounded-[1.75rem] border border-legacy-ink/8 bg-legacy-light shadow-soft sm:rounded-[2.5rem]"
      tabIndex={0}
    >
      <div className="grid min-h-[34rem] items-center lg:grid-cols-[0.82fr_1.18fr]">
        <div className="relative z-10 px-7 py-10 sm:px-12 lg:px-14">
          <p className="font-script text-2xl text-legacy-teal">Different countries. Same love.</p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Story {active + 1} of {count}</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.04] text-legacy-ink sm:text-5xl">
            {slide.title} <span className="block text-primary">{slide.accent}</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-legacy-ink/65">{slide.text}</p>
          <p className="mt-7 font-script text-xl text-legacy-teal">You focus on what matters. We handle the rest.</p>
        </div>
        <div className="relative h-full min-h-[24rem] overflow-hidden bg-secondary/45">
          <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-legacy-light" aria-hidden />
          <img src={slide.image} alt={slide.imageAlt} className="relative h-full min-h-[24rem] w-full object-cover" loading="lazy" />
          <div className="absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-legacy-light to-transparent lg:block" aria-hidden />
        </div>
      </div>
      {count > 1 ? (
        <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between sm:left-10 sm:right-10">
          <div className="flex gap-2" aria-label="Choose story">
            {visibleSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show story ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => setActive(index)}
                className={cn("h-2.5 rounded-full transition-all", index === active ? "w-9 bg-primary" : "w-2.5 bg-legacy-ink/15")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => move(-1)} aria-label="Previous story" className="grid h-11 w-11 place-items-center rounded-full border border-legacy-ink/10 bg-legacy-light text-legacy-ink shadow-soft"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => move(1)} aria-label="Next story" className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      ) : null}
    </section>
  );
}