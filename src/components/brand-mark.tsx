import brandLogo from "../assets/safar-logo.png.asset.json";

/**
 * Brand lockup. The default SAFAR logo already contains the name, so it is
 * shown on its own; a custom logo uploaded in Settings is paired with the
 * workspace name instead.
 */
export function BrandMark({
  name,
  logoUrl,
  compact = false,
  inverse = false,
}: {
  name: string;
  logoUrl?: string | undefined;
  compact?: boolean;
  inverse?: boolean;
}) {
  if (!logoUrl) {
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
        {!compact ? (
          <span
            className={`block text-[10px] font-bold uppercase ${inverse ? "text-background/60" : "text-muted-foreground"}`}
          >
            Help for your family in India
          </span>
        ) : null}
      </span>
    </span>
  );
}
