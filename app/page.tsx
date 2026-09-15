import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EmberLoader } from "@/components/loader/ember-loader";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { EmberDivider } from "@/components/motion/ember-divider";
import { Hero } from "@/components/features/hero";
import { Marquee } from "@/components/features/marquee";
import { About } from "@/components/features/about";
import { FeaturedDishes } from "@/components/features/featured-dishes";
import { Menu } from "@/components/features/menu";
import { Gallery } from "@/components/features/gallery";
import { Reviews } from "@/components/features/reviews";
import { Reservation } from "@/components/features/reservation";
import { Location } from "@/components/features/location";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Header />
      <EmberLoader />
      <main id="main">
        <Hero />
        <Marquee />
        <About />
        <EmberDivider />
        <FeaturedDishes />
        <EmberDivider />
        <Menu />
        <EmberDivider />
        <Gallery />
        <EmberDivider />
        <Reviews />
        <EmberDivider />
        <Reservation />
        <EmberDivider />
        <Location />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
