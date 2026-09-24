import { Captions, CaptionsOff, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Scene = {
  id: string;
  chapter: string;
  caption: string;
  note: string;
};

const SCENES: Scene[] = [
  {
    id: "distance",
    chapter: "The distance",
    caption: "A late call from home. You hear the worry, but you cannot fly down tomorrow.",
    note: "Living in the Gulf, every small need back home turns into a long night of worry.",
  },
  {
    id: "silence",
    chapter: "The silent struggle",
    caption: "Medicines running low. Hospital queues. Heavy bags. They never tell you everything.",
    note: "Parents stay quiet because they do not want to add to your load.",
  },
  {
    id: "initiative",
    chapter: "Safar N manzil steps in",
    caption: "We stand in for you in India — one responsible person, treating your family as ours.",
    note: "That is our purpose: to be your presence at home when you cannot be there.",
  },
  {
    id: "steps",
    chapter: "Simple steps",
    caption: "One message. Clear cost agreed first. Then the work is done in person.",
    note: "No confusion, no guessing, no surprise bills.",
  },
  {
    id: "relief",
    chapter: "Proof comes back",
    caption: "Photos and a clear bill sent to your phone. The worry is finished.",
    note: "You see what was done, what it cost, and that they are alright.",
  },
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
  eyebrow = "Our story in one minute",
  title = "The worry you carry. The help we bring.",
  text = "From a worried call in the Gulf to photo proof back on your phone — this is what we change, step by step.",
  points = ["Elderly care visits", "Groceries and medicines", "Home and repair checks", "Photo proof after every task"],
}: ServiceFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      const total = video.duration;
      if (!total || Number.isNaN(total)) return;
      const index = Math.min(SCENES.length - 1, Math.floor((video.currentTime / total) * SCENES.length));
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
    if (!video || !video.duration || Number.isNaN(video.duration)) return;
    video.currentTime = (video.duration / SCENES.length) * index + 0.05;
    void video.play();
    setPlaying(true);
  };

  const scene = SCENES[active] ?? SCENES[0]!;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-legacy-deep shadow-lift sm:rounded-[2rem]">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />

        {/* Brand and purpose */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/55 to-transparent p-4 sm:p-5">
          <div>
            <p className="font-display text-sm font-semibold tracking-[-0.01em] text-white sm:text-base">Safar N manzil</p>
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-white/70">Your family's helping hand in India</p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary-foreground">
            0{active + 1} · {scene.chapter}
          </span>
        </div>

        {/* Caption bar */}
        {captionsOn ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-4 pb-20 pt-14 sm:px-6">
            <p className="max-w-2xl font-display text-lg font-semibold leading-snug text-white drop-shadow-sm sm:text-2xl">
              {scene.caption}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{scene.note}</p>
          </div>
        ) : null}

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
          <button
            type="button"
            onClick={() => setCaptionsOn((value) => !value)}
            aria-label={captionsOn ? "Hide captions" : "Show captions"}
            aria-pressed={captionsOn}
            className="glass-nav-dark grid h-11 w-11 place-items-center rounded-full text-legacy-light transition hover:scale-105"
          >
            {captionsOn ? <Captions className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
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
          {SCENES.map((item, index) => (
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
                {item.chapter}
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
