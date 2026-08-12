import Image from "next/image";
import { Star } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { AmbientBlobs } from "@/components/motion/ambient-blobs";
import { SectionHead } from "@/components/ui/section-head";
import { ReservationForm } from "@/components/features/reservation-form";
import { MEDIA, REVIEWS, STATS } from "@/lib/data";

const HEADING_ID = "reservas-heading";

const rating = STATS.find((stat) => stat.label === "Rating promedio")?.value;

const PERKS = [
  { label: "Horario", value: "Lun a Dom, 12:00 a 00:00" },
  { label: "Grupos", value: "Hasta 12 personas sin cargo extra" },
  { label: "Confirmación", value: "Vía WhatsApp, respuesta al instante" },
];

export function Reservation() {
  return (
    <section
      id="reservas"
      aria-labelledby={HEADING_ID}
      className="relative isolate overflow-hidden bg-muted/40 py-24 md:py-32"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <Reveal>
          <SectionHead
            center
            className="mb-6"
            titleId={HEADING_ID}
            eyebrow="Reservá tu mesa"
            title="Te guardamos un lugar junto al fuego"
          />

          {rating !== undefined && (
            <p className="mb-14 flex flex-wrap items-center justify-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex gap-0.5 text-gold" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="font-mono font-medium text-foreground">
                {rating.toFixed(1)} de 5
              </span>
              <span>· {REVIEWS.length} opiniones de clientes</span>
            </p>
          )}

          <div className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[1fr_1.15fr]">
            <div className="dark relative flex flex-col justify-center gap-6 p-10 md:p-14">
              <Image
                src={MEDIA.reservation}
                alt=""
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-black/35 to-black/85"
              />
              <div className="relative z-10">
                <h3 className="mb-4 text-[28px] text-on-media md:text-3xl">
                  ¿Por qué reservar?
                </h3>
                <p className="mb-7 text-on-media-dim">
                  Los fines de semana solemos completarnos. Reservá con
                  anticipación y confirmamos por WhatsApp en el momento.
                </p>
                <ul className="flex flex-col gap-3.5">
                  {PERKS.map((perk) => (
                    <li
                      key={perk.label}
                      className="flex gap-2.5 text-sm text-on-media-dim"
                    >
                      <b className="min-w-16 font-mono font-medium text-gold">
                        {perk.label}
                      </b>{" "}
                      {perk.value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-10 md:p-14">
              <ReservationForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
