import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AmbientBlobs } from "@/components/motion/ambient-blobs";
import { SectionHead } from "@/components/ui/section-head";
import { DishCard } from "@/components/features/dish-card";
import { FEATURED_DISHES } from "@/lib/data";

const HEADING_ID = "destacados-heading";

export function FeaturedDishes() {
  return (
    <section
      aria-labelledby={HEADING_ID}
      className="relative isolate overflow-hidden bg-muted/40 py-24 md:py-32"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <SectionHead
          center
          titleId={HEADING_ID}
          eyebrow="Lo más pedido"
          title="Nuestros destacados"
          description="Tres platos que resumen lo que somos: fuego, técnica y producto de estación."
        />
        <RevealGroup className="grid gap-7 [perspective:1200px] md:grid-cols-3">
          {FEATURED_DISHES.map((dish) => (
            <RevealItem key={dish.id}>
              <DishCard dish={dish} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
