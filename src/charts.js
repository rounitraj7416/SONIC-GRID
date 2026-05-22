import Chart from 'chart.js/auto';

let forecastChart;

export function initCharts() {
  initForecastChart();
  initEventFeed();
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

function initEventFeed() {
  const feed = document.getElementById('event-feed');
  if (!feed) return;

  setInterval(() => {
    const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const item = document.createElement('div');
    item.className = 'event-item';
    item.style.opacity = '0';
    item.style.transform = 'translateY(-10px)';
    item.innerHTML = `<span class="event-dot dot-${evt.type}"></span><span>${evt.text}</span><span class="event-time">just now</span>`;

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
