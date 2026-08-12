import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AmbientBlobs } from "@/components/motion/ambient-blobs";
import { Eyebrow } from "@/components/ui/section-head";
import { AboutPortrait } from "@/components/features/about-portrait";
import { StatCounter } from "@/components/features/stat-counter";
import { STATS } from "@/lib/data";

const HEADING_ID = "nosotros-heading";

export function About() {
  return (
    <section
      id="nosotros"
      aria-labelledby={HEADING_ID}
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <AmbientBlobs />
      <RevealGroup className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:px-12">
        <RevealItem>
          <AboutPortrait />
        </RevealItem>

        <div>
          <RevealItem>
            <Eyebrow>Nuestra historia</Eyebrow>
            <h2
              id={HEADING_ID}
              className="section-title mb-5 text-balance text-foreground"
            >
              Cocinamos como se cocinaba antes
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mb-4.5 max-w-[56ch] text-[17px] text-muted-foreground">
              En Brasa creemos que el fuego no se apura. Elegimos cortes de
              primera, maderas nobles y tiempos largos de cocción para que cada
              plato salga exactamente como tiene que salir.
            </p>
          </RevealItem>
          <RevealItem>
            <p className="mb-4.5 max-w-[56ch] text-[17px] text-muted-foreground">
              Sumamos pastas caseras y pizzas de horno a leña para que la mesa
              nunca se quede corta, sea la ocasión que sea.
            </p>
          </RevealItem>
          <RevealItem className="mt-10 flex flex-wrap gap-12">
            {STATS.map((stat) => (
              <StatCounter key={stat.label} {...stat} />
            ))}
          </RevealItem>
        </div>
      </RevealGroup>
    </section>
  );
}
