import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  center,
}: {
  children: React.ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <p
      className={cn(
        "mb-4 inline-flex items-center gap-2.5 font-mono text-xs tracking-[0.18em] text-gold uppercase",
        center && "justify-center",
        className
      )}
    >
      {!center && <span className="inline-block h-px w-[22px] bg-gold" />}
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  titleId,
  description,
  center,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Emitted on the `h2` so the owning section can `aria-labelledby` it. */
  titleId?: string;
  description?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-16 max-w-xl",
        center && "mx-auto text-center",
        className
      )}
    >
      <Eyebrow center={center}>{eyebrow}</Eyebrow>
      <h2 id={titleId} className="section-title text-balance text-foreground">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-[52ch] text-[17px] text-muted-foreground",
            center && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
