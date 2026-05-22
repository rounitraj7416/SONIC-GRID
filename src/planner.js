import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

let NEIGHBORHOODS = [];
let liveHotspots = [];
let livePrices = {};
let isDataReady = false;

// Socket connection
const socket = io();
socket.on('soundscape_update', (data) => {
  liveHotspots = data.hotspots;
  isDataReady = true;
});
socket.on('realestate_update', (data) => {
  livePrices = data.prices;
});

function getQuietColor(score) {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#34d399';
  if (score >= 70) return '#f59e0b';
  return '#f43f5e';
}

function getDbLabel(db) {
  if (db <= 35) return 'Whisper Quiet 🤫';
  if (db <= 40) return 'Very Quiet 😌';
  if (db <= 45) return 'Quiet ✨';
  if (db <= 50) return 'Moderate 🙂';
  return 'Noisy ⚠️';
}

let plannerMap = null;
let resultMarkers = L.layerGroup();

function initPlannerMap() {
  const container = document.getElementById('planner-map');
  if (!container || plannerMap) return;

  plannerMap = L.map('planner-map', {
    center: [12.9716, 77.5946],
    zoom: 11,
    zoomControl: false,
    attributionControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(plannerMap);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
  }).addTo(plannerMap);

  resultMarkers.addTo(plannerMap);

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) setTimeout(() => plannerMap.invalidateSize(), 200);
    });
  }, { threshold: 0.1 });
  obs.observe(container);
}

async function fetchInitialData() {
  try {
    const res = await fetch('/api/init');
    const data = await res.json();
    NEIGHBORHOODS = data.neighborhoods || [];
  } catch(e) {
    console.error('Failed to load neighborhoods', e);
  }
}

async function searchNeighborhoods() {
  const budget = document.getElementById('planner-budget').value;
  const maxNoise = +document.getElementById('planner-noise').value;
  const work = document.getElementById('planner-work').value;

  const activePriorities = [];
  document.querySelectorAll('.chip.active').forEach(c => activePriorities.push(c.dataset.priority));

  if (!isDataReady) {
    console.warn("Live socket data not received yet, using fallbacks if any.");
  }

  // Update NEIGHBORHOODS with live data
  let updatedNeighborhoods = NEIGHBORHOODS.map(n => {
    const matchedHotspot = liveHotspots.find(hs => hs.name === n.name);
    let newDb = matchedHotspot ? matchedHotspot.db : n.avgDb;
    let newPrice = livePrices[n.name] || `₹${n.price}L`; // fallback to basic formatting
    
    let dynamicQuietScore = Math.max(0, 100 - (newDb - 35) * 2);

    return { 
      ...n, 
      avgDb: newDb, 
      price: newPrice,
      quietScore: Math.round(dynamicQuietScore)
    };
  });

  // Filter neighborhoods
  let results = updatedNeighborhoods.filter(n => {
    if (n.avgDb > maxNoise) return false;
    if (budget !== 'any' && !n.budget.includes(budget)) return false;
    return true;
  });

  // Score and sort
  results = results.map(n => {
    let noiseDiff = Math.abs(maxNoise - n.avgDb);
    let score = Math.max(0, 100 - (noiseDiff * 2.5));

    activePriorities.forEach(p => {
      if (p === 'quiet' && n.avgDb <= 40) score += 15;
      if (n.tags.includes(p)) score += 15;
    });

    if (work !== 'any' && n.commuteMin[work]) {
      const commute = n.commuteMin[work];
      if (commute <= 20) score += 35;
      else if (commute <= 35) score += 20;
      else if (commute >= 60) score -= 10;
    }

    return { ...n, finalScore: Math.min(100, Math.round(score)) };
  });

  results.sort((a, b) => b.finalScore - a.finalScore);

  renderResults(results.slice(0, 6));
  renderMapMarkers(results.slice(0, 6), work);
}

