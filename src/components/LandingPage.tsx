"use client";

import { HeroSection } from "./landing/HeroSection";
import { InvestorProfile } from "./landing/InvestorProfile";
import { HowItWorks } from "./landing/HowItWorks";
import { JudgingCriteria } from "./landing/JudgingCriteria";
import { FeaturesPreview } from "./landing/FeaturesPreview";
import { FooterCTA } from "./landing/FooterCTA";

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="w-full bg-background overflow-x-hidden">
      <div id="start-section" className="scroll-mt-0" />
      <HeroSection onEnter={onEnter} />
      <InvestorProfile />
      <HowItWorks />
      <JudgingCriteria />
      <FeaturesPreview />
      <FooterCTA onEnter={onEnter} />
      <div onClick={onEnter} role="button" aria-hidden="true" className="hidden" />
    </div>
  );
}
