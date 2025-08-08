import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { LuggageIcon, MapPinIcon, FilterIcon, SparklesIcon, ArrowRightIcon } from "lucide-react";
import HomeDemoView from "./HomeDemoView"; // The big demo component we built
import { SignInButton } from "@clerk/clerk-react";

export default function LandingPage() {
  const demoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: demoRef,
    offset: ["start end", "start start"], // start animating when demo enters viewport
  });

  // Scale from 0.85 to 1 as we scroll
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);

  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl sm:text-6xl font-light uppercase leading-tight">
          Your Closet, Organized.
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-300">
          Manage multiple households, pack for trips with ease, track every piece, and find anything fast with advanced search.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureBox icon={<MapPinIcon className="h-5 w-5" />} title="Households" text="Organize items across parents’ homes, apartments, or holiday houses." />
          <FeatureBox icon={<LuggageIcon className="h-5 w-5" />} title="Packing Lists" text="Digitally prepare for trips and pack with one tap." />
          <FeatureBox icon={<FilterIcon className="h-5 w-5" />} title="Advanced Search" text='Find items by brand, type, or color. Use “!sport” to exclude.' />
          <FeatureBox icon={<SparklesIcon className="h-5 w-5" />} title="Live Tracking" text="Know where your items are at all times." />
        </div>
        <SignInButton mode="modal">
          <Button className="mt-10 rounded-none">
            Get Started
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </SignInButton>
      </section>

      {/* Demo Section */}
      <section className="relative z-0 h-[200vh] bg-neutral-900">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <motion.div
            ref={demoRef}
            style={{ scale, opacity, y }}
            className="w-[90%] h-[90%] shadow-2xl overflow-hidden rounded-lg border border-neutral-800"
          >
            <HomeDemoView />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function FeatureBox({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="rounded-none bg-neutral-900 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm uppercase">{title}</div>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{text}</p>
    </Card>
  );
}