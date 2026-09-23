import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

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
  eyebrow = "See how we help",
  title = "One minute. The whole service.",
  text = "Groceries, hospital visits, home repairs and paperwork — handled in India, shown to you with photos and a clear bill.",
  points = ["Elderly care visits", "Groceries and essentials", "Home and repair checks", "Photo proof after every task"],
}: ServiceFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

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
        <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
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
