export type NavLink = {
  label: string;
  href: string;
};

export type Stat = {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
};

export type FeaturedDish = {
  id: string;
  name: string;
  tag: string;
  description: string;
  image: string;
};

export type MenuCategory = "parrilla" | "pastas" | "pizzas" | "postres";

export type MenuItem = {
  name: string;
  description: string;
  price: string;
};

export type MenuTab = {
  id: MenuCategory;
  label: string;
  icon: string;
  items: MenuItem[];
};

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  /** Intrinsic pixel size — the masonry relies on each photo's real ratio. */
  width: number;
  height: number;
};

export type Review = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  initial: string;
};
