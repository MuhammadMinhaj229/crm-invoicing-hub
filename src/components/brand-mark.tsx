import brandMark from "../assets/safar-brand-mark.png";

export function BrandMark({
  name,
  logoUrl,
  compact = false,
}: {
  name: string;
  logoUrl?: string;
  compact?: boolean;
}) {
  const source = logoUrl || brandMark;

  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <img
        src={source}
        alt=""
        width={1024}
        height={1024}
        className={`${compact ? "h-9 w-9" : "h-11 w-11"} shrink-0 rounded-lg object-cover`}
      />
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-extrabold text-foreground">
          {name}
        </span>
        {!compact ? (
          <span className="block text-[10px] font-bold uppercase text-muted-foreground">
            Gulf Assistance &amp; Coordination
          </span>
        ) : null}
      </span>
    </span>
  );
}