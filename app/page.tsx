import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Pillars } from "@/components/Pillars";
import { AiLayer } from "@/components/AiLayer";
import { GuidedStudy } from "@/components/GuidedStudy";
import { ConfessionCards } from "@/components/ConfessionCards";
import { StudyLenses } from "@/components/StudyLenses";
import { Restraint } from "@/components/Restraint";
import { EarlyAccess } from "@/components/EarlyAccess";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <Pillars />
        <AiLayer />
        <GuidedStudy />
        <ConfessionCards />
        <StudyLenses />
        <Restraint />
        <EarlyAccess />
      </main>
      <Footer />
    </>
  );
}
