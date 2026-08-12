import Link from "next/link";
import { Flame, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { NAV_LINKS, SITE } from "@/lib/data";

const WHATSAPP_TEXT = encodeURIComponent(
  "Hola! Quiero reservar una mesa en Brasa."
);

export function Footer() {
  return (
    // Permanently-dark surface: scoping `dark` here keeps ember/gold legible
    // against it even while the rest of the page is in light theme.
    <footer className="dark border-t border-on-media-line bg-[#0c0906] px-6 pt-20 pb-8 text-on-media md:px-12">
      <Reveal
        y={16}
        className="mx-auto grid max-w-6xl gap-10 pb-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]"
      >
        <div>
          <Link
            href="#inicio"
            className="flex items-center gap-2 font-display text-xl"
          >
            <Flame className="size-5 text-ember" />
            Bra<span className="text-ember">sa</span>
          </Link>
          <p className="mt-4 max-w-[32ch] text-sm text-on-media-dim">
            Parrilla y cocina de autor. Fuego real, producto de estación y una
            mesa que siempre suma un lugar más.
          </p>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${WHATSAPP_TEXT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-on-media-line px-4 py-2 text-sm text-on-media-dim transition-all hover:-translate-y-0.5 hover:border-ember hover:text-ember-hot focus-visible:ring-3 focus-visible:ring-ember/50 focus-visible:outline-none"
          >
            <MessageCircle className="size-4" />
            Escribinos por WhatsApp
          </a>
        </div>

        <div>
          <h3 className="mb-5 font-mono text-xs tracking-[0.12em] text-gold uppercase">
            Navegación
          </h3>
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-on-media-dim transition-colors hover:text-on-media"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#reservas"
                className="text-sm text-on-media-dim transition-colors hover:text-on-media"
              >
                Reservar
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 font-mono text-xs tracking-[0.12em] text-gold uppercase">
            Horarios
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-on-media-dim">
            <li>Lun – Dom</li>
            <li>12:00 a 00:00</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-5 font-mono text-xs tracking-[0.12em] text-gold uppercase">
            Contacto
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-on-media-dim">
            <li>{SITE.address}</li>
            <li>
              <a
                href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}
                className="underline-offset-4 transition-colors hover:text-on-media hover:underline"
              >
                {SITE.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="underline-offset-4 transition-colors hover:text-on-media hover:underline"
              >
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
      </Reveal>

      <div className="mx-auto max-w-6xl border-t border-on-media-line pt-7 text-xs text-on-media-dim">
        <span>© 2026 {SITE.name}. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
