import { MarketingNav } from "@/components/homepage/MarketingNav";
import { HeroSection } from "@/components/homepage/HeroSection";
import { TrustStrip } from "@/components/homepage/TrustStrip";
import { ValuePillars } from "@/components/homepage/ValuePillars";
import { InteractivePreview } from "@/components/homepage/InteractivePreview";
import { SocialProof } from "@/components/homepage/SocialProof";
import { PricingTeaser } from "@/components/homepage/PricingTeaser";
import { SecuritySection } from "@/components/homepage/SecuritySection";
import { FAQSection } from "@/components/homepage/FAQSection";
import { FinalCTA } from "@/components/homepage/FinalCTA";
import { MarketingFooter } from "@/components/homepage/MarketingFooter";

const Homepage = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="relative">
        <HeroSection />
        <TrustStrip />
        <ValuePillars />
        <InteractivePreview />
        <SocialProof />
        <PricingTeaser />
        <SecuritySection />
        <FAQSection />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default Homepage;