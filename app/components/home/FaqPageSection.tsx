import FaqSection from "../FaqSection";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

export default function FaqPageSection() {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]" aria-label="Frequently asked questions">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <SectionLabel>FAQ</SectionLabel>
          <SectionHeading>Common Questions</SectionHeading>
          <p className="text-[#5C6B63] mt-3 text-sm">
            Everything you need to know before investing.
          </p>
        </div>
        <FaqSection />
      </div>
    </section>
  );
}
