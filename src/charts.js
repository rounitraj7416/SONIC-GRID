import Chart from 'chart.js/auto';

let forecastChart;
let donutChart;

export function initCharts() {
  initForecastChart();
  initEventFeed();
  initDonutChart();
}

function initForecastChart() {
  const container = document.getElementById('forecast-chart');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const labels = ['Now', '+15m', '+30m', '+45m', '+60m', '+75m', '+90m'];
  const actual = [62, 65, 71, null, null, null, null];
  const predicted = [null, null, 71, 78, 84, 76, 68];

  forecastChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Actual',
          data: actual,
          borderColor: '#00e8ff',
          backgroundColor: 'rgba(0,232,255,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#00e8ff',
          borderWidth: 2,
        },
        {
          label: 'Predicted',
          data: predicted,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#8b5cf6',
          borderWidth: 2,
          borderDash: [5, 5],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,10,15,0.9)',
          titleColor: '#eee',
          bodyColor: '#aaa',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        }
      },
      scales: {
        x: {
          ticks: { color: '#555', font: { size: 10, family: 'JetBrains Mono' } },
          grid: { color: 'rgba(255,255,255,0.03)' },
          border: { display: false }
        },
        y: {
          min: 50,
          max: 95,
          ticks: { color: '#555', font: { size: 10, family: 'JetBrains Mono' }, callback: v => v + ' dB' },
          grid: { color: 'rgba(255,255,255,0.03)' },
          border: { display: false }
        }
      }
    }
  });
}

// Simulate live event feed
const EVENTS = [
  { type: 'red', text: 'Heavy Traffic — MG Road' },
  { type: 'amber', text: 'Construction — Whitefield' },
  { type: 'red', text: 'Honking Cluster — Majestic' },
  { type: 'cyan', text: 'Siren Detected — Koramangala' },
  { type: 'amber', text: 'Nightlife Surge — Indiranagar' },
  { type: 'red', text: 'Illegal Racing — ORR' },
  { type: 'cyan', text: 'Emergency Vehicle — Hebbal' },
  { type: 'amber', text: 'Festival Noise — BTM Layout' },
  { type: 'red', text: 'Traffic Jam — Silk Board' },
];

function getConfHTML() {
  const conf = Math.floor(Math.random() * 50) + 49;
  let confClass = 'conf-low';
  if (conf > 85) confClass = 'conf-high';
  else if (conf >= 60) confClass = 'conf-med';
  return `<span class="event-conf ${confClass}">${conf}%</span>`;
}

function initEventFeed() {
  const feed = document.getElementById('event-feed');
  if (!feed) return;

  setInterval(() => {
    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const item = document.createElement('div');
    item.className = 'event-item';
    item.style.opacity = '0';
    item.style.transform = 'translateY(-10px)';
    item.innerHTML = `<span class="event-dot dot-${evt.type}"></span><span class="event-title">${evt.text}</span>${getConfHTML()}<span class="event-time">just now</span><div class="event-popup"><p>Classified based on frequency pattern + location context + time of day.</p></div>`;

    feed.insertBefore(item, feed.firstChild);
    requestAnimationFrame(() => {
      item.style.transition = 'all 0.3s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });

    // Keep max 5 items
    while (feed.children.length > 5) {
      feed.removeChild(feed.lastChild);
    }
  }, 4000);
}

export function updateForecastChartData(newValue) {
  if (forecastChart) {
    if (Array.isArray(newValue)) {
      forecastChart.data.datasets[0].data = newValue;
    } else {
      // Update the 'Now' value (index 0)
      forecastChart.data.datasets[0].data[0] = newValue;
    }
    forecastChart.update();
  }
}

function initDonutChart() {
  const container = document.getElementById('source-donut-chart');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  const data = {
    labels: ['Traffic', 'Construction', 'Speech/Crowds', 'Emergency', 'Nature'],
    datasets: [{
      data: [45, 20, 20, 5, 10],
      backgroundColor: ['#f43f5e', '#f59e0b', '#00e8ff', '#8b5cf6', '#10b981'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  donutChart = new Chart(canvas, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#aaa', font: { size: 10, family: 'Inter' }, boxWidth: 10 }
        },
        tooltip: {
          backgroundColor: 'rgba(10,10,15,0.95)',
          titleColor: '#eee',
          bodyColor: '#ccc',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              return `${context.label}: ${val}%`;
            },
            afterLabel: function(context) {
              const zones = {
                'Traffic': ['Silk Board', 'MG Road', 'Hebbal'],
                'Construction': ['Whitefield', 'Marathahalli', 'Bellandur'],
                'Speech/Crowds': ['Indiranagar', 'Koramangala', 'Majestic'],
                'Emergency': ['Victoria Hosp', 'Manipal Hosp', 'Bowring'],
                'Nature': ['Cubbon Park', 'Lalbagh', 'Sankey Tank']
              };
              const topZones = zones[context.label] || [];
              return `\nTop Zones:\n1. ${topZones[0]}\n2. ${topZones[1]}\n3. ${topZones[2]}`;
            }
          }
        }
      }
    }
  });

  const toggle = document.getElementById('donut-time-toggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        donutChart.data.datasets[0].data = [40, 25, 15, 8, 12];
      } else {
        donutChart.data.datasets[0].data = [45, 20, 20, 5, 10];
      }
      donutChart.update();
    });
  }

  // Simulate real-time updates
  setInterval(() => {
    if (toggle && toggle.checked) return; // Don't jiggle if showing yesterday
    const currentData = donutChart.data.datasets[0].data;
    const newData = currentData.map(v => Math.max(1, v + (Math.random() * 4 - 2)));
    const sum = newData.reduce((a, b) => a + b, 0);
    donutChart.data.datasets[0].data = newData.map(v => Math.round((v / sum) * 100));
    donutChart.update();
  }, 3000);
}
