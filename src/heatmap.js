import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { updateForecastChartData } from './charts.js';

const BANGALORE_CENTER = [12.9716, 77.5946];
const BANGALORE_ZOOM = 12;

const HOTSPOT_SOURCES = {
  'Majestic / KSR Station': ['traffic'],
  'Silk Board Junction': ['traffic'],
  'MG Road': ['traffic', 'speech'],
  'KR Market': ['traffic'],
  'Koramangala': ['traffic', 'speech'],
  'Indiranagar': ['traffic', 'speech'],
  'Whitefield': ['traffic', 'construction'],
  'Marathahalli': ['traffic'],
  'BTM Layout': ['traffic'],
  'Hebbal Flyover': ['traffic'],
  'Yeshwanthpur': ['traffic'],
  'Jayanagar': ['speech'],
  'Rajajinagar': ['speech'],
  'Electronic City': ['traffic'],
  'Banashankari': ['speech'],
  'JP Nagar': ['speech'],
  'Yelahanka': ['speech'],
  'HSR Layout': ['traffic', 'speech'],
};

// Audio Context for feedback
let audioCtx;
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
}

function playHoverSound(db) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  if (db >= 80) {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60 + Math.random() * 20, audioCtx.currentTime); // low rumble
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  } else if (db >= 65) {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 100, audioCtx.currentTime); // soft chime
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  }
  
  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

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

