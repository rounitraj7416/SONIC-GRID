import Chart from 'chart.js/auto';

export function initHealthScore() {
  const ctx = document.getElementById('health-sparkline');
  if (!ctx) return;

  // Mock 7-day trend data (e.g. city was louder on weekend, quieter now)
  const dataPoints = [45, 52, 68, 74, 65, 58, 61]; 
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: dataPoints,
        borderColor: '#ffd700', // Yellow to match 'Moderate'
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0, // hide points
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.0)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
          return gradient;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.parsed.y} / 100`
          }
        }
      },
      scales: {
        x: { display: false },
        y: { 
          display: false,
          min: 0,
          max: 100
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      }
    }
  });
}
