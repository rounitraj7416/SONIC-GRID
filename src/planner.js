// Quiet Home Planner — Interactive neighborhood recommender
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Bangalore neighborhoods database with acoustic + livability data
const NEIGHBORHOODS = [
  {
    name: 'Yelahanka New Town', lat: 13.1007, lng: 77.5963, avgDb: 38,
    budget: ['affordable','mid'], commuteMin: { central: 45, whitefield: 55, ecity: 70, manyata: 15, outer: 35 },
    tags: ['quiet','parks','schools'], desc: 'Peaceful suburb near the air force station with wide roads and parks.',
    price: '₹45L – ₹85L', quietScore: 96, greenScore: 92, safetyScore: 88,
    highlights: ['Yelahanka Lake','Low traffic density','Air Force proximity keeps area regulated']
  },
  {
    name: 'RR Nagar (Rajarajeshwari Nagar)', lat: 12.9260, lng: 77.5190, avgDb: 41,
    budget: ['affordable','mid'], commuteMin: { central: 35, whitefield: 65, ecity: 45, manyata: 55, outer: 40 },
    tags: ['quiet','schools','market','hospital'], desc: 'Well-planned residential area with good amenities and low noise.',
    price: '₹35L – ₹75L', quietScore: 93, greenScore: 78, safetyScore: 90,
    highlights: ['NICE Road connectivity','Multiple hospitals','Growing infrastructure']
  },
  {
    name: 'JP Nagar (Phases 7-9)', lat: 12.8950, lng: 77.5857, avgDb: 42,
    budget: ['mid','premium'], commuteMin: { central: 30, whitefield: 50, ecity: 25, manyata: 55, outer: 35 },
    tags: ['quiet','parks','schools','hospital','market'], desc: 'Established residential area with mature trees, parks, and excellent amenities.',
    price: '₹65L – ₹1.8Cr', quietScore: 91, greenScore: 88, safetyScore: 94,
    highlights: ['Bannerghatta Road access','JP Nagar 6th Phase Park','Well-established schools']
  },
  {
    name: 'Kengeri', lat: 12.9130, lng: 77.4870, avgDb: 36,
    budget: ['affordable'], commuteMin: { central: 40, whitefield: 70, ecity: 50, manyata: 60, outer: 45 },
    tags: ['quiet','parks'], desc: 'Rapidly developing suburb with some of the lowest noise levels in Bangalore.',
    price: '₹28L – ₹55L', quietScore: 98, greenScore: 85, safetyScore: 82,
    highlights: ['Near NICE Road','Surrounded by greenery','Upcoming metro connectivity']
  },
  {
    name: 'Banashankari 6th Stage', lat: 12.9100, lng: 77.5468, avgDb: 43,
    budget: ['affordable','mid'], commuteMin: { central: 30, whitefield: 55, ecity: 35, manyata: 50, outer: 35 },
    tags: ['quiet','schools','market','transit'], desc: 'Peaceful extension of Banashankari with good connectivity and local markets.',
    price: '₹40L – ₹90L', quietScore: 90, greenScore: 75, safetyScore: 91,
    highlights: ['Turahalli Forest nearby','Temple town vibes','Good bus connectivity']
  },
  {
    name: 'Vidyaranyapura', lat: 13.0700, lng: 77.5530, avgDb: 39,
    budget: ['affordable','mid'], commuteMin: { central: 40, whitefield: 60, ecity: 65, manyata: 20, outer: 40 },
    tags: ['quiet','parks','schools'], desc: 'Quiet residential area near IISc with academic serenity and green cover.',
    price: '₹45L – ₹95L', quietScore: 95, greenScore: 90, safetyScore: 89,
    highlights: ['Near IISc campus','BEL factory buffer zone','Amruthahalli Lake']
  },
  {
    name: 'HSR Layout (Sector 7)', lat: 12.9080, lng: 77.6500, avgDb: 46,
    budget: ['mid','premium'], commuteMin: { central: 25, whitefield: 35, ecity: 20, manyata: 45, outer: 15 },
    tags: ['parks','transit','market','schools'], desc: 'Modern planned layout with excellent ORR access. Startup hub with good parks.',
    price: '₹75L – ₹2Cr', quietScore: 82, greenScore: 80, safetyScore: 92,
    highlights: ['Agara Lake walking distance','ORR connectivity','Vibrant food scene']
  },
  {
    name: 'Uttarahalli', lat: 12.8980, lng: 77.5420, avgDb: 40,
    budget: ['affordable','mid'], commuteMin: { central: 35, whitefield: 60, ecity: 35, manyata: 55, outer: 40 },
    tags: ['quiet','parks','schools'], desc: 'Serene residential locality with Uttarahalli Lake and low traffic noise.',
    price: '₹35L – ₹70L', quietScore: 94, greenScore: 87, safetyScore: 86,
    highlights: ['Uttarahalli Lake','Low commercial activity','Affordable yet quiet']
  },
  {
    name: 'Devanahalli', lat: 13.2468, lng: 77.7100, avgDb: 35,
    budget: ['affordable','mid'], commuteMin: { central: 60, whitefield: 50, ecity: 80, manyata: 30, outer: 55 },
    tags: ['quiet','parks'], desc: 'Near the airport with upcoming smart city development. Exceptionally quiet.',
    price: '₹30L – ₹65L', quietScore: 99, greenScore: 94, safetyScore: 80,
    highlights: ['Airport proximity','Planned smart city','Vast open spaces']
  },
  {
    name: 'Sarjapur Road (Beyond Wipro)', lat: 12.8700, lng: 77.6800, avgDb: 44,
    budget: ['mid','premium','luxury'], commuteMin: { central: 40, whitefield: 20, ecity: 15, manyata: 55, outer: 20 },
    tags: ['quiet','schools','parks','hospital'], desc: 'Premium gated community corridor with excellent IT corridor access.',
    price: '₹80L – ₹3Cr', quietScore: 88, greenScore: 82, safetyScore: 95,
    highlights: ['Multiple gated communities','International schools','ORR access']
  },
  {
    name: 'Hennur Road', lat: 13.0300, lng: 77.6400, avgDb: 45,
    budget: ['mid','premium'], commuteMin: { central: 30, whitefield: 35, ecity: 55, manyata: 10, outer: 25 },
    tags: ['parks','transit','hospital'], desc: 'Green corridor near Manyata with multiple lakes and improving infrastructure.',
    price: '₹55L – ₹1.5Cr', quietScore: 86, greenScore: 88, safetyScore: 87,
    highlights: ['Hennur Lake','Manyata Tech Park nearby','Upcoming metro line']
  },
  {
    name: 'Whitefield (Varthur Side)', lat: 12.9500, lng: 77.7600, avgDb: 47,
    budget: ['mid','premium','luxury'], commuteMin: { central: 50, whitefield: 5, ecity: 30, manyata: 40, outer: 20 },
    tags: ['schools','hospital','market'], desc: 'IT hub outskirts with premium apartments and excellent schools.',
    price: '₹70L – ₹2.5Cr', quietScore: 80, greenScore: 70, safetyScore: 93,
    highlights: ['ITPL walking distance','International schools','Phoenix Mall access']
  },
];

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

  // Fix size on scroll
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) setTimeout(() => plannerMap.invalidateSize(), 200);
    });
  }, { threshold: 0.1 });
  obs.observe(container);
}

