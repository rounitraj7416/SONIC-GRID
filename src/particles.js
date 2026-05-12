import * as THREE from 'three';

export function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particles
  const count = 1500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const cyan = new THREE.Color(0x00e8ff);
  const violet = new THREE.Color(0x8b5cf6);

  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    const c = Math.random() > 0.5 ? cyan : violet;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    sizes[i] = Math.random() * 3 + 1;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Connecting lines for nearby particles
  const lineGeo = new THREE.BufferGeometry();
  const lineCount = 200;
  const linePositions = new Float32Array(lineCount * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x00e8ff, transparent: true, opacity: 0.08 });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  camera.position.z = 8;

  let mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;

    // Rotate particles
    points.rotation.y = time * 0.05 + mouse.x * 0.1;
    points.rotation.x = mouse.y * 0.05;

    // Wave effect
    const positions = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      positions[ix + 1] += Math.sin(time + positions[ix] * 0.5) * 0.002;
    }
    geo.attributes.position.needsUpdate = true;

    // Update connecting lines
    let lineIdx = 0;
    const lp = lineGeo.attributes.position.array;
    for (let i = 0; i < count && lineIdx < lineCount; i++) {
      for (let j = i + 1; j < count && lineIdx < lineCount; j++) {
        const dx = positions[i*3] - positions[j*3];
        const dy = positions[i*3+1] - positions[j*3+1];
        const dz = positions[i*3+2] - positions[j*3+2];
        const dist = dx*dx + dy*dy + dz*dz;
        if (dist < 1.5) {
          lp[lineIdx*6] = positions[i*3];
          lp[lineIdx*6+1] = positions[i*3+1];
          lp[lineIdx*6+2] = positions[i*3+2];
          lp[lineIdx*6+3] = positions[j*3];
          lp[lineIdx*6+4] = positions[j*3+1];
          lp[lineIdx*6+5] = positions[j*3+2];
          lineIdx++;
        }
      }
    }
    // Clear remaining
    for (let i = lineIdx; i < lineCount; i++) {
      lp[i*6] = lp[i*6+1] = lp[i*6+2] = lp[i*6+3] = lp[i*6+4] = lp[i*6+5] = 0;
    }
    lineGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();
}
