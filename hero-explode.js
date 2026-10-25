/* ============================================================
   whybit. — hero-explode.js
   Scroll-driven exploded views. Each <section class="lune-scroll"
   data-hero="…"> is taller than the screen and its stage is sticky
   (see .lune-scroll in styles.css). How far you have scrolled
   through the section is mapped onto the model: it spins a full
   turn, comes apart part by part, and callouts name the parts.
   Scroll back up and it rebuilds. One config per product below
   (lune = Lun-E RC, connect = the Connect controller).
   Plain ES module; three.js comes from jsDelivr via the import
   map on the page.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';


// Per-model settings. All positions are in the model's own frame: z-up, millimetres.
//   expl:   part name → [direction (mm), when it starts moving in the explode (0..1)]
//   labels: callouts. `pair` = left/right twin (the callout goes on whichever is nearer
//           the camera), `lift` raises the anchor (mm)
//   screen: the OLED face, drawn on a canvas so the eyes can blink. `rot` is an Euler
//           rotation of a plane that faces +z; `move`/`start` make it ride with the glass.
const CONFIGS = {
  lune: {
    model: '/models/lun-e-explode.glb',
    aria: 'Lun-E, a tracked desktop robot, coming apart into its parts as the page scrolls',
    fallback: ['/images/Lun-E.jpeg', 'Lun-E — a tracked desktop robot with animated oled eyes'],
    ground: -12.28,
    screen: { pos: [0, -28.09, 25.7], rot: [Math.PI / 2, 0, 0], move: [0, -23, 0], start: 0.14 },
    expl: {
      body_lid:         [[0, 0, 30], 0.00],
      usb_c:            [[0, 0, 12], 0.10],
      top_button:       [[0, 0, 12], 0.10],
      oled_case_front:  [[0, -34, 0], 0.08],
      oled_glass:       [[0, -23, 0], 0.14],
      oled_pcb:         [[0, -23, 0], 0.14],
      oled_case_back:   [[0, -12, 0], 0.20],
      chain_R:          [[16, 0, 0], 0.26], chain_L: [[-16, 0, 0], 0.26],
      sprocket_motor_R: [[32, 0, 0], 0.36], sprocket_motor_L: [[-32, 0, 0], 0.36],
      freewheel_R:      [[32, 0, 0], 0.36], freewheel_L: [[-32, 0, 0], 0.36],
      bearing_625_R:    [[46, 0, 0], 0.46], bearing_625_L: [[-46, 0, 0], 0.46],
    },
    labels: [
      { node: 'body_lid',         text: '<b>lid</b> · usb-c + button' },
      { node: 'pcb_mask',         text: '<b>esp32-c3</b> main board' },
      { node: 'oled_case_front',  text: '<b>0.96″ oled</b> · snap-fit case' },
      { node: 'chain_L',          pair: 'chain_R', lift: 12, text: '<b>8 mm chain</b> · 20 links' },
      { node: 'sprocket_motor_L', pair: 'sprocket_motor_R', text: '<b>n20 drive</b> sprocket' },
      { node: 'bearing_625_L',    pair: 'bearing_625_R', text: '<b>625-2z</b> idler bearing' },
    ],
    cam: { yaw0: -0.62, pitch: [0.32, 0.46], dist: [178, 305], look: [7, 11] },
  },
  connect: {
    model: '/models/connect-explode.glb',
    aria: 'Connect, the handheld controller for Lun-E, coming apart into its parts as the page scrolls',
    fallback: ['/images/connect/connect-3-4.webp', 'Connect — a handheld controller with a thumbstick and an oled screen'],
    ground: -10.62,
    screen: { pos: [0, -18.58, 27.5], rot: [0, 0, Math.PI], move: [0, 0, 24], start: 0.06 },
    expl: {
      oled_case_front: [[0, 0, 38], 0.00],
      oled_glass:      [[0, 0, 24], 0.06],
      oled_pcb:        [[0, 0, 24], 0.06],
      oled_case_back:  [[0, 0, 12], 0.12],
      joy_knob:        [[0, 0, 34], 0.16],
      case_cap:        [[0, 30, 0], 0.22],
      joy_frame:       [[0, 0, 16], 0.30], joy_pcb: [[0, 0, 16], 0.30],
      joy_metal:       [[0, 0, 16], 0.30], joy_plastic: [[0, 0, 16], 0.30],
      case_body:       [[-46, 0, 0], 0.36],
      inner_plate:     [[0, 0, 8], 0.42],
    },
    labels: [
      { node: 'oled_case_front', text: '<b>0.96″ oled</b> · same case as lun-e' },
      { node: 'joy_knob',        text: '<b>thumbstick</b> · drive + steer' },
      { node: 'glyph_mask',      text: '<b>esp32-c3</b> glyph board' },
      { node: 'case_cap',        text: '<b>end cap</b>' },
      { node: 'case_body',       text: '<b>printed shell</b>' },
    ],
    cam: { yaw0: 0.7, pitch: [0.5, 0.42], dist: [240, 335], look: [13, 24] },
  },
};

// the page's scroll-blur would smear a model while it is being scrubbed:
// switched off while any of the scroll sections is on screen
const main = document.querySelector('.scroll-blur-target');
const showing = new Set();
const blurOff = (sec, on) => { on ? showing.add(sec) : showing.delete(sec); if (main) main.classList.toggle('no-scroll-blur', showing.size > 0); };

for (const section of document.querySelectorAll('.lune-scroll[data-hero]')) {
  const host = section.querySelector('.lune-canvas');
  const cfg = CONFIGS[section.dataset.hero];
  if (!host || !cfg) continue;
  // build each scene only when its section gets near the screen
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    init(section, host, cfg);
  }, { rootMargin: '150% 0px' });
  io.observe(section);
}

function init(section, host, cfg) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const debugP = new URLSearchParams(location.search).get('hero-p'); // ?hero-p=0.6 freezes a frame
  const hint = section.querySelector('.lune-hint');
  const labelLayer = host.querySelector('.lune-labels');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    fallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;   // keeps brand colours true (ACES shifts orange toward salmon)
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', cfg.aria);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(26, 1, 1, 3000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8090a0, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-60, 140, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 10, far: 400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
  fill.position.set(120, 40, -80);
  scene.add(fill);
  // rim light from behind — only switched on in dark mode, where the black
  // robot would otherwise melt into the black starfield
  const rim = new THREE.DirectionalLight(0xcfe0ff, 0);
  rim.position.set(40, 90, -160);
  scene.add(rim);

  const groundMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(220, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = cfg.ground;
  ground.receiveShadow = true;
  scene.add(ground);

  const turn = new THREE.Group();
  scene.add(turn);
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2; // model is z-up, in mm
  turn.add(root);

  // OLED face on a canvas so the eyes can blink
  const fc = document.createElement('canvas');
  fc.width = 512; fc.height = 256;
  const g = fc.getContext('2d');
  const faceTex = new THREE.CanvasTexture(fc);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  function drawFace(open) {
    g.shadowBlur = 0; g.fillStyle = '#000'; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#ffffff'; g.shadowColor = '#ffffff'; g.shadowBlur = 18;
    const h = Math.max(10, 130 * open), y = 58 + (130 - h) / 2, r = Math.min(34, h / 2);
    g.beginPath(); g.roundRect(96, y, 112, h, r); g.fill();
    g.beginPath(); g.roundRect(304, y, 112, h, r); g.fill();
    faceTex.needsUpdate = true;
  }
  drawFace(1);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(21.7, 10.9),
    new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }));
  screen.rotation.set(...cfg.screen.rot);
  screen.position.set(...cfg.screen.pos);
  root.add(screen);

  const EXPL = cfg.expl;
  const SPAN = 0.5; // each part takes this much of the explode to travel
  const LABELS = cfg.labels.map((L) => ({ ...L }));

  const nodes = {};
  // #FF5B1F, the logo orange. The printed orange parts use a matcap painted in that exact
  // colour (a small highlight where a face looks straight at the camera, slightly darker at grazing angles),
  // so they read as the logo orange whatever the scene lighting and theme.
  const BRAND = new THREE.Color('#FF5B1F');
  const isBrand = (c) => Math.abs(c.r - BRAND.r) + Math.abs(c.g - BRAND.g) + Math.abs(c.b - BRAND.b) < 0.03;
  const brandMat = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const x = cv.getContext('2d');
    const gr = x.createRadialGradient(110, 104, 4, 128, 128, 128);
    gr.addColorStop(0.0, '#FF7440');
    gr.addColorStop(0.18, '#FF5B1F');
    gr.addColorStop(0.96, '#FF5B1F');
    gr.addColorStop(1.0, '#B9410F');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshMatcapMaterial({ matcap: tex, side: THREE.DoubleSide, toneMapped: false, flatShading: true });  // the model has no vertex normals
  })();
  const brandMatN = brandMat.clone(); brandMatN.flatShading = false;   // for parts whose face normals we compute
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/gltf/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.load(host.dataset.model || cfg.model, (gltf) => {
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const n = o.name || (o.parent && o.parent.name);
      nodes[n] = o;
      o.userData.base = o.position.clone();
      o.geometry.computeBoundingBox();
      o.userData.center = o.geometry.boundingBox.getCenter(new THREE.Vector3());
      // faceted normals computed per face (flat shading from screen derivatives streaks on thin triangles)
      const tris = o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      const faceted = !o.geometry.attributes.normal && tris < 40000;
      if (faceted) { o.geometry = o.geometry.toNonIndexed(); o.geometry.computeVertexNormals(); }
      if (o.material) {
        if (faceted) { o.material.flatShading = false; o.material.needsUpdate = true; }
        o.material.side = THREE.DoubleSide;
        // whybit orange: pin the printed parts to the logo colour #FF5B1F
        if (o.material.color && isBrand(o.material.color)) o.material = faceted ? brandMatN : brandMat;
      }
    });
    root.add(gltf.scene);
    for (const L of LABELS) {
      const el = document.createElement('div');
      el.className = 'lune-label';
      el.innerHTML = '<span>' + L.text + '</span>';
      labelLayer.appendChild(el);
      L.el = el;
    }
    host.insertBefore(canvas, labelLayer);
    resize();
    host.classList.add('is-3d');
    wake();
  }, undefined, fallback);

  function fallback() {
    // no WebGL or the model failed: a still photo instead of an empty box
    host.classList.add('is-3d');
    const img = document.createElement('img');
    [img.src, img.alt] = cfg.fallback;
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    host.appendChild(img);
  }

  // ---- layout ------------------------------------------------------------
  let W = 1, H = 1;
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(host);

  function syncTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    groundMat.opacity = dark ? 0.6 : 0.18;
    renderer.toneMappingExposure = dark ? 1.15 : 1.0;
    rim.intensity = dark ? 2.2 : 0;
    dirty = true; wake();
  }
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- scroll → progress -------------------------------------------------
  function scrollProgress() {
    if (debugP !== null) return Math.min(1, Math.max(0, parseFloat(debugP)));
    const r = section.getBoundingClientRect();
    const travel = r.height - window.innerHeight;
    return travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
  }
  const clamp01 = (u) => (u < 0 ? 0 : u > 1 ? 1 : u);
  const ease = (u) => (u = clamp01(u), u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  // progress map: 0–0.08 assembled · 0.08–0.72 coming apart · 0.72–1 held apart with callouts
  const explodeOf = (p) => clamp01((p - 0.08) / 0.64);

  let p = scrollProgress(), target = p, dirty = true;
  const tmp = new THREE.Vector3();

  function pose(p, secs) {
    const e = explodeOf(p);
    for (const [n, [v, start]] of Object.entries(EXPL)) {
      const o = nodes[n]; if (!o) continue;
      const k = ease((e - start) / SPAN);
      o.position.set(o.userData.base.x + v[0] * k, o.userData.base.y + v[1] * k, o.userData.base.z + v[2] * k);
    }
    const ks = ease((e - cfg.screen.start) / SPAN), sp = cfg.screen.pos, sm = cfg.screen.move;
    screen.position.set(sp[0] + sm[0] * ks, sp[1] + sm[1] * ks, sp[2] + sm[2] * ks);

    // camera: one full turn around the model over the length of the section,
    // pulling back as it opens so the exploded parts stay in frame
    const ee = ease(e), C = cfg.cam;
    const yaw = C.yaw0 - p * Math.PI * 2;
    const pitch = lerp(C.pitch[0], C.pitch[1], ee);
    const fit = Math.max(1, 1.05 / cam.aspect);          // tall boxes (phones) need more distance
    const dist = lerp(C.dist[0], C.dist[1], ee) * fit;
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist + 4, Math.cos(yaw) * Math.cos(pitch) * dist);
    cam.lookAt(0, lerp(C.look[0], C.look[1], ee), 0);
    cam.updateMatrixWorld();
    scene.updateMatrixWorld();

    // callouts fade in once their part is out
    const k = clamp01((e - 0.82) / 0.12);
    const placed = [];
    for (const L of LABELS) {
      if (!L.el) continue;
      let o = nodes[L.node];
      if (L.pair && nodes[L.pair]) {
        const a = nodes[L.node].getWorldPosition(tmp).distanceTo(cam.position);
        const b = nodes[L.pair].getWorldPosition(tmp).distanceTo(cam.position);
        if (b < a) o = nodes[L.pair];
      }
      if (!o) continue;
      tmp.copy(o.userData.center); tmp.z += L.lift || 0;
      o.localToWorld(tmp); tmp.project(cam);
      placed.push({ L, x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, ok: tmp.z < 1 });
    }
    // keep callouts on the same side from stacking on top of each other
    for (const side of [-1, 1]) {
      const grp = placed.filter((q) => (q.x < W / 2 ? -1 : 1) === side).sort((u, v) => u.y - v.y);
      for (let i = 1; i < grp.length; i++) if (grp[i].y - grp[i - 1].y < 20) grp[i].ly = (grp[i - 1].ly ?? grp[i - 1].y) + 20;
    }
    for (const q of placed) {
      let dx = q.x < W / 2 ? -1 : 1;                    // point away from the middle…
      const w = q.L.el.offsetWidth || 160;
      if (dx > 0 && q.x + w + 14 > W) dx = -1;          // …unless that would run off the edge
      if (dx < 0 && q.x - w - 14 < 0) dx = 1;
      const ly = q.ly ?? q.y;
      q.L.el.classList.toggle('flip', dx < 0);
      q.L.el.style.opacity = (q.ok ? k : 0).toFixed(3);
      q.L.el.style.transform = `translate(${q.x}px, ${ly}px) translate(${dx < 0 ? '-100%' : '0'}, -50%) translateX(${dx * 6}px)`;
    }
    if (hint) hint.style.opacity = String(1 - clamp01(p / 0.05));
  }

  // ---- blink -------------------------------------------------------------
  let nextBlink = 1.5, blinkT = -1, lastOpen = 1;
  function blink(secs) {
    if (reduceMotion) return;
    if (blinkT < 0 && secs > nextBlink) { blinkT = secs; nextBlink = secs + 2.5 + Math.random() * 3; }
    let open = 1;
    if (blinkT >= 0) {
      const d = secs - blinkT;
      open = d < 0.18 ? Math.abs(d - 0.09) / 0.09 : 1;
      if (d >= 0.18) blinkT = -1;
    }
    if (Math.abs(open - lastOpen) > 0.01) { drawFace(open); lastOpen = open; dirty = true; }
  }

  // ---- loop: runs only while the hero is on screen -------------------------
  let inView = true, running = false;
  const t0 = performance.now();
  function frame(now) {
    if (!inView || document.hidden) { running = false; return; }
    const secs = (now - t0) / 1000;
    target = scrollProgress();
    p = reduceMotion ? target : lerp(p, target, 0.14);
    if (Math.abs(target - p) < 0.0005) p = target;
    blink(secs);
    pose(p, secs);
    renderer.render(scene, cam);
    dirty = false;
    requestAnimationFrame(frame);
  }
  function wake() {
    if (!host.classList.contains('is-3d') || !Object.keys(nodes).length) return;
    if (debugP !== null) { pose(scrollProgress(), 0); renderer.render(scene, cam); (window.__heroReady ||= {})[section.dataset.hero] = true; return; }
    if (!running && inView && !document.hidden) { running = true; requestAnimationFrame(frame); }
    (window.__heroReady ||= {})[section.dataset.hero] = true;
  }
  new IntersectionObserver((es) => {
    inView = es[0].isIntersecting;
    blurOff(section, inView);
    if (inView) wake();
  }).observe(section);
  document.addEventListener('visibilitychange', wake);
  syncTheme();
}
