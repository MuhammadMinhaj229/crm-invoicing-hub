import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Chapter = {
  id: string;
  title: string;
  start: number;
};

const CHAPTERS: Chapter[] = [
  { id: "distance", title: "The distance", start: 0 },
  { id: "calls", title: "Ten calls, one small task", start: 23.9 },
  { id: "home", title: "Quiet struggles at home", start: 35.9 },
  { id: "someone", title: "Someone at the door", start: 59.8 },
  { id: "relief", title: "The worry lifts", start: 95.6 },
];

type ServiceFilmProps = {
  src: string;
  poster?: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  points?: string[];
};

export function ServiceFilm({
  src,
  poster,
  eyebrow = "Our story in two minutes",
  title = "The worry you carry. The help we bring.",
  text = "From a worried night in the Gulf to your parents cared for at home — the whole journey, scene by scene.",
  points = ["Elderly care visits", "Groceries and medicines", "Home and repair checks", "Photo proof after every task"],
}: ServiceFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      const total = video.duration;
      if (total && !Number.isNaN(total)) setProgress((video.currentTime / total) * 100);
      let index = 0;
      CHAPTERS.forEach((chapter, i) => {
        if (video.currentTime >= chapter.start) index = i;
      });
      setActive(index);
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const jumpTo = (index: number) => {
    const video = videoRef.current;
    setActive(index);
    const chapter = CHAPTERS[index];
    if (!video || !chapter) return;
    video.currentTime = chapter.start + 0.1;
    void video.play();
    setPlaying(true);
  };

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-legacy-deep shadow-lift sm:aspect-video sm:rounded-[2rem]">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="absolute inset-x-4 bottom-16 h-[3px] overflow-hidden rounded-full bg-white/25 sm:inset-x-5">
          <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>

        <div className="absolute bottom-4 left-4 flex gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause video" : "Play video"}
            className="glass-nav-dark grid h-11 w-11 place-items-center rounded-full text-legacy-light transition hover:scale-105"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="glass-nav-dark grid h-11 w-11 place-items-center rounded-full text-legacy-light transition hover:scale-105"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <p className="inline-flex items-center gap-2.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] md:text-5xl">{title}</h2>
        <p className="mt-5 text-lg leading-relaxed text-legacy-ink/65">{text}</p>

        <ol className="mt-7 grid gap-2">
          {CHAPTERS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => jumpTo(index)}
                aria-current={active === index}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold transition ${
                  active === index
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-legacy-warm text-legacy-ink/75 hover:bg-legacy-ink/5 hover:text-legacy-ink"
                }`}
              >
                <span className={`font-display text-xs font-bold ${active === index ? "text-primary-foreground/80" : "text-primary"}`}>
                  0{index + 1}
                </span>
                {item.title}
              </button>
            </li>
          ))}
        </ol>

        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {points.map((point) => (
            <li key={point} className="soft-card px-4 py-3 text-base font-medium">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
