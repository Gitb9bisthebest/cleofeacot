// Three.js particle network — nodes drifting, linking when close.
// A visual metaphor for prospecting: scattered contacts becoming connections.
// Reused at different densities: full-size in the hero, subtle in section accents.
import * as THREE from 'three';

const PALETTE = {
  accent: '#d6336c',
  ink: '#4a3242',
};

export function createNetwork(canvas, opts = {}) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  const {
    count = isMobile ? 45 : 90,
    range = 26,
    linkDist = isMobile ? 5.5 : 6.5,
    pointSize = isMobile ? 0.16 : 0.18,
    lineOpacity = 0.16,
    nodeOpacity = 0.85,
    accentRatio = 0.22,
    parallax = true,
  } = opts;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 22;

  const MAX_LINKS = count * 4;
  const accent = new THREE.Color(PALETTE.accent);
  const ink = new THREE.Color(PALETTE.ink);

  // Nodes
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * range;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    velocities[i * 3] = (Math.random() - 0.5) * 0.014;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.014;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
    const c = Math.random() < accentRatio ? accent : ink;
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const nodeMat = new THREE.PointsMaterial({
    size: pointSize,
    vertexColors: true,
    transparent: true,
    opacity: nodeOpacity,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const points = new THREE.Points(nodeGeo, nodeMat);
  scene.add(points);

  // Lines
  const linePositions = new Float32Array(MAX_LINKS * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: ink,
    transparent: true,
    opacity: lineOpacity,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lines);

  // Mouse parallax (hero only)
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (parallax) {
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let raf = 0;
  let running = true;

  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);

    const pos = nodeGeo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      pos[ix] += velocities[ix];
      pos[ix + 1] += velocities[ix + 1];
      pos[ix + 2] += velocities[ix + 2];
      if (Math.abs(pos[ix]) > range) velocities[ix] *= -1;
      if (Math.abs(pos[ix + 1]) > range * 0.6) velocities[ix + 1] *= -1;
      if (Math.abs(pos[ix + 2]) > 6) velocities[ix + 2] *= -1;
    }
    nodeGeo.attributes.position.needsUpdate = true;

    // Rebuild link segments
    let linkCount = 0;
    const lp = lineGeo.attributes.position.array;
    for (let i = 0; i < count && linkCount < MAX_LINKS; i++) {
      for (let j = i + 1; j < count && linkCount < MAX_LINKS; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < linkDist * linkDist) {
          const o = linkCount * 6;
          lp[o] = pos[i * 3]; lp[o + 1] = pos[i * 3 + 1]; lp[o + 2] = pos[i * 3 + 2];
          lp[o + 3] = pos[j * 3]; lp[o + 4] = pos[j * 3 + 1]; lp[o + 5] = pos[j * 3 + 2];
          linkCount++;
        }
      }
    }
    lineGeo.setDrawRange(0, linkCount * 2);
    lineGeo.attributes.position.needsUpdate = true;

    if (parallax) {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      camera.position.x = mouse.x * 2.2;
      camera.position.y = -mouse.y * 1.4;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  }

  if (prefersReduced) {
    // Render a single static frame
    renderer.render(scene, camera);
  } else {
    tick();
    // Pause when host section is offscreen
    const host = canvas.closest('section') || canvas.parentElement;
    if (host && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        const visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; tick(); }
        else if (!visible && running) { running = false; cancelAnimationFrame(raf); }
      }, { threshold: 0 }).observe(host);
    }
  }
}
