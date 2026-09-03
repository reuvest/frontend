import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FeaturedProperties, { FeaturedLand } from "../FeaturedProperties";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

interface FeaturedPropertiesSectionProps {
  lands: FeaturedLand[];
}

export default function FeaturedPropertiesSection({ lands }: FeaturedPropertiesSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]" aria-label="Featured land investment properties">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
          <div>
            <SectionLabel>Handpicked</SectionLabel>
            <SectionHeading light>Featured Properties</SectionHeading>
          </div>
          <Link href="/lands"
            className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 text-sm font-semibold transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <FeaturedProperties lands={lands} />
      </div>
    </section>
  );
}
