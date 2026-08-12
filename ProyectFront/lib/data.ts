import type {
  FeaturedDish,
  GalleryImage,
  MenuTab,
  NavLink,
  Review,
  Stat,
} from "@/lib/types";

export const SITE = {
  name: "Brasa",
  tagline: "Parrilla & Cocina de Autor",
  description:
    "Brasa — parrilla y cocina de autor. Carnes de primera sobre fuego real, pastas caseras y una carta pensada para compartir. Reservá tu mesa online.",
  address: "Av. Principal 123, Ciudad",
  phone: "+54 9 11 1234-5678",
  whatsapp: "5491112345678",
  email: "contacto@restaurante.com",
  hours: "Lunes a Domingo, 12:00 a 00:00",
  url: "https://brasa-parrilla.example.com",
};

// Local, downloaded media. Source files live in public/images and public/video.
export const MEDIA = {
  heroBackground: "/images/hero-grill-flames.jpg",
  heroVideo: "/video/hero-embers.mp4",
  about: "/images/about-parrillero-asado.jpg",
  reservation: "/images/reservation-candlelit-table.jpg",
  /* Generated via scripts/gen-assets.mjs (attention-crop of the hero photo)
     — the 1200x630 size Twitter/Facebook/WhatsApp expect for a full-bleed card. */
  ogImage: { src: "/images/og-cover.jpg", width: 1200, height: 630 },
};

export const NAV_LINKS: NavLink[] = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Menú", href: "#menu" },
  { label: "Galería", href: "#galeria" },
  { label: "Opiniones", href: "#opiniones" },
  { label: "Contacto", href: "#contacto" },
];

export const STATS: Stat[] = [
  { label: "Años de fuego", value: 14 },
  { label: "Cortes en carta", value: 32 },
  { label: "Rating promedio", value: 4.9, decimals: 1 },
];

export const FEATURED_DISHES: FeaturedDish[] = [
  {
    id: "bife-de-chorizo",
    name: "Bife de Chorizo",
    tag: "Parrilla",
    description: "Punto justo, sal de campo, chimichurri de la casa.",
    image: "/images/dish-bife-de-chorizo.jpg",
  },
  {
    id: "asado-de-tira",
    name: "Asado de Tira",
    tag: "Parrilla",
    description: "Cocción lenta a fuego de quebracho, tres horas de brasa.",
    image: "/images/dish-asado-de-tira.jpg",
  },
  {
    id: "tiramisu",
    name: "Tiramisú",
    tag: "Postre",
    description: "Receta de la nonna, mascarpone y café recién molido.",
    image: "/images/dish-tiramisu.jpg",
  },
];

export const MENU_TABS: MenuTab[] = [
  {
    id: "parrilla",
    label: "Parrilla",
    icon: "🥩",
    items: [
      {
        name: "Bife de Chorizo",
        description: "Corte clásico, 350g, punto a elección.",
        price: "$18.000",
      },
      {
        name: "Asado",
        description: "Tira de asado cocida 3 horas a fuego lento.",
        price: "$22.000",
      },
      {
        name: "Vacío",
        description: "Corte jugoso, servido con papas rústicas.",
        price: "$20.000",
      },
      {
        name: "Provoleta",
        description: "Para arrancar, con orégano y aceite de oliva.",
        price: "$9.500",
      },
    ],
  },
  {
    id: "pastas",
    label: "Pastas",
    icon: "🍝",
    items: [
      {
        name: "Ravioles",
        description: "Rellenos de la casa, salsa a elección.",
        price: "$15.000",
      },
      {
        name: "Sorrentinos",
        description: "Jamón y muzzarella, salsa rosa.",
        price: "$16.000",
      },
      {
        name: "Ñoquis",
        description: "Todos los 29, hechos a mano cada día.",
        price: "$14.000",
      },
    ],
  },
  {
    id: "pizzas",
    label: "Pizzas",
    icon: "🍕",
    items: [
      {
        name: "Muzzarella",
        description: "Horno a leña, orégano fresco.",
        price: "$12.000",
      },
      {
        name: "Napolitana",
        description: "Tomate, ajo y albahaca.",
        price: "$14.000",
      },
      {
        name: "Especial",
        description: "Jamón, morrón y aceitunas.",
        price: "$16.000",
      },
    ],
  },
  {
    id: "postres",
    label: "Postres",
    icon: "🍰",
    items: [
      {
        name: "Flan",
        description: "Casero, con dulce de leche y crema.",
        price: "$6.000",
      },
      {
        name: "Helado",
        description: "Dos bochas, sabores de estación.",
        price: "$5.000",
      },
      {
        name: "Tiramisú",
        description: "Receta de la nonna, café recién molido.",
        price: "$7.000",
      },
    ],
  },
];

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "postre-casa",
    src: "/images/gallery-postre-casa.jpg",
    alt: "Postre de la casa",
    width: 800,
    height: 1200,
  },
  {
    id: "corte-premium",
    src: "/images/gallery-corte-premium.jpg",
    alt: "Corte premium en la parrilla",
    width: 800,
    height: 1198,
  },
  {
    id: "postre-gourmet",
    src: "/images/gallery-postre-gourmet.jpg",
    alt: "Postre gourmet",
    width: 800,
    height: 1200,
  },
  {
    id: "achuras",
    src: "/images/gallery-achuras.jpg",
    alt: "Achuras a la parrilla",
    width: 800,
    height: 533,
  },
  {
    id: "carnes-premium",
    src: "/images/gallery-carnes-premium.jpg",
    alt: "Carnes premium",
    width: 800,
    height: 1198,
  },
  {
    id: "tiramisu-casero",
    src: "/images/gallery-tiramisu-casero.jpg",
    alt: "Tiramisú casero",
    width: 800,
    height: 1422,
  },
];

export const REVIEWS: Review[] = [
  {
    id: "marina-g",
    name: "Marina G.",
    role: "Cliente frecuente",
    quote:
      "El punto de las carnes fue perfecto y la atención de principio a fin, impecable. Vamos a volver seguro.",
    rating: 5,
    initial: "M",
  },
  {
    id: "diego-r",
    name: "Diego R.",
    role: "Cena de cumpleaños",
    quote:
      "Reservé por WhatsApp en dos minutos y la mesa estaba lista apenas llegamos. Muy recomendable.",
    rating: 5,
    initial: "D",
  },
  {
    id: "lucia-f",
    name: "Lucía F.",
    role: "Cena en pareja",
    quote:
      "Las pastas caseras sorprenden tanto como la parrilla. Ambiente cálido y buena música de fondo.",
    rating: 5,
    initial: "L",
  },
];
