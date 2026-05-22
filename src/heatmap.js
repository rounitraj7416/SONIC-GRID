// Real Leaflet map of Bangalore with noise hotspot overlays
import L from 'leaflet';
window.L = L;
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { updateForecastChartData } from './charts.js';

const API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;
const TOP_HOTSPOTS = [
  'Majestic / KSR Station',
  'Silk Board Junction',
  'MG Road',
  'KR Market',
  'Hebbal Flyover'
];

const BANGALORE_CENTER = [12.9716, 77.5946];
const BANGALORE_ZOOM = 12;

// Real Bangalore coordinates for noise hotspots
const HOTSPOTS = [
  { name: 'Majestic / KSR Station', lat: 12.9767, lng: 77.5713, db: 89, level: 'high', type: 'Traffic + Transit Hub', sources: ['traffic'] },
  { name: 'Silk Board Junction', lat: 12.9177, lng: 77.6238, db: 86, level: 'high', type: 'Traffic Congestion', sources: ['traffic'] },
  { name: 'MG Road', lat: 12.9756, lng: 77.6064, db: 84, level: 'high', type: 'Nightlife + Traffic', sources: ['traffic', 'speech'] },
  { name: 'KR Market', lat: 12.9631, lng: 77.5775, db: 82, level: 'high', type: 'Market + Traffic', sources: ['traffic'] },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245, db: 72, level: 'medium', type: 'Commercial Area', sources: ['traffic', 'speech'] },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, db: 74, level: 'medium', type: 'Nightlife District', sources: ['traffic', 'speech'] },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500, db: 68, level: 'medium', type: 'IT Corridor + Construction', sources: ['traffic', 'construction'] },
  { name: 'Marathahalli', lat: 12.9591, lng: 77.7009, db: 71, level: 'medium', type: 'Traffic + Commercial', sources: ['traffic'] },
  { name: 'BTM Layout', lat: 12.9166, lng: 77.6101, db: 65, level: 'medium', type: 'Residential + Traffic', sources: ['traffic'] },
  { name: 'Hebbal Flyover', lat: 13.0358, lng: 77.5970, db: 73, level: 'medium', type: 'Highway Traffic', sources: ['traffic'] },
  { name: 'Yeshwanthpur', lat: 13.0220, lng: 77.5440, db: 70, level: 'medium', type: 'Railway + Market', sources: ['traffic'] },
  { name: 'Jayanagar', lat: 12.9299, lng: 77.5838, db: 45, level: 'low', type: 'Residential', sources: ['speech'] },
  { name: 'Rajajinagar', lat: 12.9900, lng: 77.5530, db: 52, level: 'low', type: 'Mixed Residential', sources: ['speech'] },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603, db: 48, level: 'low', type: 'IT Park', sources: ['traffic'] },
  { name: 'Banashankari', lat: 12.9255, lng: 77.5468, db: 50, level: 'low', type: 'Residential', sources: ['speech'] },
  { name: 'JP Nagar', lat: 12.9063, lng: 77.5857, db: 47, level: 'low', type: 'Residential', sources: ['speech'] },
  { name: 'Yelahanka', lat: 13.1005, lng: 77.5963, db: 44, level: 'low', type: 'Suburb', sources: ['speech'] },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6474, db: 55, level: 'low', type: 'Residential + Startups', sources: ['traffic', 'speech'] },
];

// Vulnerability zones (hospitals, schools)
const VULN_ZONES = [
  { name: 'Bowring Hospital', lat: 12.9850, lng: 77.6050, type: 'hospital' },
  { name: 'Victoria Hospital', lat: 12.9575, lng: 77.5738, type: 'hospital' },
  { name: 'St. John\'s Hospital', lat: 12.9280, lng: 77.6210, type: 'hospital' },
  { name: 'Manipal Hospital', lat: 12.9615, lng: 77.6470, type: 'hospital' },
  { name: 'NIMHANS', lat: 12.9423, lng: 77.5960, type: 'hospital' },
  { name: 'Bishop Cotton School', lat: 12.9680, lng: 77.5990, type: 'school' },
  { name: 'National Public School', lat: 12.9380, lng: 77.6170, type: 'school' },
  { name: 'DPS Whitefield', lat: 12.9750, lng: 77.7350, type: 'school' },
];

