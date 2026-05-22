import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = 3001;

app.use(cors());

// Serve static files from dist if available (for production build)
app.use(express.static(path.join(__dirname, 'dist')));

// --- Data Models ---

const VULN_ZONES = [
  { id: 'v1', name: 'Bowring Hospital', lat: 12.9850, lng: 77.6050, type: 'hospital' },
  { id: 'v2', name: 'Victoria Hospital', lat: 12.9575, lng: 77.5738, type: 'hospital' },
  { id: 'v3', name: 'St. John\'s Hospital', lat: 12.9280, lng: 77.6210, type: 'hospital' },
  { id: 'v4', name: 'Manipal Hospital', lat: 12.9615, lng: 77.6470, type: 'hospital' },
  { id: 'v5', name: 'NIMHANS', lat: 12.9423, lng: 77.5960, type: 'hospital' },
  { id: 's1', name: 'Bishop Cotton School', lat: 12.9680, lng: 77.5990, type: 'school' },
  { id: 's2', name: 'National Public School', lat: 12.9380, lng: 77.6170, type: 'school' },
  { id: 's3', name: 'DPS Whitefield', lat: 12.9750, lng: 77.7350, type: 'school' },
];

const NEIGHBORHOODS = [
  {
    name: 'Yelahanka New Town', lat: 13.1007, lng: 77.5963, avgDb: 38,
    budget: ['affordable','mid'], commuteMin: { central: 45, whitefield: 55, ecity: 70, manyata: 15, outer: 35 },
    tags: ['quiet','parks','schools'], desc: 'Peaceful suburb near the air force station with wide roads and parks.',
    price: 65, quietScore: 96, greenScore: 92, safetyScore: 88,
    highlights: ['Yelahanka Lake','Low traffic density','Air Force proximity keeps area regulated']
  },
  {
    name: 'RR Nagar (Rajarajeshwari Nagar)', lat: 12.9260, lng: 77.5190, avgDb: 41,
    budget: ['affordable','mid'], commuteMin: { central: 35, whitefield: 65, ecity: 45, manyata: 55, outer: 40 },
    tags: ['quiet','schools','market','hospital'], desc: 'Well-planned residential area with good amenities and low noise.',
    price: 55, quietScore: 93, greenScore: 78, safetyScore: 90,
    highlights: ['NICE Road connectivity','Multiple hospitals','Growing infrastructure']
  },
  {
    name: 'JP Nagar (Phases 7-9)', lat: 12.8950, lng: 77.5857, avgDb: 42,
    budget: ['mid','premium'], commuteMin: { central: 30, whitefield: 50, ecity: 25, manyata: 55, outer: 35 },
    tags: ['quiet','parks','schools','hospital','market'], desc: 'Established residential area with mature trees, parks, and excellent amenities.',
    price: 120, quietScore: 91, greenScore: 88, safetyScore: 94,
    highlights: ['Bannerghatta Road access','JP Nagar 6th Phase Park','Well-established schools']
  },
  {
    name: 'Kengeri', lat: 12.9130, lng: 77.4870, avgDb: 36,
    budget: ['affordable'], commuteMin: { central: 40, whitefield: 70, ecity: 50, manyata: 60, outer: 45 },
    tags: ['quiet','parks'], desc: 'Rapidly developing suburb with some of the lowest noise levels in Bangalore.',
    price: 42, quietScore: 98, greenScore: 85, safetyScore: 82,
    highlights: ['Near NICE Road','Surrounded by greenery','Upcoming metro connectivity']
  },
  {
    name: 'Banashankari 6th Stage', lat: 12.9100, lng: 77.5468, avgDb: 43,
    budget: ['affordable','mid'], commuteMin: { central: 30, whitefield: 55, ecity: 35, manyata: 50, outer: 35 },
    tags: ['quiet','schools','market','transit'], desc: 'Peaceful extension of Banashankari with good connectivity and local markets.',
    price: 65, quietScore: 90, greenScore: 75, safetyScore: 91,
    highlights: ['Turahalli Forest nearby','Temple town vibes','Good bus connectivity']
  },
  {
    name: 'Vidyaranyapura', lat: 13.0700, lng: 77.5530, avgDb: 39,
    budget: ['affordable','mid'], commuteMin: { central: 40, whitefield: 60, ecity: 65, manyata: 20, outer: 40 },
    tags: ['quiet','parks','schools'], desc: 'Quiet residential area near IISc with academic serenity and green cover.',
    price: 70, quietScore: 95, greenScore: 90, safetyScore: 89,
    highlights: ['Near IISc campus','BEL factory buffer zone','Amruthahalli Lake']
  },
  {
    name: 'HSR Layout (Sector 7)', lat: 12.9080, lng: 77.6500, avgDb: 46,
    budget: ['mid','premium'], commuteMin: { central: 25, whitefield: 35, ecity: 20, manyata: 45, outer: 15 },
    tags: ['parks','transit','market','schools'], desc: 'Modern planned layout with excellent ORR access. Startup hub with good parks.',
    price: 135, quietScore: 82, greenScore: 80, safetyScore: 92,
    highlights: ['Agara Lake walking distance','ORR connectivity','Vibrant food scene']
  },
  {
    name: 'Uttarahalli', lat: 12.8980, lng: 77.5420, avgDb: 40,
    budget: ['affordable','mid'], commuteMin: { central: 35, whitefield: 60, ecity: 35, manyata: 55, outer: 40 },
    tags: ['quiet','parks','schools'], desc: 'Serene residential locality with Uttarahalli Lake and low traffic noise.',
    price: 52, quietScore: 94, greenScore: 87, safetyScore: 86,
    highlights: ['Uttarahalli Lake','Low commercial activity','Affordable yet quiet']
  },
  {
    name: 'Devanahalli', lat: 13.2468, lng: 77.7100, avgDb: 35,
    budget: ['affordable','mid'], commuteMin: { central: 60, whitefield: 50, ecity: 80, manyata: 30, outer: 55 },
    tags: ['quiet','parks'], desc: 'Near the airport with upcoming smart city development. Exceptionally quiet.',
    price: 48, quietScore: 99, greenScore: 94, safetyScore: 80,
    highlights: ['Airport proximity','Planned smart city','Vast open spaces']
  },
  {
    name: 'Sarjapur Road (Beyond Wipro)', lat: 12.8700, lng: 77.6800, avgDb: 44,
    budget: ['mid','premium','luxury'], commuteMin: { central: 40, whitefield: 20, ecity: 15, manyata: 55, outer: 20 },
    tags: ['quiet','schools','parks','hospital'], desc: 'Premium gated community corridor with excellent IT corridor access.',
    price: 190, quietScore: 88, greenScore: 82, safetyScore: 95,
    highlights: ['Multiple gated communities','International schools','ORR access']
  },
  {
    name: 'Hennur Road', lat: 13.0300, lng: 77.6400, avgDb: 45,
    budget: ['mid','premium'], commuteMin: { central: 30, whitefield: 35, ecity: 55, manyata: 10, outer: 25 },
    tags: ['parks','transit','hospital'], desc: 'Green corridor near Manyata with multiple lakes and improving infrastructure.',
    price: 105, quietScore: 86, greenScore: 88, safetyScore: 87,
    highlights: ['Hennur Lake','Manyata Tech Park nearby','Upcoming metro line']
  },
  {
    name: 'Whitefield (Varthur Side)', lat: 12.9500, lng: 77.7600, avgDb: 47,
    budget: ['mid','premium','luxury'], commuteMin: { central: 50, whitefield: 5, ecity: 30, manyata: 40, outer: 20 },
    tags: ['schools','hospital','market'], desc: 'IT hub outskirts with premium apartments and excellent schools.',
    price: 160, quietScore: 80, greenScore: 70, safetyScore: 93,
    highlights: ['ITPL walking distance','International schools','Phoenix Mall access']
  },
  {
    name: 'Koramangala', lat: 12.9352, lng: 77.6245, avgDb: 72,
    budget: ['premium','luxury'], commuteMin: { central: 20, whitefield: 45, ecity: 25, manyata: 50, outer: 15 },
    tags: ['market','hospital','parks'], desc: 'Vibrant commercial and residential hub with high activity and nightlife.',
    price: 250, quietScore: 35, greenScore: 85, safetyScore: 88,
    highlights: ['Cafes & Restaurants','Startup Hub','Central Location']
  },
  {
    name: 'Indiranagar', lat: 12.9784, lng: 77.6408, avgDb: 74,
    budget: ['premium','luxury'], commuteMin: { central: 15, whitefield: 35, ecity: 45, manyata: 35, outer: 20 },
    tags: ['market','transit'], desc: 'Premium neighborhood known for dining, shopping, and high energy.',
    price: 350, quietScore: 30, greenScore: 75, safetyScore: 90,
    highlights: ['Metro Connectivity','100ft Road Shopping','High Vibrancy']
  }
];

