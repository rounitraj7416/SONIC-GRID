import './style.css';
import { initParticles } from './particles.js';
import { initAnimations } from './animations.js';
import { initHeatmap } from './heatmap.js';
import { initCharts } from './charts.js';
import { initPlanner } from './planner.js';

// ---- Typewriter ----
function typewriter(el, text, speed = 35) {
  let i = 0;
  el.textContent = '';
  function tick() {
    if (i < text.length) { el.textContent += text[i]; i++; setTimeout(tick, speed); }
  }
  tick();
}

// ---- Animated Counters ----
function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();
    function update(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(eased * target);
      el.textContent = val.toLocaleString() + (suffix ? ' ' + suffix : '');
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// ---- Nav scroll ----
function initNav() {
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ---- Scroll reveal ----
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.15 });

  document.querySelectorAll('.stat-card, .step-card, .intervention-card, .timeline-step').forEach(el => obs.observe(el));
}

// ---- Noise bars ----
function initBars() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.noise-bar').forEach(bar => {
          bar.style.height = bar.dataset.height + '%';
        });
      }
    });
  }, { threshold: 0.3 });
  const chart = document.querySelector('.noise-bar-chart');
  if (chart) obs.observe(chart);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initParticles();
  initReveal();
  initBars();
  initHeatmap();
  initCharts();
  initPlanner();
  initAnimations();

  // Typewriter
  const tw = document.getElementById('hero-typewriter');
  if (tw) {
    setTimeout(() => {
      typewriter(tw, 'SONICGRID transforms cities from passive listeners into adaptive acoustic ecosystems that predict, prevent, and heal urban noise pollution in real time.');
    }, 600);
  }

  // Counter animation on hero visible
  const heroObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounters(); heroObs.disconnect(); } });
  }, { threshold: 0.5 });
  const hero = document.getElementById('hero');
  if (hero) heroObs.observe(hero);
});
