import { addCitizenReport } from './heatmap.js';

export function initReporter() {
  const fab = document.getElementById('fab-report');
  const modal = document.getElementById('report-modal');
  const closeBtn = document.getElementById('report-close');
  
  if (!fab || !modal) return;

  const step1 = document.getElementById('report-step-1');
  const step2 = document.getElementById('report-step-2');
  const step3 = document.getElementById('report-step-3');
  
  const pulse = document.getElementById('location-pulse');
  const locResult = document.getElementById('location-result');
  const btnConfirmLoc = document.getElementById('btn-confirm-location');
  const sourceBtns = document.querySelectorAll('.btn-source');
  const btnCloseReport = document.getElementById('btn-close-report');
  
  let simulatedLocation = null;
  let simulatedDb = 0;

  const neighborhoodData = [
    { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
    { name: 'RR Nagar', lat: 12.9260, lng: 77.5190 },
    { name: 'JP Nagar', lat: 12.8950, lng: 77.5857 },
    { name: 'Kengeri', lat: 12.9130, lng: 77.4870 },
    { name: 'Banashankari', lat: 12.9100, lng: 77.5468 },
    { name: 'Vidyaranyapura', lat: 13.0700, lng: 77.5530 },
    { name: 'HSR Layout', lat: 12.9080, lng: 77.6500 },
    { name: 'Uttarahalli', lat: 12.8980, lng: 77.5420 },
    { name: 'Devanahalli', lat: 13.2468, lng: 77.7100 },
    { name: 'Sarjapur Road', lat: 12.8700, lng: 77.6800 },
    { name: 'Hennur Road', lat: 13.0300, lng: 77.6400 },
    { name: 'Whitefield', lat: 12.9500, lng: 77.7600 },
    { name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
    { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
    { name: 'Malleshwaram', lat: 13.0031, lng: 77.5643 },
    { name: 'Electronic City', lat: 12.8452, lng: 77.6602 },
    { name: 'Bellandur', lat: 12.9304, lng: 77.6784 },
    { name: 'Current Location', lat: 0, lng: 0 } // Fallback for very far locations
  ];

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a));
  }

  function getNearestNeighborhood(lat, lng) {
    let nearest = neighborhoodData[0];
    let minDist = calculateDistance(lat, lng, nearest.lat, nearest.lng);
    
    for (let i = 1; i < neighborhoodData.length - 1; i++) { // Skip 'Current Location'
      const dist = calculateDistance(lat, lng, neighborhoodData[i].lat, neighborhoodData[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = neighborhoodData[i];
      }
    }
    
    // If the user is more than 50km away from any Bangalore neighborhood, just say "Current Location"
    if (minDist > 50) return "Your Current Location";
    
    return nearest.name;
  }

  function resetModal() {
    step1.style.display = 'block';
    step2.style.display = 'none';
    step3.style.display = 'none';
    
    pulse.style.display = 'block';
    locResult.style.display = 'none';
    btnConfirmLoc.disabled = true;
    
    sourceBtns.forEach(btn => btn.classList.remove('active'));
    simulatedLocation = null;
  }

  function simulateLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const neighborhood = getNearestNeighborhood(lat, lng);
          
          simulatedLocation = { lat, lng, name: neighborhood };
          simulatedDb = Math.floor(Math.random() * 30) + 60; // 60 to 90 dB

          pulse.style.display = 'none';
          locResult.textContent = `Near ${neighborhood}`;
          locResult.style.display = 'block';
          btnConfirmLoc.disabled = false;
        },
        (error) => {
          // Fallback to a stable location if denied or failed
          const fallback = neighborhoodData.find(n => n.name === 'Koramangala');
          simulatedLocation = { lat: fallback.lat, lng: fallback.lng, name: fallback.name };
          simulatedDb = 72;

          pulse.style.display = 'none';
          locResult.textContent = `Near ${fallback.name} (Fallback)`;
          locResult.style.display = 'block';
          btnConfirmLoc.disabled = false;
        }
      );
    } else {
      const fallback = neighborhoodData.find(n => n.name === 'Koramangala');
      simulatedLocation = { lat: fallback.lat, lng: fallback.lng, name: fallback.name };
      simulatedDb = 72;

      pulse.style.display = 'none';
      locResult.textContent = `Near ${fallback.name}`;
      locResult.style.display = 'block';
      btnConfirmLoc.disabled = false;
    }
  }

  fab.addEventListener('click', () => {
    resetModal();
    modal.classList.add('visible');
    simulateLocation();
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('visible');
  });

  btnConfirmLoc.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'block';
  });

  sourceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const source = e.target.dataset.source;
      
      // Plot on map
      if (simulatedLocation) {
        addCitizenReport(simulatedLocation.lat, simulatedLocation.lng, source, simulatedDb);
      }

      // Show confirmation
      document.getElementById('report-confirm-text').innerHTML = `Your report near <strong>${simulatedLocation.name}</strong> has been logged.<br>Current AI estimate in this zone: <strong>${simulatedDb} dB</strong>.`;
      
      step2.style.display = 'none';
      step3.style.display = 'block';
    });
  });

  btnCloseReport.addEventListener('click', () => {
    modal.classList.remove('visible');
  });
}