let hotspots = [
  { id: 1, name: 'Majestic / KSR Station', lat: 12.9767, lng: 77.5713, db: 89, level: 'high', type: 'Traffic + Transit Hub' },
  { id: 2, name: 'Silk Board Junction', lat: 12.9177, lng: 77.6238, db: 86, level: 'high', type: 'Traffic Congestion' },
  { id: 3, name: 'MG Road', lat: 12.9756, lng: 77.6064, db: 84, level: 'high', type: 'Nightlife + Traffic' },
  { id: 4, name: 'KR Market', lat: 12.9631, lng: 77.5775, db: 82, level: 'high', type: 'Market + Traffic' },
  { id: 5, name: 'Koramangala', lat: 12.9352, lng: 77.6245, db: 72, level: 'medium', type: 'Commercial Area' },
  { id: 6, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, db: 74, level: 'medium', type: 'Nightlife District' },
  { id: 7, name: 'Whitefield', lat: 12.9698, lng: 77.7500, db: 68, level: 'medium', type: 'IT Corridor + Construction' },
  { id: 8, name: 'Marathahalli', lat: 12.9591, lng: 77.7009, db: 71, level: 'medium', type: 'Traffic + Commercial' },
  { id: 9, name: 'BTM Layout', lat: 12.9166, lng: 77.6101, db: 65, level: 'medium', type: 'Residential + Traffic' },
  { id: 10, name: 'Hebbal Flyover', lat: 13.0358, lng: 77.5970, db: 73, level: 'medium', type: 'Highway Traffic' },
  { id: 11, name: 'Yeshwanthpur', lat: 13.0220, lng: 77.5440, db: 70, level: 'medium', type: 'Railway + Market' },
  { id: 12, name: 'Jayanagar', lat: 12.9299, lng: 77.5838, db: 45, level: 'low', type: 'Residential' },
  { id: 13, name: 'Rajajinagar', lat: 12.9900, lng: 77.5530, db: 52, level: 'low', type: 'Mixed Residential' },
  { id: 14, name: 'Electronic City', lat: 12.8456, lng: 77.6603, db: 48, level: 'low', type: 'IT Park' },
  { id: 15, name: 'Banashankari', lat: 12.9255, lng: 77.5468, db: 50, level: 'low', type: 'Residential' },
  { id: 16, name: 'JP Nagar', lat: 12.9063, lng: 77.5857, db: 47, level: 'low', type: 'Residential' },
  { id: 17, name: 'Yelahanka', lat: 13.1005, lng: 77.5963, db: 44, level: 'low', type: 'Suburb' },
  { id: 18, name: 'HSR Layout', lat: 12.9116, lng: 77.6474, db: 55, level: 'low', type: 'Residential + Startups' }
];

