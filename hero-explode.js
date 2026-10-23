/* ============================================================
   whybit. — hero-explode.js
   Lun-E hero: the real assembly, slowly turning, that pulls
   itself apart and snaps back together on a loop.
   Plain ES module, three.js from jsDelivr (see the import map
   in index.html). The GIF stays in the markup as the fallback:
   it is only swapped out once the model has loaded.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('lune-hero');
if (host) init(host);

function init(host) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const freezeT = params.has('hero-t') ? parseFloat(params.get('hero-t')) : null; // debug: ?hero-t=3.5

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; } // no WebGL → keep the GIF
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hero-3d-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Lun-E, a tracked desktop robot, taking itself apart and putting itself back together');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const cam = new THREE.PerspectiveCamera(28, 4 / 3, 1, 2000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090a0, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-60, 140, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
  fill.position.set(120, 40, -80);
  scene.add(fill);

  const groundMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -10.62;
  ground.receiveShadow = true;
  scene.add(ground);

  // turntable: model is z-up in mm; rotate into three's y-up
  const turn = new THREE.Group();
  scene.add(turn);
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  turn.add(root);

  // OLED face — drawn to a canvas so the eyes can blink
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 512; faceCanvas.height = 256;
  const g = faceCanvas.getContext('2d');
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  function drawFace(open) {
    g.shadowBlur = 0; g.fillStyle = '#000'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#7fe3ff'; g.shadowColor = '#7fe3ff'; g.shadowBlur = 18;
    const h = Math.max(10, 130 * open), y = 58 + (130 - h) / 2;
    const r = Math.min(34, h / 2);
    g.beginPath(); g.roundRect(96, y, 112, h, r); g.fill();
    g.beginPath(); g.roundRect(304, y, 112, h, r); g.fill();
    faceTex.needsUpdate = true;
  }
  drawFace(1);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(21.7, 10.9),
    new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }));
  screen.rotation.x = Math.PI / 2;
  screen.position.set(0, -28.09, 17.7);
  root.add(screen);

  // explode vectors (mm, model coords) and a start delay so parts leave in order
  const EXPL = {
    body_lid: [[0, 0, 24], 0.00],
    oled_case_front: [[0, -30, 0], 0.05], oled_glass: [[0, -20, 0], 0.08], oled_pcb: [[0, -20, 0], 0.08], oled_case_back: [[0, -10, 0], 0.11],
    chain_R: [[14, 0, 0], 0.14], chain_L: [[-14, 0, 0], 0.14],
    sprocket_motor_R: [[26, 0, 0], 0.20], sprocket_motor_L: [[-26, 0, 0], 0.20],
    freewheel_R: [[26, 0, 0], 0.20], freewheel_L: [[-26, 0, 0], 0.20],
    bearing_625_R: [[36, 0, 0], 0.26], bearing_625_L: [[-36, 0, 0], 0.26],
  };
  const nodes = {};
  let visible = true, running = false, t0 = performance.now(), lastOpen = 1;

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(host.dataset.model || '/models/lun-e-explode.glb', (gltf) => {
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const n = o.name || (o.parent && o.parent.name);
      nodes[n] = o;
      o.userData.base = o.position.clone();
      if (o.material) o.material.side = THREE.DoubleSide;
    });
    root.add(gltf.scene);
    host.appendChild(canvas);
    host.classList.add('is-3d');
    resize();
    start();
  }, undefined, () => { /* load failed → GIF stays */ });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // pull back on tall/narrow boxes so the exploded spread still fits
    const dist = 205 * Math.max(1, 1.25 / cam.aspect);
    cam.position.set(-0.56 * dist, 0.36 * dist, 0.74 * dist);
    cam.lookAt(0, 6, 0);
    cam.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);

  function syncTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    groundMat.opacity = dark ? 0.45 : 0.18;
    renderer.toneMappingExposure = dark ? 0.92 : 1.0;
    if (!running && host.classList.contains('is-3d')) renderer.render(scene, cam);
  }
  syncTheme();
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- timeline -----------------------------------------------------------
  // 0 → 2.4 s together · 2.4 → 4.0 s apart · 4.0 → 6.6 s hold · 6.6 → 8.0 s back · loop at 9 s
  const LOOP = 9.0;
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  function explodeAt(t, delay) {
    const out = ease((t - 2.4 - delay) / 1.3);
    const back = ease((t - 6.6 - (0.26 - delay)) / 1.2); // reverse order on the way back
    return out * (1 - back);
  }
  function blinkAt(t) {
    // two blinks per loop, plus a double-blink just after it closes up
    const b = [1.2, 5.3, 8.25, 8.55];
    let open = 1;
    for (const s of b) { const d = Math.abs(t - s); if (d < 0.09) open = Math.min(open, d / 0.09); }
    return open;
  }

  function pose(t, secs) {
    for (const [n, [v, delay]] of Object.entries(EXPL)) {
      const o = nodes[n]; if (!o) continue;
      const k = explodeAt(t, delay);
      o.position.set(o.userData.base.x + v[0] * k, o.userData.base.y + v[1] * k, o.userData.base.z + v[2] * k);
    }
    screen.position.y = -28.09 - 20 * explodeAt(t, 0.08);
    // gentle back-and-forth turn instead of a full spin
    turn.rotation.y = 0.32 * Math.sin(secs * 0.35);
  }

  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const secs = (now - t0) / 1000;
    const t = secs % LOOP;
    pose(t, secs);
    const open = blinkAt(t);
    if (Math.abs(open - lastOpen) > 0.01) { drawFace(open); lastOpen = open; }
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  function start() {
    if (freezeT !== null) { pose(freezeT, 0); turn.rotation.y = 0; renderer.render(scene, cam); window.__heroReady = true; return; }
    if (reduceMotion) { pose(0, 0); turn.rotation.y = 0; renderer.render(scene, cam); window.__heroReady = true; return; }
    if (!running) { running = true; requestAnimationFrame(frame); }
    window.__heroReady = true;
  }
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && host.classList.contains('is-3d')) start(); })
    .observe(host);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && host.classList.contains('is-3d')) start(); });
}
