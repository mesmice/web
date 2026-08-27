import { useEffect, type RefObject } from 'react';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => value * value * (3 - 2 * value);

export function useLandingThemeProgress(landingRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const landing = landingRef.current;
    const about = landing?.querySelector<HTMLElement>('#o-que-e');
    const why = landing?.querySelector<HTMLElement>('#por-que-mesmice');

    if (!landing || !about || !why) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let transitionStart = 0;
    let transitionDistance = 1;

    const measure = () => {
      const whyTop = window.scrollY + why.getBoundingClientRect().top;
      const transitionLength = window.innerHeight * (reducedMotion.matches ? 0.08 : 0.6);

      transitionStart = whyTop - transitionLength;
      transitionDistance = Math.max(1, transitionLength);
    };

    const render = () => {
      frame = 0;
      const progress = easeInOut(clamp((window.scrollY - transitionStart) / transitionDistance));
      landing.style.setProperty('--landing-theme-progress', `${progress * 100}%`);
    };

    const requestRender = () => {
      if (frame === 0) frame = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      measure();
      requestRender();
    };

    measure();
    render();
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', handleResize);
    reducedMotion.addEventListener('change', handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestRender);
      window.removeEventListener('resize', handleResize);
      reducedMotion.removeEventListener('change', handleResize);
    };
  }, [landingRef]);
}