// Add Planner Neighborhoods into hotspots for continuous simulation
let nextId = 19;
NEIGHBORHOODS.forEach(n => {
  if (!hotspots.find(h => h.name === n.name)) {
    hotspots.push({
      id: nextId++,
      name: n.name,
      lat: n.lat,
      lng: n.lng,
      db: n.avgDb,
      baseDb: n.avgDb,
      level: n.avgDb > 65 ? 'medium' : 'low',
      type: 'Residential'
    });
  }
});

let realEstatePrices = {};
NEIGHBORHOODS.forEach(n => {
  realEstatePrices[n.name] = n.price;
});


// Advanced AI Forecast Simulation using Sine Waves and Jitter
let timeStep = 0;
setInterval(() => {
  timeStep += 0.1;
  
  // Acoustic Jitter with Trend
  hotspots = hotspots.map(hs => {
    if (!hs.baseDb) hs.baseDb = hs.db;
    
    // Simulate traffic waves using sine function
    const trafficWave = Math.sin(timeStep + hs.id) * 3;
    const noiseSpike = (Math.random() > 0.95) ? 8 : 0; // occasional spikes
    const jitter = (Math.random() - 0.5) * 4; 
    
    let newDb = Math.round(hs.baseDb + trafficWave + noiseSpike + jitter);
    newDb = Math.max(35, Math.min(105, newDb));
    
    let newLevel = 'low';
    if (newDb >= 80) newLevel = 'high';
    else if (newDb >= 65) newLevel = 'medium';
    
    return { ...hs, db: newDb, level: newLevel };
  });

  // Real Estate Price Jitter (Market fluctuation)
  if (!global.basePrices) global.basePrices = { ...realEstatePrices };
  for (let neighborhood in realEstatePrices) {
    const priceTrend = Math.sin(timeStep * 0.5) * 2; // slow trend
    const priceJitter = (Math.random() - 0.5) * 2;
    let newPrice = global.basePrices[neighborhood] + priceTrend + priceJitter;
    newPrice = Math.max(newPrice, 20); 
    realEstatePrices[neighborhood] = newPrice;
  }

  const avgDb = Math.round(hotspots.reduce((sum, hs) => sum + hs.db, 0) / hotspots.length);
  let hottest = hotspots[0];
  let quietest = hotspots[0];
  
  hotspots.forEach(hs => {
    if (hs.db > hottest.db) hottest = hs;
    if (hs.db < quietest.db) quietest = hs;
  });

  const soundscapePayload = {
    timestamp: new Date().toISOString(),
    metrics: {
      cityAverage: avgDb,
      hottestZone: { name: hottest.name, db: hottest.db },
      quietestZone: { name: quietest.name, db: quietest.db },
      activeSensors: 342 + Math.floor(Math.random() * 5 - 2)
    },
    hotspots
  };

  // Format the prices nicely
  const formattedPrices = {};
  for (let neighborhood in realEstatePrices) {
    const price = realEstatePrices[neighborhood];
    if (price >= 100) {
      formattedPrices[neighborhood] = `₹${(price / 100).toFixed(2)}Cr`;
    } else {
      formattedPrices[neighborhood] = `₹${price.toFixed(1)}L`;
    }
  }

  const realestatePayload = {
    timestamp: new Date().toISOString(),
    prices: formattedPrices,
    rawPricesLakhs: realEstatePrices
  };

  // Emit WebSocket events
  io.emit('soundscape_update', soundscapePayload);
  io.emit('realestate_update', realestatePayload);

}, 2000); // 2 second updates for real-time feel

