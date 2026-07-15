"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const slides = [
  {
    title: "Hospital procurement made searchable",
    text: "Surgical disposables, ICU furniture, equipment, diagnostics, and infection control supplies.",
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Trusted products for clinical teams",
    text: "Browse by category, SKU, brand, specification, and product family.",
    image:
      "https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Fast quote generation",
    text: "Send focused inquiries to sales without cart or checkout friction.",
    image:
      "https://images.unsplash.com/photo-1581595219315-a187dd40c322?auto=format&fit=crop&w=1400&q=80"
  }
];

export function BannerSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 4500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[16/10] min-h-[240px] sm:min-h-0 w-full overflow-hidden rounded-lg border border-border bg-medical-deep text-white shadow-soft">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0"
        >
          <Image src={slide.image} alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-medical-deep/70" />
          <div className="absolute inset-0 flex items-end p-5 sm:p-8">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold tracking-normal sm:text-2xl md:text-3xl">{slide.title}</h2>
              <p className="mt-2 text-xs leading-5 text-white/85 sm:text-sm sm:leading-6 md:text-base">{slide.text}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 right-4 flex gap-1.5" aria-hidden="true">
        {slides.map((item, slideIndex) => (
          <span
            key={item.title}
            className={`h-1.5 rounded-full transition-all ${
              slideIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
