export function initDashboard() {
  const grid = document.getElementById('calendar-heatmap');
  const btnExport = document.getElementById('btn-export-report');
  
  if (!grid || !btnExport) return;

  // 91 days = 13 weeks
  const numDays = 91;
  const today = new Date();

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    // Generate random intensity score (0 to 100)
    const dayOfWeek = d.getDay();
    let baseNoise = 50;
    if (dayOfWeek === 0 || dayOfWeek === 6) baseNoise += 20; // Weekends
    
    const noiseLevel = Math.min(100, Math.max(0, baseNoise + (Math.random() * 40 - 20)));
    
    const cell = document.createElement('div');
    cell.className = 'dcc-cell';
    
    // Map noiseLevel to an opacity of red
    const opacity = (noiseLevel / 100) * 0.8 + 0.1; 
    cell.style.background = `rgba(255, 80, 80, ${opacity})`;
    
    // Format date string for tooltip
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dbValue = Math.round(noiseLevel * 0.4 + 50); // Scale to realistic dB range (50-90)
    
    cell.setAttribute('data-info', `${dateStr}: ${dbValue} dB`);
    cell.title = `${dateStr}: ${dbValue} dB`;
    
    grid.appendChild(cell);
  }

  // Export button logic
  btnExport.addEventListener('click', () => {
    const originalText = btnExport.innerHTML;
    btnExport.innerHTML = '<span>⏳ Generating PDF...</span>';
    btnExport.disabled = true;
    
    setTimeout(() => {
      btnExport.innerHTML = '<span>✅ Report Exported</span>';
      btnExport.style.background = 'rgba(0, 255, 127, 0.2)';
      btnExport.style.color = '#00ff7f';
      btnExport.style.borderColor = '#00ff7f';
      
      setTimeout(() => {
        btnExport.innerHTML = originalText;
        btnExport.style = '';
        btnExport.disabled = false;
        alert('Simulated Download Started: Bangalore_Acoustic_Compliance_Report.pdf');
      }, 2000);
      
    }, 1500);
  });
}