function getColor(db) {
  if (db >= 80) return '#f43f5e';
  if (db >= 65) return '#f59e0b';
  return '#10b981';
}

function getRadius(db) {
  if (db >= 80) return 1200;
  if (db >= 65) return 900;
  return 600;
}

function getPulseClass(level) {
  if (level === 'high') return 'pulse-high';
  if (level === 'medium') return 'pulse-medium';
  return 'pulse-low';
}

function buildPopupHTML(hs, currentDb) {
  const db = currentDb !== undefined ? currentDb : hs.db;
  const dbColor = getColor(db);
  const trendVal = (hs.name.length % 5) + 1;
  const isUp = hs.lat > 12.95;
  const trendClass = isUp ? 'up' : 'down';
  const trendIcon = isUp ? '📈' : '📉';
  const trendSign = isUp ? '+' : '-';
  const peakHourStr = ((Math.floor(hs.lng * 10) % 8) + 12) + ':00 PM'; 
  const dominantSource = hs.sources && hs.sources.length > 0 ? hs.sources[0] : 'mixed';
  
  return `
    <div class="zdp-container">
      <div class="zdp-header">
        <h4>${hs.name}</h4>
        <span class="zdp-badge ${hs.level}">${hs.level}</span>
      </div>
      <div class="zdp-main">
        <div class="zdp-db" style="color:${dbColor}">${db} <span>dB</span></div>
        <div class="zdp-trend ${trendClass}">
          ${trendIcon} ${trendSign}${trendVal}dB vs yday
        </div>
      </div>
      <div class="zdp-stats">
        <div class="zdp-stat">
          <span class="zdp-stat-label">Peak Hour</span>
          <span class="zdp-stat-val">${peakHourStr}</span>
        </div>
        <div class="zdp-stat">
          <span class="zdp-stat-label">Dominant Source</span>
          <span class="zdp-stat-val" style="text-transform: capitalize;">${dominantSource}</span>
        </div>
      </div>
      <div class="zdp-actions">
        <button class="btn btn-primary btn-sm btn-report" onclick="alert('Noise violation reported at ${hs.name}.')">Report Noise</button>
        <label class="zdp-alert">
          <input type="checkbox" onchange="alert(this.checked ? 'Alert set for ${hs.name}' : 'Alert removed for ${hs.name}')"> Set Alert
        </label>
      </div>
    </div>
  `;
}

let globalMap = null;
let globalLiveLayer = null;

export function addCitizenReport(lat, lng, source, db) {
  if (!globalMap || !globalLiveLayer) return;
  const sourceIcons = {
    'Traffic': '🚗',
    'Construction': '🏗️',
    'Party': '🎉',
    'Other': '❓'
  };
  const iconHtml = sourceIcons[source] || '📣';
  
  const icon = L.divIcon({
    className: 'citizen-marker',
    iconSize: [28, 28],
    html: `<div class="cm-icon">${iconHtml}</div>`,
  });

  const marker = L.marker([lat, lng], { icon }).addTo(globalLiveLayer);
  marker.bindPopup(`<div style="font-family:var(--font-main);text-align:center"><strong>Citizen Report</strong><br>${source}<br>${db} dB</div>`).openPopup();
  globalMap.panTo([lat, lng], { animate: true, duration: 1.5 });
}

