import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/data";

const PREFILL = encodeURIComponent("Hola, quiero reservar una mesa en Brasa.");
const LABEL = "Reservar por WhatsApp";

export function WhatsAppFloat() {
  return (
    <div role="complementary" aria-label="Contacto rápido">
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${PREFILL}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={LABEL}
        // #0C7A6B is WhatsApp's own darker brand green — #25D366 only clears
        // 1.98:1 against white text/icon, well under the 4.5:1 WCAG AA floor.
        className="fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center gap-2.5 rounded-full bg-[#0C7A6B] text-sm font-semibold text-white shadow-[0_12px_26px_rgba(0,0,0,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(0,0,0,0.5)] focus-visible:ring-3 focus-visible:ring-[#0C7A6B]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none md:size-auto md:px-5 md:py-3.5"
      >
        <MessageCircle
          aria-hidden="true"
          className="size-6 shrink-0 md:size-5"
          fill="currentColor"
          strokeWidth={0}
        />
        <span aria-hidden="true" className="hidden whitespace-nowrap md:inline">
          {LABEL}
        </span>
      </a>
    </div>
  );
}
