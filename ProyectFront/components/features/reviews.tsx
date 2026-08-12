import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { AmbientBlobs } from "@/components/motion/ambient-blobs";
import { SectionHead } from "@/components/ui/section-head";
import { ReviewCard } from "@/components/features/review-card";
import { REVIEWS } from "@/lib/data";

const HEADING_ID = "opiniones-heading";

export function Reviews() {
  return (
    <section
      id="opiniones"
      aria-labelledby={HEADING_ID}
      className="relative isolate overflow-hidden bg-background py-24 md:py-32"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <SectionHead
          center
          titleId={HEADING_ID}
          eyebrow="Lo que dicen"
          title="Opiniones de nuestros clientes"
        />
        <RevealGroup className="grid gap-6 [perspective:1200px] md:grid-cols-3">
          {REVIEWS.map((review) => (
            <RevealItem key={review.id}>
              <ReviewCard review={review} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
