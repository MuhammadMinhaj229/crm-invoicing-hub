import brandLogo from "../assets/safar-logo.png.asset.json";

export type LogoStyle = "lockup" | "image";

/**
 * Brand lockup.
 *
 * "lockup" renders the original hand-built SAFAR mark in code: a plane taking
 * off, the script wordmark, and the circled N. It stays crisp at any size and
 * animates on hover.
 * "image" renders the uploaded logo picture instead.
 */
export function BrandMark({
  name,
  logoUrl,
  style = "lockup",
  compact = false,
  inverse = false,
}: {
  name: string;
  logoUrl?: string | undefined;
  style?: LogoStyle;
  compact?: boolean;
  inverse?: boolean;
}) {
  if (style === "image") {
    if (logoUrl) {
      return (
        <span className="inline-flex min-w-0 items-center gap-3">
          <img
            src={logoUrl}
            alt=""
            className={`${compact ? "h-9 w-9" : "h-11 w-11"} shrink-0 rounded-lg object-cover`}
          />
          <span className="min-w-0">
            <span
              className={`block truncate font-display text-sm font-extrabold ${inverse ? "text-background" : "text-foreground"}`}
            >
              {name}
            </span>
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex min-w-0 items-center">
        <img
          src={brandLogo.url}
          alt={name}
          className={`${compact ? "h-10" : "h-12"} w-auto shrink-0 rounded-xl object-contain`}
        />
      </span>
    );
  }

  return <BrandLockup name={name} compact={compact} inverse={inverse} />;
}

function BrandLockup({
  name,
  compact,
  inverse,
}: {
  name: string;
  compact: boolean;
  inverse: boolean;
}) {
  const tone = inverse ? "text-background" : "text-primary";
  const wordTone = inverse ? "text-background" : "text-foreground";
  const size = compact ? "text-[22px]" : "text-[26px]";
  const words = name.trim().split(/\s+/);
  const hasN = words.length > 1 && words.some((w) => w.toUpperCase() === "N");

  return (
    <span className="group inline-flex min-w-0 items-center gap-2" aria-label={name}>
      <PlaneIcon className={`${compact ? "h-5 w-5" : "h-6 w-6"} shrink-0 ${tone}`} />
      {hasN ? (
        <span className={`inline-flex min-w-0 items-baseline gap-1.5 ${size}`}>
          <span className={`font-script leading-none ${wordTone}`}>{words[0]}</span>
          <span
            className={`inline-flex ${compact ? "h-5 w-5 text-[11px]" : "h-6 w-6 text-xs"} shrink-0 translate-y-[-2px] items-center justify-center rounded-full font-display font-bold ${
              inverse ? "bg-background text-foreground" : "bg-primary text-background"
            }`}
          >
            N
          </span>
          <span className={`truncate font-script leading-none ${wordTone}`}>
            {words.slice(2).join(" ")}
          </span>
        </span>
      ) : (
        <span className={`truncate font-script leading-none ${size} ${wordTone}`}>{name}</span>
      )}
    </span>
  );
}

function PlaneIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`${className} origin-center rotate-45 transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:rotate-[62deg] group-hover:scale-110`}
    >
      <path d="M21.5 11.1 14 9.2 9.9 2.6a1 1 0 0 0-1.8.2L6.6 7.9 2.6 9.1a1 1 0 0 0-.1 1.9l4.3 1.7 1.2 4.6a1 1 0 0 0 1.8.2l2.4-4 7.4 2a1 1 0 0 0 .4-2l-.5-2.4Z" />
    </svg>
  );
}