function searchNeighborhoods() {
  const budget = document.getElementById('planner-budget').value;
  const maxNoise = +document.getElementById('planner-noise').value;
  const work = document.getElementById('planner-work').value;

  const activePriorities = [];
  document.querySelectorAll('.chip.active').forEach(c => activePriorities.push(c.dataset.priority));

  // Filter neighborhoods
  let results = NEIGHBORHOODS.filter(n => {
    if (n.avgDb > maxNoise) return false;
    if (budget !== 'any' && !n.budget.includes(budget)) return false;
    return true;
  });

  // Score and sort
  results = results.map(n => {
    let score = n.quietScore;

    // Bonus for matching priorities
    activePriorities.forEach(p => {
      if (p === 'quiet' && n.avgDb <= 40) score += 10;
      if (n.tags.includes(p)) score += 5;
    });

    // Commute bonus
    if (work !== 'any' && n.commuteMin[work]) {
      const commute = n.commuteMin[work];
      if (commute <= 20) score += 15;
      else if (commute <= 35) score += 8;
      else if (commute >= 60) score -= 5;
    }

    return { ...n, finalScore: Math.min(100, score) };
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
            <span class="rcs-label">Price Range</span>
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

    // Quiet zone radius
    L.circle([n.lat, n.lng], {
      radius: 1200,
      color: getQuietColor(n.quietScore),
      fillColor: getQuietColor(n.quietScore),
      fillOpacity: 0.12,
      weight: 1.5,
      opacity: 0.4,
    }).addTo(resultMarkers);

    // Marker
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
  // Noise slider
  const slider = document.getElementById('planner-noise');
  const valDisplay = document.getElementById('noise-val');
  if (slider && valDisplay) {
    slider.addEventListener('input', () => {
      valDisplay.textContent = slider.value + ' dB';
    });
  }

  // Priority chips toggle
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });

  // Search button
  const searchBtn = document.getElementById('planner-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      initPlannerMap();
      searchBtn.innerHTML = '<span>⏳ Analyzing acoustic data...</span>';
      searchBtn.disabled = true;

      // Simulate AI processing delay
      setTimeout(() => {
        searchNeighborhoods();
        searchBtn.innerHTML = '<span>🔍 Find Quiet Neighborhoods</span>';
        searchBtn.disabled = false;

        // Scroll to results
        const results = document.getElementById('planner-results');
        if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1200);
    });
  }

  // Init map on section scroll
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
