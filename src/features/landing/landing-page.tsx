import { useRef } from 'react';
import { LandingFooter } from './components/landing-footer/landing-footer.js';
import { LandingMarquee } from './components/landing-marquee/landing-marquee.js';
import { LandingNavbar } from './components/landing-navbar/landing-navbar.js';
import { useLandingThemeProgress } from './hooks/use-landing-theme-progress.js';
import { AboutSection } from './sections/about/about-section.js';
import { FaqSection } from './sections/faq/faq-section.js';
import { HeroSection } from './sections/hero/hero-section.js';
import { WhyMesmiceSection } from './sections/why-mesmice/why-mesmice-section.js';
import './landing-page.css';

export function LandingPage() {
  const landingRef = useRef<HTMLDivElement>(null);
  useLandingThemeProgress(landingRef);

  return (
    <div ref={landingRef} className="landing-page">
      <LandingNavbar />
      <main>
        <HeroSection />
        <LandingMarquee />
        <AboutSection />
        <div className="landing-reveal-stack">
          <div className="landing-reveal-stack__cover">
            <WhyMesmiceSection />
          </div>
          <FaqSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
