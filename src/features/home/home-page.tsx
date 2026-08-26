import { HeroSection } from './components/hero-section.js';
import { LandingMarquee } from './components/landing-marquee.js';
import { LandingNavbar } from './components/landing-navbar.js';
import './home-page.css';

export function HomePage() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <main>
        <HeroSection />
        <LandingMarquee />
        <section id="o-que-e" className="landing-about" aria-label="O que é o Mesmice" />
      </main>
    </div>
  );
}
