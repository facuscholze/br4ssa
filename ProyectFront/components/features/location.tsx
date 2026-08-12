import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AmbientBlobs } from "@/components/motion/ambient-blobs";
import { Eyebrow } from "@/components/ui/section-head";
import { SITE } from "@/lib/data";

const HEADING_ID = "contacto-heading";

const mapQuery = encodeURIComponent(SITE.address);
const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
const mapDirections = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

const INFO = [
  {
    icon: MapPin,
    label: "Dirección",
    value: SITE.address,
    href: mapDirections,
    external: true,
  },
  {
    icon: Phone,
    label: "Teléfono",
    value: SITE.phone,
    href: `tel:${SITE.phone.replace(/[^+\d]/g, "")}`,
    external: false,
  },
  {
    icon: Mail,
    label: "Email",
    value: SITE.email,
    href: `mailto:${SITE.email}`,
    external: false,
  },
  { icon: Clock, label: "Horario", value: SITE.hours, href: null, external: false },
];

export function Location() {
  return (
    <section
      id="contacto"
      aria-labelledby={HEADING_ID}
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <AmbientBlobs />
      <RevealGroup className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2 md:px-12">
        <RevealItem className="min-h-95 overflow-hidden rounded-3xl border border-border grayscale-[0.4] contrast-90 dark:invert-90">
          <iframe
            src={mapEmbed}
            loading="lazy"
            title="Ubicación de Brasa en el mapa"
            referrerPolicy="no-referrer-when-downgrade"
            // The address is already available as text and as a directions link
            // right beside the map, so the frame stays out of the tab order.
            tabIndex={-1}
            className="size-full min-h-95 border-0"
          />
        </RevealItem>

        <div className="flex flex-col justify-center gap-6.5">
          <RevealItem>
            <Eyebrow>Encontranos</Eyebrow>
            <h2 id={HEADING_ID} className="section-title text-balance text-foreground">
              Visitanos
            </h2>
          </RevealItem>

          {INFO.map((item) => (
            <RevealItem key={item.label} className="flex gap-4.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-ember">
                <item.icon className="size-4.5" />
              </span>
              <div>
                <b className="block text-[15px] text-foreground">
                  {item.label}
                </b>
                {item.href ? (
                  <a
                    href={item.href}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-ember hover:underline focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none"
                  >
                    {item.value}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {item.value}
                  </span>
                )}
              </div>
            </RevealItem>
          ))}

          <RevealItem>
            <a
              href={mapDirections}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-ember hover:text-ember focus-visible:ring-3 focus-visible:ring-ember/50 focus-visible:outline-none"
            >
              Cómo llegar
              <ArrowUpRight className="size-4" />
            </a>
          </RevealItem>
        </div>
      </RevealGroup>
    </section>
  );
}
