import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export async function initDemo3D() {
  const container = document.getElementById('demo-3d');
  if (!container) return;

  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0b14, 0.015);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 40, 60);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1);
  dirLight.position.set(20, 50, 20);
  scene.add(dirLight);
  const pinkLight = new THREE.PointLight(0xf43f5e, 2, 50);
  pinkLight.position.set(-20, 10, -20);
  scene.add(pinkLight);

  // Grid / City Map Base
  const gridHelper = new THREE.GridHelper(100, 50, 0x38bdf8, 0x1e293b);
  gridHelper.position.y = 0;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.5;
  scene.add(gridHelper);

  // Fetch Data
  let hotspots = [];
  try {
    const res = await fetch('/api/soundscape/live');
    if (res.ok) {
      const data = await res.json();
      hotspots = data.hotspots;
    }
  } catch(e) {
    console.error('Failed to fetch 3D demo data', e);
  }

  // If no data, provide fallbacks for the demo
  if (hotspots.length === 0) {
    hotspots = [
      { name: 'MG Road', lat: 12.9756, lng: 77.6064, db: 84 },
      { name: 'Hospital', lat: 12.9800, lng: 77.6100, db: 60 },
      { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, db: 74 }
    ];
  }

  // Map coordinates to 3D space (-40 to 40)
  const latMin = 12.8, latMax = 13.2;
  const lngMin = 77.4, lngMax = 77.8;

  const pillars = {};
  const materialNormal = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, emissive: 0x0284c7, emissiveIntensity: 0.5 });
  const materialHigh = new THREE.MeshStandardMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.9, emissive: 0xe11d48, emissiveIntensity: 0.8 });

  hotspots.forEach(hs => {
    const x = ((hs.lng - lngMin) / (lngMax - lngMin)) * 80 - 40;
    const z = -(((hs.lat - latMin) / (latMax - latMin)) * 80 - 40);
    
    const height = Math.max(1, (hs.db - 30) / 4);
    const geometry = new THREE.CylinderGeometry(0.8, 0.8, height, 16);
    // Translate geometry so it scales from bottom
    geometry.translate(0, height / 2, 0);
    
    const mesh = new THREE.Mesh(geometry, hs.db > 75 ? materialHigh : materialNormal);
    mesh.position.set(x, 0, z);
    scene.add(mesh);

    pillars[hs.name] = { mesh, baseHeight: height, origMaterial: mesh.material };
  });

  // Setup special scenario objects (hidden initially)
  const mgRoad = pillars['MG Road'] || Object.values(pillars)[0];
  const hospitalNode = pillars['Hospital'] || Object.values(pillars)[1] || mgRoad;

  // Concert Ring (T+0)
  const ringGeo = new THREE.RingGeometry(2, 2.5, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(mgRoad.mesh.position);
  ring.position.y = 0.5;
  scene.add(ring);

  // Traffic Particles (T+8)
  const particleCount = 40;
  const trafficGeo = new THREE.BufferGeometry();
  const trafficPos = new Float32Array(particleCount * 3);
  for(let i=0; i<particleCount*3; i++) trafficPos[i] = (Math.random() - 0.5) * 30;
  trafficGeo.setAttribute('position', new THREE.BufferAttribute(trafficPos, 3));
  const trafficMat = new THREE.PointsMaterial({ color: 0xf43f5e, size: 0.8, transparent: true, opacity: 0 });
  const trafficParticles = new THREE.Points(trafficGeo, trafficMat);
  trafficParticles.position.copy(mgRoad.mesh.position);
  scene.add(trafficParticles);

  // Prediction Dome (T+14)
  const domeGeo = new THREE.SphereGeometry(15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0, wireframe: true });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.copy(mgRoad.mesh.position);
  scene.add(dome);

  // Shield (T+15)
  const shieldGeo = new THREE.CylinderGeometry(4, 4, 10, 32, 1, true, 0, Math.PI);
  const shieldMat = new THREE.MeshStandardMaterial({ color: 0x10b981, transparent: true, opacity: 0, emissive: 0x10b981, emissiveIntensity: 1, side: THREE.DoubleSide });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.copy(hospitalNode.mesh.position);
  shield.lookAt(mgRoad.mesh.position);
  scene.add(shield);

  // Render loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    
    // Rotate traffic
    trafficParticles.rotation.y = elapsed * 0.2;
    
    // Pulse ring
    if (ring.material.opacity > 0) {
      ring.scale.setScalar(1 + (elapsed % 1) * 2);
      ring.material.opacity = 1 - (elapsed % 1);
    }

    renderer.render(scene, camera);
  }
  animate();

  // GSAP ScrollTrigger Sequence
  const steps = document.querySelectorAll('.timeline-step');
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#demo-timeline',
      start: 'top 60%',
      end: 'bottom 40%',
      scrub: 1,
      onUpdate: (self) => {
        // Sync timeline active class
        const progress = self.progress;
        const activeIndex = Math.min(Math.floor(progress * 6), 5);
        steps.forEach((s, i) => {
          if (i === activeIndex) s.classList.add('active');
          else s.classList.remove('active');
        });
      }
    }
  });

  // 0 -> 1: Concert Begins
  tl.to(mgRoad.mesh.scale, { y: 1.8, duration: 1 }, 0);
  tl.to(mgRoad.mesh.material.color, { r: 1, g: 0.2, b: 0, duration: 1 }, 0);
  tl.to(ring.material, { opacity: 0.8, duration: 0.2 }, 0);

  // 1 -> 2: Traffic Surge
  tl.to(trafficMat, { opacity: 1, duration: 1 }, 1);
  tl.to(mgRoad.mesh.scale, { y: 2.2, duration: 1 }, 1);

  // 2 -> 3: Vulnerability
  tl.to(hospitalNode.mesh.scale, { y: 1.5, duration: 1 }, 2);
  tl.to(hospitalNode.mesh.material.color, { r: 1, g: 0.5, b: 0, duration: 1 }, 2);

  // 3 -> 4: Prediction
  tl.to(dome.material, { opacity: 0.3, duration: 1 }, 3);

  // 4 -> 5: Interventions
  tl.to(shield.material, { opacity: 0.6, duration: 1 }, 4);
  tl.to(trafficMat, { opacity: 0.2, duration: 1 }, 4);
  tl.to(dome.material, { opacity: 0, duration: 1 }, 4);

  // 5 -> 6: Outcome
  tl.to(mgRoad.mesh.scale, { y: 1, duration: 1 }, 5);
  tl.to(mgRoad.mesh.material.color, { r: 0.2, g: 0.7, b: 0.9, duration: 1 }, 5);
  tl.to(hospitalNode.mesh.scale, { y: 1, duration: 1 }, 5);
  tl.to(hospitalNode.mesh.material.color, { r: 0.2, g: 0.7, b: 0.9, duration: 1 }, 5);
  tl.to(ring.material, { opacity: 0, duration: 0.5 }, 5);
  tl.to(shield.material, { opacity: 0, duration: 1 }, 5);
}