export async function initHeatmap() {
  const container = document.getElementById('heatmap-map');
  if (!container) return;

  container.style.height = '100%';
  container.style.minHeight = '500px';

  // Initialize Audio on first interaction on the wrapper
  const wrapper = document.getElementById('heatmap-wrapper');
  if (wrapper) {
    wrapper.addEventListener('mouseenter', initAudio, { once: true });
    wrapper.addEventListener('click', initAudio, { once: true });
  }

  const map = L.map('heatmap-map', {
    center: BANGALORE_CENTER,
    zoom: BANGALORE_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(map);

  const attr = L.control.attribution({ position: 'bottomleft', prefix: false });
  attr.addAttribution('© <a href="https://www.openstreetmap.org/">OSM</a> · <a href="https://carto.com/">CARTO</a>');
  attr.addTo(map);

  const liveLayer = L.layerGroup();
  const predictLayer = L.layerGroup();
  const vulnLayer = L.layerGroup();

  let VULN_ZONES = [];

  // Fetch initial data
  try {
    const res = await fetch('/api/init');
    const data = await res.json();
    VULN_ZONES = data.vulnZones || [];
  } catch(e) {
    console.error('Failed to load initial map data', e);
  }

  // Populate Vulnerability Layer
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

  const hotspotMarkers = {};

  // Setup WebSocket Client
  const socket = io();

  // Socket connection status UI
  const dashSensors = document.getElementById('dash-sensors');

  socket.on('connect', () => {
    if (dashSensors) dashSensors.style.color = '#06b6d4'; // cyan
  });

  socket.on('disconnect', () => {
    if (dashSensors) {
      dashSensors.textContent = 'Disconnected';
      dashSensors.style.color = '#f43f5e'; // red
    }
  });

  function refreshVisuals() {
    const timeSlider = document.getElementById('time-slider');
    let timeFactor = 1.0;
    if (timeSlider) {
      const hour = parseInt(timeSlider.value);
      if (hour < 6 || hour > 22) timeFactor = 0.6;
      else if (hour < 9 || hour > 18) timeFactor = 0.8;
    }

    const selectedSources = Array.from(document.querySelectorAll('.source-filter'))
      .filter(f => f.checked)
      .map(f => f.value);

    const toggleViolations = document.getElementById('toggle-violations');
    const violationsChecked = toggleViolations && toggleViolations.checked;

    for (const id in hotspotMarkers) {
      const item = hotspotMarkers[id];
      const baseDb = item.baseHs.db;
      const adjustedDb = Math.round(baseDb * timeFactor);

      const sources = HOTSPOT_SOURCES[item.baseHs.name] || ['speech'];
      const hasSource = sources.some(s => selectedSources.includes(s));

      if (hasSource) {
        if (!liveLayer.hasLayer(item.circle)) item.circle.addTo(liveLayer);
        if (!liveLayer.hasLayer(item.marker)) item.marker.addTo(liveLayer);
        if (!liveLayer.hasLayer(item.labelMarker)) item.labelMarker.addTo(liveLayer);
      } else {
        if (liveLayer.hasLayer(item.circle)) liveLayer.removeLayer(item.circle);
        if (liveLayer.hasLayer(item.marker)) liveLayer.removeLayer(item.marker);
        if (liveLayer.hasLayer(item.labelMarker)) liveLayer.removeLayer(item.labelMarker);
      }

      item.circle.setRadius(getRadius(adjustedDb));
      const circleColor = (violationsChecked && adjustedDb > 75) ? '#a21caf' : getColor(adjustedDb);
      item.circle.setStyle({ color: circleColor, fillColor: circleColor });

      const popupHtml = `
        <div style="font-family:'Inter',sans-serif;min-width:180px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${item.baseHs.name}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:${circleColor};margin:6px 0">${adjustedDb} dB</div>
          <div style="font-size:12px;color:#888">${item.baseHs.type || 'Residential'}</div>
          <div style="font-size:11px;color:#666;margin-top:4px">Level: ${item.baseHs.level.toUpperCase()}</div>
        </div>
      `;
      if (item.circle.isPopupOpen()) {
        item.circle.setPopupContent(popupHtml);
      } else {
        item.circle._popup.setContent(popupHtml);
      }

      const newPulseIcon = L.divIcon({
        className: `pulse-marker ${getPulseClass(item.baseHs.level)}`,
        iconSize: [14, 14],
        html: `<div class="pulse-dot" style="background:${circleColor}"></div>`,
      });
      item.marker.setIcon(newPulseIcon);

      const newLabelIcon = L.divIcon({
        className: 'map-db-label',
        iconSize: [60, 20],
        iconAnchor: [30, -10],
        html: `<span style="color:${circleColor}">${adjustedDb} dB</span>`,
      });
      item.labelMarker.setIcon(newLabelIcon);

      item.hs.db = adjustedDb;
    }
  }

  socket.on('soundscape_update', (data) => {
    const dashAvg = document.getElementById('dash-city-avg');
    const dashHottest = document.getElementById('dash-hottest');
    const dashQuietest = document.getElementById('dash-quietest');
    
    if (dashAvg) dashAvg.textContent = `${data.metrics.cityAverage} dB`;
    if (dashHottest) dashHottest.innerHTML = `${data.metrics.hottestZone.name} &mdash; ${data.metrics.hottestZone.db} dB`;
    if (dashQuietest) dashQuietest.innerHTML = `${data.metrics.quietestZone.name} &mdash; ${data.metrics.quietestZone.db} dB`;
    if (dashSensors && socket.connected) dashSensors.textContent = data.metrics.activeSensors;

    // Trigger chart update
    updateForecastChartData(data.metrics.cityAverage);

    const timeSlider = document.getElementById('time-slider');
    let timeFactor = 1.0;
    if (timeSlider) {
      const hour = parseInt(timeSlider.value);
      if (hour < 6 || hour > 22) timeFactor = 0.6;
      else if (hour < 9 || hour > 18) timeFactor = 0.8;
    }

    const selectedSources = Array.from(document.querySelectorAll('.source-filter'))
      .filter(f => f.checked)
      .map(f => f.value);

    const toggleViolations = document.getElementById('toggle-violations');
    const violationsChecked = toggleViolations && toggleViolations.checked;

    data.hotspots.forEach(hs => {
      const sources = HOTSPOT_SOURCES[hs.name] || ['speech'];
      const hasSource = sources.some(s => selectedSources.includes(s));
      const adjustedDb = Math.round(hs.db * timeFactor);

      if (!hotspotMarkers[hs.id]) {
        const circle = L.circle([hs.lat, hs.lng], {
          radius: getRadius(adjustedDb),
          color: (violationsChecked && adjustedDb > 75) ? '#a21caf' : getColor(adjustedDb),
          fillColor: (violationsChecked && adjustedDb > 75) ? '#a21caf' : getColor(adjustedDb),
          fillOpacity: 0.25,
          weight: 1.5,
          opacity: 0.6,
        });
        
        // Add hover sound effect
        circle.on('mouseover', () => playHoverSound(adjustedDb));
        
        const popupHtml = `
          <div style="font-family:'Inter',sans-serif;min-width:180px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${hs.name}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:${getColor(adjustedDb)};margin:6px 0">${adjustedDb} dB</div>
            <div style="font-size:12px;color:#888">${hs.type || 'Residential'}</div>
            <div style="font-size:11px;color:#666;margin-top:4px">Level: ${hs.level.toUpperCase()}</div>
          </div>
        `;
        circle.bindPopup(popupHtml);
        
        if (hasSource) circle.addTo(liveLayer);

        const pulseIcon = L.divIcon({
          className: `pulse-marker ${getPulseClass(hs.level)}`,
          iconSize: [14, 14],
          html: `<div class="pulse-dot" style="background:${(violationsChecked && adjustedDb > 75) ? '#a21caf' : getColor(adjustedDb)}"></div>`,
        });
        const marker = L.marker([hs.lat, hs.lng], { icon: pulseIcon });
        if (hasSource) marker.addTo(liveLayer);

        const labelIcon = L.divIcon({
          className: 'map-db-label',
          iconSize: [60, 20],
          iconAnchor: [30, -10],
          html: `<span style="color:${(violationsChecked && adjustedDb > 75) ? '#a21caf' : getColor(adjustedDb)}">${adjustedDb} dB</span>`,
        });
        const labelMarker = L.marker([hs.lat, hs.lng], { icon: labelIcon, interactive: false });
        if (hasSource) labelMarker.addTo(liveLayer);

        hotspotMarkers[hs.id] = { circle, marker, labelMarker, baseHs: hs, hs: { ...hs, db: adjustedDb }, violationsChecked };
      } else {
        const item = hotspotMarkers[hs.id];
        item.baseHs = hs; // Update base reference

        if (hasSource) {
          if (!liveLayer.hasLayer(item.circle)) item.circle.addTo(liveLayer);
          if (!liveLayer.hasLayer(item.marker)) item.marker.addTo(liveLayer);
          if (!liveLayer.hasLayer(item.labelMarker)) item.labelMarker.addTo(liveLayer);
        } else {
          if (liveLayer.hasLayer(item.circle)) liveLayer.removeLayer(item.circle);
          if (liveLayer.hasLayer(item.marker)) liveLayer.removeLayer(item.marker);
          if (liveLayer.hasLayer(item.labelMarker)) liveLayer.removeLayer(item.labelMarker);
        }

        if (item.hs.db !== adjustedDb || item.violationsChecked !== violationsChecked) {
          item.circle.setRadius(getRadius(adjustedDb));
          const circleColor = (violationsChecked && adjustedDb > 75) ? '#a21caf' : getColor(adjustedDb);
          item.circle.setStyle({ color: circleColor, fillColor: circleColor });
          
          const popupHtml = `
            <div style="font-family:'Inter',sans-serif;min-width:180px">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px">${hs.name}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:${circleColor};margin:6px 0">${adjustedDb} dB</div>
              <div style="font-size:12px;color:#888">${hs.type || 'Residential'}</div>
              <div style="font-size:11px;color:#666;margin-top:4px">Level: ${hs.level.toUpperCase()}</div>
            </div>
          `;
          if (item.circle.isPopupOpen()) {
            item.circle.setPopupContent(popupHtml);
          } else {
            item.circle._popup.setContent(popupHtml);
          }

          const newPulseIcon = L.divIcon({
            className: `pulse-marker ${getPulseClass(hs.level)}`,
            iconSize: [14, 14],
            html: `<div class="pulse-dot" style="background:${circleColor}"></div>`,
          });
          item.marker.setIcon(newPulseIcon);

          const newLabelIcon = L.divIcon({
            className: 'map-db-label',
            iconSize: [60, 20],
            iconAnchor: [30, -10],
            html: `<span style="color:${circleColor}">${adjustedDb} dB</span>`,
          });
          item.labelMarker.setIcon(newLabelIcon);
          
          item.hs.db = adjustedDb;
          item.violationsChecked = violationsChecked;
        }
      }
    });
  });

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
    L.marker([p.lat, p.lng], { icon: predIcon }).addTo(predictLayer);
  });

  liveLayer.addTo(map);

  const layers = { live: liveLayer, predict: predictLayer, vuln: vulnLayer };
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layerName = btn.dataset.layer;

      Object.values(layers).forEach(l => map.removeLayer(l));
      liveLayer.addTo(map);
      if (layerName !== 'live') layers[layerName].addTo(map);
    });
  });

  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn && wrapper) {
    fsBtn.addEventListener('click', () => {
      wrapper.classList.toggle('is-fullscreen');
      if (wrapper.classList.contains('is-fullscreen')) {
        fsBtn.innerHTML = '⛶ Exit Fullscreen';
      } else {
        fsBtn.innerHTML = '⛶ Fullscreen';
      }
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  // Time Slider Listener
  const timeSlider = document.getElementById('time-slider');
  const timeLabel = document.getElementById('current-time-label');
  if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      const ampm = val >= 12 ? 'PM' : 'AM';
      const displayHour = val % 12 === 0 ? 12 : val % 12;
      if (timeLabel) timeLabel.textContent = `${displayHour}:00 ${ampm}`;
      refreshVisuals();
    });
  }

  // Source Filters Listeners
  document.querySelectorAll('.source-filter').forEach(filter => {
    filter.addEventListener('change', refreshVisuals);
  });

  // Violations Overlay Listener
  const toggleViolations = document.getElementById('toggle-violations');
  if (toggleViolations) {
    toggleViolations.addEventListener('change', refreshVisuals);
  }

  // Silence Zones Overlay Listener
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

  // Initialize overlay layers visibility initially
  if (toggleSilence && toggleSilence.checked) {
    vulnLayer.addTo(map);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => map.invalidateSize(), 200);
      }
    });
  }, { threshold: 0.1 });
  obs.observe(container);
}