// Initial Data API
app.get('/api/init', (req, res) => {
  res.json({
    neighborhoods: NEIGHBORHOODS,
    vulnZones: VULN_ZONES,
    initialHotspots: hotspots
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current state immediately upon connection
  const avgDb = Math.round(hotspots.reduce((sum, hs) => sum + hs.db, 0) / hotspots.length);
  let hottest = hotspots[0];
  let quietest = hotspots[0];
  hotspots.forEach(hs => {
    if (hs.db > hottest.db) hottest = hs;
    if (hs.db < quietest.db) quietest = hs;
  });
  
  socket.emit('soundscape_update', {
    timestamp: new Date().toISOString(),
    metrics: { cityAverage: avgDb, hottestZone: { name: hottest.name, db: hottest.db }, quietestZone: { name: quietest.name, db: quietest.db }, activeSensors: 342 },
    hotspots
  });
  
  const formattedPrices = {};
  for (let neighborhood in realEstatePrices) {
    const price = realEstatePrices[neighborhood];
    formattedPrices[neighborhood] = price >= 100 ? `₹${(price / 100).toFixed(2)}Cr` : `₹${price.toFixed(1)}L`;
  }
  socket.emit('realestate_update', { 
    timestamp: new Date().toISOString(),
    prices: formattedPrices, 
    rawPricesLakhs: realEstatePrices 
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Backward compatibility REST endpoints
app.get('/api/soundscape/live', (req, res) => {
  const avgDb = Math.round(hotspots.reduce((sum, hs) => sum + hs.db, 0) / hotspots.length);
  let hottest = hotspots[0];
  let quietest = hotspots[0];
  hotspots.forEach(hs => {
    if (hs.db > hottest.db) hottest = hs;
    if (hs.db < quietest.db) quietest = hs;
  });
  res.json({
    timestamp: new Date().toISOString(),
    metrics: { cityAverage: avgDb, hottestZone: { name: hottest.name, db: hottest.db }, quietestZone: { name: quietest.name, db: quietest.db }, activeSensors: 342 },
    hotspots
  });
});

app.get('/api/realestate/trending', (req, res) => {
  const formattedPrices = {};
  for (let neighborhood in realEstatePrices) {
    const price = realEstatePrices[neighborhood];
    if (price >= 100) {
      formattedPrices[neighborhood] = `₹${(price / 100).toFixed(2)}Cr`;
    } else {
      formattedPrices[neighborhood] = `₹${price.toFixed(1)}L`;
    }
  }
  res.json({
    timestamp: new Date().toISOString(),
    prices: formattedPrices,
    rawPricesLakhs: realEstatePrices
  });
});

// Fallback to index.html for SPA if not an API route
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Backend server with WebSockets running on http://localhost:${PORT}`);
});
