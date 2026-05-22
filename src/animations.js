import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  // Hero entrance
  gsap.from('.hero-badge', { y: 30, opacity: 0, duration: 0.8, delay: 0.2 });
  gsap.from('.hero-title .title-line', { y: 60, opacity: 0, duration: 1, stagger: 0.15, delay: 0.4 });
  gsap.from('.hero-metrics .metric-card', { y: 40, opacity: 0, duration: 0.7, stagger: 0.1, delay: 1.2 });
  gsap.from('.hero-ctas', { y: 30, opacity: 0, duration: 0.7, delay: 1.6 });

  // Section labels and titles
  gsap.utils.toArray('.section-label, .section-title, .section-desc').forEach(el => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 0.8,
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
    });
  });

  // Step cards stagger
  gsap.utils.toArray('.step-card').forEach((card, i) => {
    gsap.from(card, {
      x: -50, opacity: 0, duration: 0.7, delay: i * 0.15,
      scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none none',
        onEnter: () => card.classList.add('visible') }
    });
  });

  // AI cards
  gsap.utils.toArray('.ai-card').forEach((card, i) => {
    gsap.from(card, {
      y: 50, opacity: 0, duration: 0.7, delay: i * 0.12,
      scrollTrigger: { trigger: card, start: 'top 82%', toggleActions: 'play none none none' }
    });
  });

  // Intervention cards
  gsap.utils.toArray('.intervention-card').forEach((card, i) => {
    gsap.from(card, {
      y: 40, opacity: 0, duration: 0.6, delay: i * 0.1,
      scrollTrigger: { trigger: card, start: 'top 82%',
        onEnter: () => card.classList.add('visible') }
    });
  });

  // Demo timeline
  gsap.utils.toArray('.timeline-step').forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 78%',
      onEnter: () => {
        step.classList.add('visible');
        // Animate marker
        const marker = step.querySelector('.ts-marker');
        if (marker) gsap.from(marker, { scale: 0, duration: 0.4 });
      }
    });
  });

  // Heatmap section
  gsap.from('.heatmap-container', {
    scale: 0.95, opacity: 0, duration: 1,
    scrollTrigger: { trigger: '.heatmap-container', start: 'top 80%' }
  });
  gsap.from('.heatmap-panel', {
    x: 50, opacity: 0, duration: 0.8,
    scrollTrigger: { trigger: '.heatmap-panel', start: 'top 80%' }
  });

  // Footer
  gsap.from('.footer-top', {
    y: 40, opacity: 0, duration: 0.8,
    scrollTrigger: { trigger: '.footer', start: 'top 85%' }
  });
}