function renderResults(results) {
  const container = document.getElementById('planner-results');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `
      <div class="results-placeholder">
        <div class="placeholder-icon">😔</div>
        <p>No neighborhoods match your criteria. Try adjusting your noise tolerance or budget range.</p>
      </div>`;
    return;
  }

  const work = document.getElementById('planner-work').value;

  container.innerHTML = `
    <div class="results-header">
      <span class="results-count">${results.length} neighborhoods found</span>
      <span class="results-sort">Sorted by AI Match Score</span>
    </div>
    ${results.map((n, i) => `
      <div class="result-card" style="animation-delay:${i * 0.08}s">
        <div class="rc-header">
          <div class="rc-rank">#${i + 1}</div>
          <div class="rc-info">
            <h4>${n.name}</h4>
            <p class="rc-desc">${n.desc}</p>
          </div>
          <div class="rc-score" style="--score-color:${getQuietColor(n.finalScore)}">
            <span class="score-num">${n.finalScore}</span>
            <span class="score-label">Match</span>
          </div>
        </div>
        <div class="rc-stats">
          <div class="rc-stat">
            <span class="rcs-val" style="color:${getQuietColor(n.quietScore)}">${n.avgDb} dB</span>
            <span class="rcs-label">${getDbLabel(n.avgDb)}</span>
          </div>
          <div class="rc-stat">
            <span class="rcs-val">${n.price}</span>
            <span class="rcs-label">Trending Price</span>
          </div>
          <div class="rc-stat">
            <span class="rcs-val">${work !== 'any' && n.commuteMin[work] ? n.commuteMin[work] + ' min' : '—'}</span>
            <span class="rcs-label">Commute</span>
          </div>
        </div>
        <div class="rc-meters">
          <div class="meter">
            <span class="meter-label">Quiet</span>
            <div class="meter-bar"><div class="meter-fill" style="width:${n.quietScore}%;background:${getQuietColor(n.quietScore)}"></div></div>
            <span class="meter-val">${n.quietScore}</span>
          </div>
          <div class="meter">
            <span class="meter-label">Green</span>
            <div class="meter-bar"><div class="meter-fill" style="width:${n.greenScore}%;background:#10b981"></div></div>
            <span class="meter-val">${n.greenScore}</span>
          </div>
          <div class="meter">
            <span class="meter-label">Safety</span>
            <div class="meter-bar"><div class="meter-fill" style="width:${n.safetyScore}%;background:#8b5cf6"></div></div>
            <span class="meter-val">${n.safetyScore}</span>
          </div>
        </div>
        <div class="rc-highlights">
          ${n.highlights.map(h => `<span class="rc-tag">✦ ${h}</span>`).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function renderMapMarkers(results, work) {
  if (!plannerMap) initPlannerMap();
  resultMarkers.clearLayers();

  const bounds = [];
  results.forEach((n, i) => {
    bounds.push([n.lat, n.lng]);

    L.circle([n.lat, n.lng], {
      radius: 1200,
      color: getQuietColor(n.quietScore),
      fillColor: getQuietColor(n.quietScore),
      fillOpacity: 0.12,
      weight: 1.5,
      opacity: 0.4,
    }).addTo(resultMarkers);

    const icon = L.divIcon({
      className: 'planner-marker',
      iconSize: [36, 36],
      html: `<div class="pm-icon" style="background:${getQuietColor(n.finalScore)}">${i + 1}</div>`,
    });
    const marker = L.marker([n.lat, n.lng], { icon });
    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif;min-width:200px">
        <div style="font-weight:700;font-size:14px">${n.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:${getQuietColor(n.quietScore)};margin:6px 0">${n.avgDb} dB</div>
        <div style="font-size:12px;color:#888;margin-bottom:4px">${n.desc}</div>
        <div style="font-size:12px;font-weight:600;color:${getQuietColor(n.finalScore)}">Match Score: ${n.finalScore}/100</div>
        <div style="font-size:11px;color:#888;margin-top:4px">${n.price}</div>
      </div>
    `);
    marker.addTo(resultMarkers);
  });

  if (bounds.length > 0) {
    plannerMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }
}

export function initPlanner() {
  fetchInitialData();

  const slider = document.getElementById('planner-noise');
  const valDisplay = document.getElementById('noise-val');
  if (slider && valDisplay) {
    slider.addEventListener('input', () => {
      valDisplay.textContent = slider.value + ' dB';
    });
  }

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });

  const searchBtn = document.getElementById('planner-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      initPlannerMap();
      searchBtn.innerHTML = '<span>⏳ Analyzing acoustic data...</span>';
      searchBtn.disabled = true;

      // Ensure data is rendered using latest socket state
      setTimeout(async () => {
        await searchNeighborhoods();
        searchBtn.innerHTML = '<span>🔍 Find Quiet Neighborhoods</span>';
        searchBtn.disabled = false;

        const results = document.getElementById('planner-results');
        if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 800);
    });
  }

  const section = document.getElementById('home-planner');
  if (section) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          initPlannerMap();
          obs.disconnect();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(section);
  }
}