export function initHeatmap() {
  const container = document.getElementById('heatmap-map');
  if (!container) return;

  // Set explicit height for Leaflet
  container.style.height = '100%';
  container.style.minHeight = '500px';

  const map = L.map('heatmap-map', {
    center: BANGALORE_CENTER,
    zoom: BANGALORE_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });
  globalMap = map;

  // Add zoom control to bottom-right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  // Custom attribution
  const attr = L.control.attribution({ position: 'bottomleft', prefix: false });
  attr.addAttribution('© <a href="https://www.openstreetmap.org/">OSM</a> · <a href="https://carto.com/">CARTO</a>');
  attr.addTo(map);

  // -- Layer Groups --
  const liveLayer = L.layerGroup();
  globalLiveLayer = liveLayer;
  const predictLayer = L.layerGroup();
  const vulnLayer = L.layerGroup();
  const heatLayer = L.heatLayer([], { radius: 30, blur: 20, maxZoom: 17 });

  // Live noise circles
  const hotspotMarkers = [];
  HOTSPOTS.forEach(hs => {
    // Colored circle
    const circle = L.circle([hs.lat, hs.lng], {
      radius: getRadius(hs.db),
      color: getColor(hs.db),
      fillColor: getColor(hs.db),
      fillOpacity: 0.15,
      weight: 0.5,
      opacity: 0.3,
    });
    circle.bindPopup(buildPopupHTML(hs));
    circle.addTo(liveLayer);

    // Pulsing center dot
    const pulseIcon = L.divIcon({
      className: `pulse-marker ${getPulseClass(hs.level)}`,
      iconSize: [14, 14],
      html: `<div class="pulse-dot" style="background:${getColor(hs.db)}"></div>`,
    });
    const marker = L.marker([hs.lat, hs.lng], { icon: pulseIcon, interactive: false });
    marker.addTo(liveLayer);

    // Label
    const labelIcon = L.divIcon({
      className: 'map-db-label',
      iconSize: [60, 20],
      iconAnchor: [30, -10],
      html: `<span style="color:${getColor(hs.db)}">${hs.db} dB</span>`,
    });
    const labelMarker = L.marker([hs.lat, hs.lng], { icon: labelIcon, interactive: false });
    labelMarker.addTo(liveLayer);

    hotspotMarkers.push({ circle, marker, labelMarker, hs });
  });

  // Predictive layer (simulated future hotspots)
  const predictions = [
    { name: 'Predicted: MG Road Peak', lat: 12.9756, lng: 77.6064, db: 92, eta: '18 min' },
    { name: 'Predicted: Silk Board Surge', lat: 12.9177, lng: 77.6238, db: 94, eta: '25 min' },
    { name: 'Predicted: Hebbal Congestion', lat: 13.0358, lng: 77.5970, db: 81, eta: '35 min' },
    { name: 'Predicted: Marathahalli Peak', lat: 12.9591, lng: 77.7009, db: 79, eta: '42 min' },
  ];
  predictions.forEach(p => {
    const circle = L.circle([p.lat, p.lng], {
      radius: 900,
      color: '#8b5cf6',
      fillColor: '#8b5cf6',
      fillOpacity: 0.15,
      weight: 2,
      opacity: 0.5,
      dashArray: '8 6',
    });
    circle.bindPopup(`
      <div style="font-family:'Inter',sans-serif">
        <div style="font-weight:700;font-size:13px;color:#8b5cf6">⚡ PREDICTION</div>
        <div style="font-weight:600;margin:4px 0">${p.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#8b5cf6">${p.db} dB</div>
        <div style="font-size:11px;color:#888">ETA: ${p.eta}</div>
      </div>
    `);
    circle.addTo(predictLayer);

    const predIcon = L.divIcon({
      className: 'predict-marker',
      iconSize: [24, 24],
      html: `<div style="width:12px;height:12px;background:#8b5cf6;border-radius:50%;border:2px solid rgba(139,92,246,0.4);animation:pulse-predict 2s infinite"></div>`,
    });
    L.marker([p.lat, p.lng], { icon: predIcon, interactive: false }).addTo(predictLayer);
  });

  // Vulnerability layer
  VULN_ZONES.forEach(v => {
    const icon = L.divIcon({
      className: 'vuln-marker',
      iconSize: [28, 28],
      html: `<div class="vuln-icon">${v.type === 'hospital' ? '🏥' : '🏫'}</div>`,
    });
    const marker = L.marker([v.lat, v.lng], { icon });
    marker.bindPopup(`
      <div style="font-family:'Inter',sans-serif">
        <div style="font-weight:700">${v.name}</div>
        <div style="font-size:12px;color:#f59e0b;margin-top:2px">${v.type === 'hospital' ? 'Protected Health Zone' : 'School Zone'}</div>
      </div>
    `);
    marker.addTo(vulnLayer);

    // Protection radius
    L.circle([v.lat, v.lng], {
      radius: 500,
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.06,
      weight: 1,
      opacity: 0.3,
      dashArray: '4 4',
    }).addTo(vulnLayer);
  });

  // Show live layer by default
  liveLayer.addTo(map);

  // Layer toggle buttons
  const layers = { live: liveLayer, predict: predictLayer, vuln: vulnLayer, heat: heatLayer };
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layerName = btn.dataset.layer;

      // Show/hide heatmap controls
      const heatControls = document.getElementById('heatmap-controls');
      if (heatControls) heatControls.style.display = layerName === 'heat' ? 'block' : 'none';

      // Remove all layers
      Object.values(layers).forEach(l => map.removeLayer(l));

      // Add selected
      if (layerName === 'heat') {
        heatLayer.addTo(map);
      } else {
        liveLayer.addTo(map);
        if (layerName !== 'live') layers[layerName].addTo(map);
      }
    });
  });

  // Heatmap Intensity Slider
  const heatIntensity = document.getElementById('heatmap-intensity');
  if (heatIntensity) {
    heatIntensity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      heatLayer.setOptions({ radius: val / 2, blur: val / 3 });
    });
  }

  // Live traffic fetch
  async function updateTraffic() {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      console.warn('TomTom API Key not set or placeholder used.');
    }

    const timeSlider = document.getElementById('time-slider');
    const hour = timeSlider ? parseInt(timeSlider.value) : 12;
    let timeFactor = 1.0;
    if (hour < 6 || hour > 22) timeFactor = 0.6;
    else if (hour < 9 || hour > 18) timeFactor = 0.8;

    let liveTotalDb = 0;
    let liveCount = 0;
    const heatData = [];

    for (const { circle, marker, labelMarker, hs } of hotspotMarkers) {
      const isTop = TOP_HOTSPOTS.includes(hs.name);
      
      let newDb = hs.db;
      
      if (isTop && API_KEY && API_KEY !== 'YOUR_API_KEY_HERE') {
        try {
          const response = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${API_KEY}&point=${hs.lat},${hs.lng}`);

          if (response.ok) {
            const data = await response.json();
            if (data.flowSegmentData) {
              const { currentSpeed, freeFlowSpeed } = data.flowSegmentData;
              const congestion = Math.max(0, (freeFlowSpeed - currentSpeed) / freeFlowSpeed);
              const baseDb = 50 + (congestion * 45);
              newDb = Math.round(baseDb * timeFactor);

              circle.setRadius(getRadius(newDb));

              let circleColor = getColor(newDb);
              const toggleViolations = document.getElementById('toggle-violations');
              if (toggleViolations && toggleViolations.checked && newDb > 75) {
                circleColor = '#a21caf'; // Bright Purple for violation
              }

              circle.setStyle({ color: circleColor, fillColor: circleColor });
              hs.db = newDb;
              liveTotalDb += newDb;
              liveCount++;

              // Update label
              if (labelMarker) {
                const labelIcon = L.divIcon({
                  className: 'map-db-label live-label',
                  iconSize: [80, 20],
                  iconAnchor: [40, -10],
                  html: `<span style="color:${getColor(newDb)}">📡 ${newDb} dB</span>`,
                });
                labelMarker.setIcon(labelIcon);
              }

              // Update pulsing dot
              if (marker) {
                const pulseIcon = L.divIcon({
                  className: `pulse-marker ${getPulseClass(hs.level)} live-pulse`,
                  iconSize: [14, 14],
                  html: `<div class="pulse-dot" style="background:${getColor(newDb)}"></div>`,
                });
                marker.setIcon(pulseIcon);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch traffic for ${hs.name}:`, error);
        }
      } else {
        // Fallback or non-top hotspots get jitter
        const jitter = (Math.random() - 0.5) * 4;
        const baseDb = hs.db + jitter;
        newDb = Math.round(Math.max(35, Math.min(98, baseDb * timeFactor)));
        circle.setRadius(getRadius(newDb));
        circle.setStyle({ color: getColor(newDb), fillColor: getColor(newDb) });
        hs.db = newDb;
      }
      
      // Update popup for all cases
      if (circle.getPopup()) {
        circle.getPopup().setContent(buildPopupHTML(hs, newDb));
      }

      // Calculate intensity for heatmap (0.0 to 1.0)
      const intensity = Math.min(1, Math.max(0, (newDb - 35) / 60));
      heatData.push([hs.lat, hs.lng, intensity]);
    }

    // Update heatmap layer with new real-time data
    if (heatLayer) {
      heatLayer.setLatLngs(heatData);
    }

    if (liveCount > 0) {
      const avgDb = Math.round(liveTotalDb / liveCount);
      updateForecastChartData(avgDb);
    }
  }

  // Initial fetch
  updateTraffic();
  // Update every 5 minutes
  setInterval(updateTraffic, 300000);

  // Time Slider logic
  const timeSlider = document.getElementById('time-slider');
  const timeLabel = document.getElementById('current-time-label');

  function updateTimeLabel(val) {
    const ampm = val >= 12 ? 'PM' : 'AM';
    const displayHour = val % 12 === 0 ? 12 : val % 12;
    if (timeLabel) timeLabel.textContent = `${displayHour}:00 ${ampm}`;
  }

  if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
      updateTimeLabel(parseInt(e.target.value));
      updateTraffic();
      pausePlayback(); // Pause playback on manual drag
    });
  }

  // Playback Controls
  const playBtn = document.getElementById('play-btn');
  const speedSelect = document.getElementById('speed-select');
  let isPlaying = false;
  let playInterval = null;

  function advanceTime() {
    if (!timeSlider) return;
    let val = parseInt(timeSlider.value);
    val = (val + 1) % 25; // 0 to 24
    if (val === 25) val = 0; // Wrap around safely
    timeSlider.value = val;
    updateTimeLabel(val);
    updateTraffic();
  }

  function pausePlayback() {
    isPlaying = false;
    if (playBtn) playBtn.textContent = '▶';
    clearInterval(playInterval);
  }

  function startPlayback() {
    isPlaying = true;
    if (playBtn) playBtn.textContent = '⏸';
    const speed = speedSelect ? parseInt(speedSelect.value) : 1;
    clearInterval(playInterval);
    playInterval = setInterval(advanceTime, 500 / speed);
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isPlaying) pausePlayback();
      else startPlayback();
    });
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', () => {
      if (isPlaying) startPlayback(); // restart with new speed
    });
  }

  // AI Source Filters
  const sourceFilters = document.querySelectorAll('.source-filter');
  sourceFilters.forEach(filter => {
    filter.addEventListener('change', () => {
      updateFilters();
    });
  });

  function updateFilters() {
    const selectedSources = Array.from(sourceFilters)
      .filter(f => f.checked)
      .map(f => f.value);

    for (const { circle, marker, labelMarker, hs } of hotspotMarkers) {
      const hasSource = hs.sources.some(s => selectedSources.includes(s));
      if (hasSource) {
        circle.addTo(liveLayer);
        marker.addTo(liveLayer);
        labelMarker.addTo(liveLayer);
      } else {
        liveLayer.removeLayer(circle);
        liveLayer.removeLayer(marker);
        liveLayer.removeLayer(labelMarker);
      }
    }
  }

  // GIS Overlays
  const toggleSilence = document.getElementById('toggle-silence');
  if (toggleSilence) {
    toggleSilence.addEventListener('change', (e) => {
      if (e.target.checked) {
        map.addLayer(vulnLayer);
      } else {
        map.removeLayer(vulnLayer);
      }
    });
  }

  const toggleViolations = document.getElementById('toggle-violations');
  if (toggleViolations) {
    toggleViolations.addEventListener('change', () => {
      updateTraffic();
    });
  }

  // Fix map rendering
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => map.invalidateSize(), 200);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(container);
}
