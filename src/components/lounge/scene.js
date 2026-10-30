import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createLoungeScene(stage, onSelect, onCeilingChange) {
const textures = new Set();
/* ---------- plan data (centimetres, same as the 2D plan) ---------- */
const W = 1790, D = 1900, H = 3.2, C = W / 2, SW = 513;
const L = { x: 50, w: SW, wallX: 40, dir: 1 }, R = { x: W - 50 - SW, w: SW, wallX: W - 40, dir: -1 };
const SECTIONS = [
  { id: 4, side: "Left", ...L, o: 0, tables: [7, 8, 9] },
  { id: 3, side: "Left", ...L, o: 1, tables: [5, 6] },
  { id: 2, side: "Left", ...L, o: 2, tables: [3, 4] },
  { id: 1, side: "Left", ...L, o: 3, tables: [1, 2] },
  { id: 5, side: "Right", ...R, o: 0, tables: [10, 11, 12] },
  { id: 6, side: "Right", ...R, o: 1, tables: [13, 14] },
  { id: 7, side: "Right", ...R, o: 2, tables: [15, 16] },
  { id: 8, side: "Right", ...R, o: 3, tables: [17, 18] },
  { id: 9, side: "Right", ...R, o: 4, tables: [19, 20], layout: "top" },
];
const TOP = 170, BOTTOM = 1880, GAP = 30;
function stack(side, extra) {
  const list = SECTIONS.filter(s => s.side === side).sort((a, b) => a.o - b.o);
  const avail = BOTTOM - TOP - GAP * (list.length - 1) - list.reduce((t, s) => t + (extra[s.id] || 0), 0);
  const n = Math.floor(avail / list.length);
  let y = TOP;
  list.forEach(s => { s.y = y; s.h = n + (extra[s.id] || 0); y += s.h + GAP; });
  return list;
}
const LEFT = stack("Left", { 4: 80 }), RIGHT = stack("Right", { 5: 80, 9: -50 });
const BAR = { x: C - 140, y: 300, w: 280, h: 1040 };
const LB = { x1: BAR.x - 82, x2: BAR.x + BAR.w + 82, y: 1680, cA: 1720, cB: 1860 };
const X = px => px / 100 - W / 200, Z = py => py / 100 - D / 200, M = cm => cm / 100;
const at = (s, d) => s.wallX + s.dir * d;

/* ---------- renderer, scene, camera ---------- */
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
catch { throw new Error("This device could not start 3D graphics. Choose a section from the list instead."); }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const tableTargets = [];
function registerTable(id, x, z) {
 const marker = new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.045,32), new THREE.MeshBasicMaterial({color:0xe952de, transparent:true, opacity:.6, toneMapped:false}));
 marker.position.set(x,.49,z); marker.userData.tableId=id; marker.userData.marker=true; scene.add(marker); tableTargets.push(marker);

}
let selectedSection = null, hoveredSection = null;
const sectionBadges = new Map();
function updateSectionStates() {
 tableTargets.filter(m => m.userData.marker).forEach(m => {
  const selected = m.userData.tableId === selectedSection;
  const hovered = m.userData.tableId === hoveredSection;
  m.material.color.setHex(selected ? 0xf5a0ee : hovered ? 0xf17ce7 : 0xe952de);
  m.material.opacity = selected ? .95 : hovered ? .85 : .6;
 });
 sectionBadges.forEach((badge, id) => badge.userData.paint(id === selectedSection ? 'selected' : id === hoveredSection ? 'hover' : 'idle'));
}
function selectTable(id) {
 selectedSection = id; updateSectionStates();
}
let pointerStart;
const pointerDown = e => {pointerStart=[e.clientX,e.clientY];};
renderer.domElement.addEventListener("pointerdown", pointerDown);
const hitAt = e => {
 const rect = renderer.domElement.getBoundingClientRect(), ray = new THREE.Raycaster();
 ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
 return ray.intersectObjects(tableTargets.filter(object => !object.isSprite || labels.visible))[0];
};
const pointerMove = e => {
 const hit = hitAt(e), id = hit?.object.userData.tableId ?? null;
 renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
 if (id !== hoveredSection) { hoveredSection = id; updateSectionStates(); }
};
const pointerLeave = () => { hoveredSection = null; updateSectionStates(); };
renderer.domElement.addEventListener('pointerleave', pointerLeave);
const pointerUp = e => {
 const start = pointerStart; pointerStart = null;
 if(!start || Math.hypot(e.clientX-start[0],e.clientY-start[1])>6) return;
 const hit = hitAt(e); if(hit) onSelect(hit.object.userData.tableId);
};
renderer.domElement.addEventListener('pointermove', pointerMove);
renderer.domElement.addEventListener("pointerup", pointerUp);
scene.background = new THREE.Color(0x0d0e0c);
const camera = new THREE.PerspectiveCamera(50, stage.clientWidth / stage.clientHeight, 0.05, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 0.4;
controls.maxDistance = 48;

/* ---------- textures drawn on canvas ---------- */
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; textures.add(t);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const rand = (() => { let s = 808; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

// black and white geometric floor tile, one tile = 80 cm
const tileTex = canvasTex(256, 256, (g, w) => {
  // quiet charcoal tile with only a faint diamond, so the floor recedes
  g.fillStyle = "#2a2925"; g.fillRect(0, 0, w, w);
  const dia = (r, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(w / 2, w / 2 - r); g.lineTo(w / 2 + r, w / 2); g.lineTo(w / 2, w / 2 + r); g.lineTo(w / 2 - r, w / 2); g.closePath(); g.fill(); };
  dia(122, "#25241f"); dia(118, "#2a2925");
  g.fillStyle = "#25241f";
  [[0, 0], [w, 0], [0, w], [w, w]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 28); g.lineTo(x + 28, y); g.lineTo(x, y + 28); g.lineTo(x - 28, y); g.fill(); });
}, M(W) / 0.8, M(D) / 0.8);

// backlit bookshelf unit, 1.2 m wide by 2.9 m tall
function drawShelves(g, w, h) {
  g.fillStyle = "#1c2b24"; g.fillRect(0, 0, w, h);
  const rows = 6, rh = h / rows, cols = ["#ece5d2", "#cdb68a", "#8d6b45", "#2a2521", "#f3f0e8", "#5e4a35", "#b99a68", "#d9cfb7"];
  for (let r = 0; r < rows; r++) {
    const y0 = r * rh + 8;
    const grad = g.createLinearGradient(0, y0, 0, y0 + rh * 0.5);
    grad.addColorStop(0, "rgba(255,214,150,.42)"); grad.addColorStop(1, "rgba(255,214,150,0)");
    g.fillStyle = grad; g.fillRect(10, y0, w - 20, rh - 14);
    let x = 12;
    
    while (x < w - 16) {
      const bw = 6 + rand() * 10, bh = rh * (0.55 + rand() * 0.3);
      g.fillStyle = cols[Math.floor(rand() * cols.length)];
      g.fillRect(x, y0 + (rh - 14) - bh, bw - 1, bh);
      if (rand() < 0.35) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x + 1, y0 + (rh - 14) - bh * 0.7, bw - 3, 2); }
      x += bw + (rand() < 0.08 ? 14 : 0);
    }
    g.fillStyle = "#3a3122"; g.fillRect(0, (r + 1) * rh - 6, w, 6);
  }
  g.fillStyle = "#1c2b24"; g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);
}
const shelfTex = canvasTex(256, 620, drawShelves, M(D) / 1.2, 1);

// fluted brass and fluted green panelling
const fluteTex = (a, b, n) => canvasTex(64, 8, (g, w, h) => { const grd = g.createLinearGradient(0, 0, w, 0); grd.addColorStop(0, a); grd.addColorStop(0.5, b); grd.addColorStop(1, a); g.fillStyle = grd; g.fillRect(0, 0, w, h); }, n, 1);
const brassFlute = fluteTex("#7d6131", "#e2c27a", 60);
const greenFlute = fluteTex("#16241e", "#2f4a3e", 40);

// white marble
const marbleTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#e9e6de"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(110,100,85,${0.12 + rand() * 0.25})`; g.lineWidth = 0.6 + rand() * 1.6;
    g.beginPath(); let x = rand() * w, y = rand() * h; g.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (rand() - 0.3) * 90; y += (rand() - 0.5) * 60; g.lineTo(x, y); }
    g.stroke();
  }
}, 2, 1);

// TV picture
const tvTex = canvasTex(256, 144, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, "#0e2a4a"); grd.addColorStop(0.55, "#2a6fb0"); grd.addColorStop(1, "#f0a830");
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  const glow = g.createRadialGradient(w * 0.55, h * 0.6, 4, w * 0.55, h * 0.6, w * 0.45); glow.addColorStop(0, "rgba(255,210,120,.55)"); glow.addColorStop(1, "rgba(255,210,120,0)");
  g.fillStyle = glow; g.fillRect(0, 0, w, h);
});

// gold 0808 logo with swash
function logoTex(script) {
  return canvasTex(1024, script ? 512 : 300, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, 0, 220); grd.addColorStop(0, "#f6dc93"); grd.addColorStop(0.5, "#c9a45c"); grd.addColorStop(1, "#8a6a32");
    g.fillStyle = grd; g.strokeStyle = grd;
    g.font = '200px Italiana, "Didot", Georgia, serif'; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillText("0808", w / 2, 210);
    g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.12, 232); g.bezierCurveTo(w * 0.3, 222, w * 0.7, 222, w * 0.88, 232); g.stroke();
    if (script) { g.font = 'italic 64px Georgia, serif'; g.fillText("Drinks taste better", w / 2, 340); g.fillText("with good company", w / 2, 420); }
  });
}
const logoPlain = logoTex(false), logoScript = logoTex(true);

/* ---------- materials ---------- */
const mat = {
  floor: new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.55, metalness: 0.05 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x223229, roughness: 0.85 }),
  wallDark: new THREE.MeshStandardMaterial({ color: 0x182019, roughness: 0.9 }),
  facade: new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.6 }),
  shelf: new THREE.MeshStandardMaterial({ map: shelfTex, emissiveMap: shelfTex, emissive: 0xffd9a0, emissiveIntensity: 0.08, roughness: 0.8 }),
  rust: new THREE.MeshStandardMaterial({ color: 0x8d4a2b, roughness: 0.95 }),
  rustDeep: new THREE.MeshStandardMaterial({ color: 0x7a3d22, roughness: 0.95 }),
  burgundy: new THREE.MeshStandardMaterial({ color: 0x6e2f36, roughness: 0.92, side: THREE.DoubleSide }),
  barBase: new THREE.MeshStandardMaterial({ color: 0x5a1f25, roughness: 0.5 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 0.55, roughness: 0.32, emissive: 0x2a1d08, emissiveIntensity: 0.6 }),
  brassFlute: new THREE.MeshStandardMaterial({ map: brassFlute, metalness: 0.45, roughness: 0.35, emissive: 0x2a1d08 }),
  greenFlute: new THREE.MeshStandardMaterial({ map: greenFlute, roughness: 0.7 }),
  marble: new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.25 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xbcd6d4, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.6 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xe6dcc6, roughness: 0.6 }),
  tvFrame: new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.4 }),
  tv: new THREE.MeshBasicMaterial({ map: tvTex }),
  led: new THREE.MeshBasicMaterial({ color: 0xfff1cf }),
  bulb: new THREE.MeshBasicMaterial({ color: 0xffd28a }),
  amber: new THREE.MeshBasicMaterial({ color: 0xc8782a }),
  logo: new THREE.MeshBasicMaterial({ map: logoPlain, transparent: true }),
  logoScript: new THREE.MeshBasicMaterial({ map: logoScript, transparent: true }),
  cage: new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 0.4, roughness: 0.5, wireframe: true, emissive: 0x5a4018 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x141a17, roughness: 1 }),
};

/* ---------- helpers ---------- */
function box(w, h, d, m, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
// box between two plan-space corners (cm), from y0 to y1 (m)
function boxPlan(px0, pz0, px1, pz1, y0, y1, m, parent = scene) {
  const x0 = X(Math.min(px0, px1)), x1 = X(Math.max(px0, px1)), z0 = Z(Math.min(pz0, pz1)), z1 = Z(Math.max(pz0, pz1));
  return box(x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent);
}
function cyl(rt, rb, h, m, x, y, z, seg = 24, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function ring(r, tube, m, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 40), m);
  mesh.rotation.x = Math.PI / 2; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function plane(w, h, m, x, y, z, ry = 0, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z); mesh.rotation.y = ry; parent.add(mesh); return mesh;
}
const labels = new THREE.Group(); scene.add(labels);
function label(text, x, y, z, size = 0.5, sub) {
  const c = document.createElement("canvas"); c.width = 512; c.height = sub ? 192 : 128;
  const g = c.getContext("2d");
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; textures.add(t);
  let lastState;
  const paint = state => {
    if (state === lastState) return;
    lastState = state;
    const actionable = Boolean(sub), selected = state === 'selected';
    const ink = actionable ? '#131313' : '#e8dec7';
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = actionable ? (selected ? '#f5a0ee' : state === 'hover' ? '#f17ce7' : '#e952de') : 'rgba(13,14,12,.86)';
    g.strokeStyle = actionable ? '#ffd7fa' : '#c9a45c'; g.lineWidth = selected ? 10 : 4;
    g.beginPath(); g.roundRect(4, 4, 504, c.height - 8, 14); g.fill(); g.stroke();
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 52px Manrope, Arial, sans-serif'; g.fillText(text, 256, sub ? 70 : 66);
    if (sub) { g.font = '700 36px Manrope, Arial, sans-serif'; g.fillText(selected ? 'SELECTED · VIEW ↗' : sub, 256, 136); }
    t.needsUpdate = true;
  };
  paint('idle');
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.userData.paint = paint;
  s.material.toneMapped = false;
  s.scale.set(size * 4, size * c.height / 128, 1); s.position.set(x, y, z); s.renderOrder = 10; labels.add(s); return s;
}
function numberTag(n, x, y, z) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(13,14,12,.9)"; g.strokeStyle = "#c9a45c"; g.lineWidth = 6;
  g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#e8dec7"; g.font = '64px Italiana, Georgia, serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; textures.add(t);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(0.42, 0.42, 1); s.position.set(x, y, z); s.renderOrder = 11; labels.add(s);
}

/* ---------- room shell ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(M(W), M(D)), mat.floor);
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const t = 0.24, hw = M(W) / 2, hd = M(D) / 2;
box(t, H, M(D) + 2 * t, mat.wall, -hw - t / 2, H / 2, 0);
box(t, H, M(D) + 2 * t, mat.wall, hw + t / 2, H / 2, 0);
// top wall with toilet door gap (plan x 1495 to 1595)
const td0 = X(C + 225), td1 = X(C + 320);
box(td0 + hw + t, H, t, mat.wall, (-hw - t + td0) / 2, H / 2, -hd - t / 2);
box(hw + t - td1, H, t, mat.wall, (td1 + hw + t) / 2, H / 2, -hd - t / 2);
box(td1 - td0, H - 2.2, t, mat.wall, (td0 + td1) / 2, 2.2 + (H - 2.2) / 2, -hd - t / 2);
box(td1 - td0 - 0.04, 2.18, 0.05, mat.wallDark, (td0 + td1) / 2, 1.09, -hd - t + 0.03);
cyl(0.015, 0.015, 0.14, mat.brass, td0 + 0.12, 1.05, -hd - t + 0.08, 8).rotation.z = Math.PI / 2;
// bottom wall with entrance gap (plan x 1000 to 1400); black facade outside
const e0 = X(C - 200), e1 = X(C + 200);
const bottomMats = [mat.wall, mat.wall, mat.wall, mat.wall, mat.facade, mat.wall];
[[-hw - t, e0], [e1, hw + t]].forEach(([a, b]) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(b - a, H, t), bottomMats); m.position.set((a + b) / 2, H / 2, hd + t / 2); scene.add(m);
});
const lintel = new THREE.Mesh(new THREE.BoxGeometry(e1 - e0, H - 2.5, t), bottomMats); lintel.position.set(0, 2.5 + (H - 2.5) / 2, hd + t / 2); scene.add(lintel);
// glass entrance doors, LED strips and gold sign on the facade
box(e1 - e0 - 0.1, 2.45, 0.03, mat.glass, 0, 1.225, hd + t / 2);
box(0.04, 2.45, 0.05, mat.black, 0, 1.225, hd + t / 2);
[-3.1, -2.75, -2.4, 2.4, 2.75, 3.1].forEach(x => box(0.035, 2.6, 0.02, mat.led, x, 1.45, hd + t + 0.012));
plane(2.6, 0.76, mat.logo, 0, 2.85, hd + t + 0.02);

// bookshelf walls down both sides with a TV in each section
const shelfDepth = M(40);
[[-hw + shelfDepth / 2, 0], [hw - shelfDepth / 2, 1]].forEach(([x, face]) => {
  const mats = [mat.wallDark, mat.wallDark, mat.wallDark, mat.wallDark, mat.wallDark, mat.wallDark];
  mats[face] = mat.shelf;
  const m = new THREE.Mesh(new THREE.BoxGeometry(shelfDepth, 2.9, M(D)), mats); m.position.set(x, 1.45, 0); scene.add(m);
});

/* ---------- sections ---------- */
function sofa(x0, z0, x1, z1, back, seats) {
  // rectangle in world metres; back is the edge carrying the backrest: "w", "e", "n" or "s"
  const g = new THREE.Group(); scene.add(g);
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1), minZ = Math.min(z0, z1), maxZ = Math.max(z0, z1);
  const alongX = back === "n" || back === "s";
  const len = alongX ? maxX - minX : maxZ - minZ, dep = alongX ? maxZ - minZ : maxX - minX;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  // local frame: length along local x, depth along local z, back at local -z
  g.position.set(cx, 0, cz);
  g.rotation.y = { n: 0, s: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 }[back];
  const bt = 0.22, arm = 0.18;
  box(len, 0.24, dep, mat.rustDeep, 0, 0.14, 0, g);
  const segLen = (len - 2 * arm) / seats;
  for (let i = 0; i < seats; i++) box(segLen - 0.02, 0.16, dep - bt - 0.02, mat.rust, -len / 2 + arm + segLen * (i + 0.5), 0.34, bt / 2, g);
  box(len, 0.62, bt, mat.rust, 0, 0.58 - 0.0, -dep / 2 + bt / 2, g).position.y = 0.26 + 0.31 + 0.02;
  box(arm, 0.36, dep, mat.rust, -len / 2 + arm / 2, 0.44, 0, g);
  box(arm, 0.36, dep, mat.rust, len / 2 - arm / 2, 0.44, 0, g);
  // scatter cushions
  [-1, 1].forEach(sg => { const p = box(0.4, 0.36, 0.12, mat.rustDeep, sg * (len / 2 - arm - 0.3), 0.6, -dep / 2 + bt + 0.08, g); p.rotation.x = -0.25; p.rotation.z = sg * 0.12; });
  return g;
}
function coffeeTable(x, z, r) {
  cyl(r, r, 0.02, mat.glass, x, 0.46, z, 40);
  ring(r, 0.012, mat.brass, x, 0.46, z);
  cyl(r * 0.82, r * 0.82, 0.02, mat.glass, x, 0.2, z, 40);
  ring(r * 0.82, 0.01, mat.brass, x, 0.2, z);
  for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; cyl(0.012, 0.012, 0.46, mat.brass, x + Math.sin(a) * r * 0.8, 0.23, z + Math.cos(a) * r * 0.8, 8); }
}
function tubChair(x, z, tx, tz) {
  cyl(0.33, 0.3, 0.42, mat.burgundy, x, 0.21, z, 28);
  const phi = Math.atan2(tx - x, tz - z);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.34, 0.34, 28, 1, true, phi + Math.PI - Math.PI * 0.6, Math.PI * 1.2), mat.burgundy);
  shell.position.set(x, 0.58, z); scene.add(shell);
}
function cagePendant(x, z, y = 2.55) {
  cyl(0.006, 0.006, H - y - 0.2, mat.black, x, y + 0.2 + (H - y - 0.2) / 2, z, 6);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.42, 14, 4, true), mat.cage); c.position.set(x, y, z); scene.add(c);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat.bulb); b.position.set(x, y - 0.05, z); scene.add(b);
}

SECTIONS.forEach(s => {
  const { y, h } = s;
  const furnitureStart = scene.children.length;
  const n = s.tables.length;
  // TV centred on the bookshelf wall
  const wallFace = X(s.wallX) + s.dir * 0.02, cz = Z(y + h / 2);
  box(0.06, 0.78, 1.36, mat.tvFrame, wallFace, 1.78, cz);
  plane(1.28, 0.7, mat.tv, wallFace + s.dir * 0.035, 1.78, cz, s.dir === 1 ? Math.PI / 2 : -Math.PI / 2);
  if (s.layout === "top") {
    const x1 = s.wallX - 345, x2 = s.wallX - 20, sy = y + 40;
    sofa(X(x1), Z(sy), X(x2), Z(sy + 88), "n", n);
    const span = (x2 - x1) / n;
    s.tables.forEach((_, i) => {
      const tx = X(x1 + (i + 0.5) * span), tz = Z(sy + 88 + 52);
      coffeeTable(tx, tz, 0.38); 
    });
    [y + 92, y + 180].forEach(cy => tubChair(X(s.wallX - 400), Z(cy), X(x1 + span / 2), Z(cy)));
    cagePendant(X(s.x + s.w / 2), Z(y + h / 2));
  } else {
    const top = y + 44, bot = y + h - 18;
    const sofaNear = at(s, 20), sofaFar = at(s, 115);
    sofa(X(sofaNear), Z(top), X(sofaFar), Z(bot), s.dir === 1 ? "w" : "e", n);
    const span = (bot - top) / n, r = Math.min(48, span * 0.36);
    s.tables.forEach((_, i) => {
      const tz = Z(top + (i + 0.5) * span), tx = X(at(s, 250)), cx = X(at(s, 400));
      coffeeTable(tx, tz, M(r)); 
      tubChair(cx, tz, tx, tz);
    });
    cagePendant(X(at(s, 260)), Z(y + h / 2));
  }
  scene.children.slice(furnitureStart).forEach(object => {
    object.traverse(child => { if (child.isMesh) { child.userData.tableId = s.id; tableTargets.push(child); } });
  });
  registerTable(s.id, X(s.x + s.w / 2), Z(y + h / 2));
  const badge = label(`SECTION ${s.id}  ↗`, X(s.x + s.w / 2), 2.25, Z(y + h / 2), 0.45, 'VIEW & RESERVE');
  badge.userData.tableId = s.id; tableTargets.push(badge); sectionBadges.set(s.id, badge);
});

/* ---------- brass lattice screens between sections ---------- */
function lattice(side, pz) {
  const s = side === "Left" ? L : R;
  const len = M(208), x0 = X(s.wallX), z = Z(pz), dir = s.dir;
  const g = new THREE.Group(); g.position.set(x0 + dir * len / 2, 0, z); scene.add(g);
  box(len, 0.32, 0.26, mat.black, 0, 0.16, 0, g);
  const y0 = 0.32, y1 = 2.6, fh = y1 - y0, bar = 0.035;
  [-len / 2 + bar / 2, len / 2 - bar / 2].forEach(x => box(bar, fh, bar, mat.brass, x, y0 + fh / 2, 0, g));
  box(len, bar, bar, mat.brass, 0, y1, 0, g); box(len, bar, bar, mat.brass, 0, y0 + 0.02, 0, g);
  const bays = 6, bw = len / bays;
  for (let i = 1; i < bays; i++) box(0.022, fh, 0.022, mat.brass, -len / 2 + i * bw, y0 + fh / 2, 0, g);
  // art deco chevrons in alternate bays
  for (let i = 0; i < bays; i += 1) {
    const cx = -len / 2 + (i + 0.5) * bw;
    [1.2, 1.9].forEach(cy => {
      [-1, 1].forEach(sg => {
        const dl = Math.hypot(bw / 2, 0.32);
        const d = box(dl, 0.02, 0.02, mat.brass, cx + sg * bw / 4, cy + 0.16, 0, g);
        d.rotation.z = sg * Math.atan2(0.32, bw / 2);
      });
    });
  }
  // speaker mounted above the screen at the aisle end
  box(0.34, 0.46, 0.32, mat.black, dir * (len / 2 - 0.25), y1 + 0.28, 0, g);
}
[LEFT, RIGHT].forEach(list => list.slice(0, -1).forEach(u => lattice(u.side, u.y + u.h + GAP / 2)));

/* ---------- bar ---------- */
(function () {
  const bx0 = BAR.x, bx1 = BAR.x + BAR.w, bz0 = BAR.y, bz1 = BAR.y + BAR.h, c = 55;
  // counter base around a central well
  const parts = [[bx0, bz0, bx0 + c, bz1], [bx1 - c, bz0, bx1, bz1], [bx0 + c, bz0, bx1 - c, bz0 + c], [bx0 + c, bz1 - c, bx1 - c, bz1]];
  parts.forEach(([a, b, cc, d]) => boxPlan(a, b, cc, d, 0, 0.84, mat.barBase));
  // fluted brass fascia and marble top, each as a ring of four non-overlapping pieces
  const ringParts = o => [[bx0 - o, bz0 - o, bx0 + c, bz1 + o], [bx1 - c, bz0 - o, bx1 + o, bz1 + o], [bx0 + c, bz0 - o, bx1 - c, bz0 + c], [bx0 + c, bz1 - c, bx1 - c, bz1 + o]];
  ringParts(2).forEach(([a, b, cc, d]) => boxPlan(a, b, cc, d, 0.84, 1.0, mat.brassFlute));
  ringParts(6).forEach(([a, b, cc, d]) => boxPlan(a, b, cc, d, 1.0, 1.05, mat.marble));
  // well floor and back bar with backlit bottle shelves
  boxPlan(bx0 + c, bz0 + c, bx1 - c, bz1 - c, 0, 0.02, mat.black);
  boxPlan(bx0 + 110, bz0 + 110, bx1 - 110, bz1 - 110, 0, 0.95, mat.wallDark);
  [0.35, 0.65].forEach(yy => {
    boxPlan(bx0 + 108, bz0 + 120, bx0 + 110, bz1 - 120, yy, yy + 0.04, mat.amber);
    boxPlan(bx1 - 110, bz0 + 120, bx1 - 108, bz1 - 120, yy, yy + 0.04, mat.amber);
  });
  // overhead brass gantry with glass shelf and posts
  const gx0 = X(bx0 + 25), gx1 = X(bx1 - 25), gz0 = Z(bz0 + 25), gz1 = Z(bz1 - 25), gy = 2.3;
  box(gx1 - gx0, 0.03, gz1 - gz0, mat.glass, (gx0 + gx1) / 2, gy, (gz0 + gz1) / 2);
  [[gx0, gz0, gx1, gz0], [gx0, gz1, gx1, gz1], [gx0, gz0, gx0, gz1], [gx1, gz0, gx1, gz1]].forEach(([a, b, cc, d]) => {
    const lx = Math.abs(cc - a) || 0.04, lz = Math.abs(d - b) || 0.04;
    box(lx, 0.04, lz, mat.brass, (a + cc) / 2, gy, (b + d) / 2);
    box(lx, 0.025, lz, mat.brass, (a + cc) / 2, gy + 0.22, (b + d) / 2);
  });
  for (let zz = gz0; zz <= gz1 + 0.01; zz += (gz1 - gz0) / 12) {
    [gx0, gx1].forEach(xx => box(0.02, 0.22, 0.02, mat.brass, xx, gy + 0.11, zz));
  }
  [[gx0, gz0], [gx1, gz0], [gx0, gz1], [gx1, gz1]].forEach(([xx, zz]) => cyl(0.01, 0.01, H - gy, mat.brass, xx, gy + (H - gy) / 2, zz, 6));
  // pleated brass drum pendants over both counters
  for (let i = 0; i < 6; i++) {
    const zz = gz0 + 0.6 + i * ((gz1 - gz0 - 1.2) / 5);
    [X(bx0 + 27), X(bx1 - 27)].forEach(xx => {
      cyl(0.18, 0.2, 0.2, mat.brass, xx, 2.05, zz, 20);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 20), mat.bulb); b.position.set(xx, 1.945, zz); scene.add(b);
      cyl(0.005, 0.005, gy - 2.15, mat.black, xx, 2.15 + (gy - 2.15) / 2, zz, 6);
    });
  }
  // stools: six each side, backs away from the bar
  for (let i = 0; i < 6; i++) {
    const pz = 520 + i * 100;
    [[bx0 - 55, -1], [bx1 + 55, 1]].forEach(([px, side]) => {
      const x = X(px), z = Z(pz);
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2;
        cyl(0.017, 0.017, 0.72, mat.black, x + Math.sin(a) * 0.15, 0.36, z + Math.cos(a) * 0.15, 8);
        cyl(0.018, 0.018, 0.06, mat.brass, x + Math.sin(a) * 0.15, 0.03, z + Math.cos(a) * 0.15, 8);
      }
      ring(0.2, 0.012, mat.brass, x, 0.3, z);
      ring(0.22, 0.012, mat.brass, x, 0.72, z);
      cyl(0.23, 0.22, 0.11, mat.burgundy, x, 0.78, z, 24);
      const phi = Math.atan2(-side, 0);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 24, 1, true, phi + Math.PI - Math.PI * 0.45, Math.PI * 0.9), mat.burgundy);
      back.position.set(x, 0.96, z); scene.add(back);
    });
  }
  label("BAR", 0, 2.75, Z(bz0 + BAR.h / 2), 0.3);
})();

/* ---------- DJ booth and logo wall ---------- */
(function () {
  const x0 = X(C - 220), x1 = X(C + 220), z0 = -hd, z1 = Z(190);
  box(x1 - x0, 0.18, z1 - z0, mat.wallDark, (x0 + x1) / 2, 0.09, (z0 + z1) / 2);
  box(x1 - x0, 1.1, 0.12, mat.greenFlute, (x0 + x1) / 2, 0.55, z1 - 0.06);
  box(x1 - x0 + 0.04, 0.04, 0.16, mat.brass, (x0 + x1) / 2, 1.12, z1 - 0.06);
  box(1.9, 0.08, 0.55, mat.black, (x0 + x1) / 2, 1.06, z1 - 0.45);
  [-0.6, 0.6].forEach(dx => cyl(0.14, 0.14, 0.02, mat.cream, (x0 + x1) / 2 + dx, 1.11, z1 - 0.45, 24));
  // fluted green feature wall with LED strips, logo and moving heads above the booth
  const wx0 = X(C - 220), wx1 = X(C + 220);
  box(wx1 - wx0, H, 0.06, mat.greenFlute, (wx0 + wx1) / 2, H / 2, -hd + 0.03);
  for (let i = 1; i < 6; i++) box(0.03, H - 0.3, 0.02, mat.led, wx0 + i * (wx1 - wx0) / 6, H / 2, -hd + 0.07);
  plane(3.4, 1.7, mat.logoScript, (x0 + x1) / 2, 2.2, -hd + 0.09);
  for (let i = 0; i < 6; i++) box(0.2, 0.22, 0.2, mat.black, wx0 + 0.4 + i * (wx1 - wx0 - 0.8) / 5, H - 0.12, -hd + 0.25);
  label("DJ BOOTH", (x0 + x1) / 2, 2.95, -hd + 0.35, 0.3);
})();

/* ---------- lobby ---------- */
(function () {
  const x0 = X(LB.x1), x1 = X(LB.x2), zb = Z(LB.y), za = Z(LB.cA), zc = Z(LB.cB), wt = 0.2, wh = 3.0;
  box(x1 - x0 + wt, wh, wt, mat.wall, (x0 + x1) / 2, wh / 2, zb);
  [x0, x1].forEach(x => {
    box(wt, wh, za - zb, mat.wall, x, wh / 2, (zb + za) / 2);
    box(wt, wh, hd - zc, mat.wall, x, wh / 2, (zc + hd) / 2);
    box(wt, wh - 2.6, zc - za, mat.wall, x, 2.6 + (wh - 2.6) / 2, (za + zc) / 2);
    // velvet curtain filling the opening
    const geo = new THREE.PlaneGeometry(zc - za, 2.6, 48, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 22) * 0.045);
    geo.computeVertexNormals();
    const cur = new THREE.Mesh(geo, mat.burgundy);
    cur.rotation.y = Math.PI / 2; cur.position.set(x, 1.3, (za + zc) / 2); scene.add(cur);
    box(0.03, 0.03, zc - za, mat.brass, x, 2.6, (za + zc) / 2);
  });
  plane(2.3, 0.68, mat.logo, 0, 2.15, zb + wt / 2 + 0.01);
  // host table
  const hx0 = X(C - 90), hx1 = X(C + 90), hz0 = Z(1762), hz1 = Z(1816);
  box(hx1 - hx0 - 0.12, 0.98, hz1 - hz0 - 0.08, mat.black, 0, 0.49, (hz0 + hz1) / 2);
  box(hx1 - hx0, 0.05, hz1 - hz0, mat.marble, 0, 1.0, (hz0 + hz1) / 2);
  box(hx1 - hx0 - 0.1, 0.03, 0.02, mat.brass, 0, 0.9, hz1 - 0.03);
  cyl(0.09, 0.12, 0.2, mat.cream, 0.6, 1.22, (hz0 + hz1) / 2, 20);
})();

/* ---------- ceiling (off by default) ---------- */
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(M(W), M(D)), mat.ceiling);
ceiling.rotation.x = Math.PI / 2; ceiling.position.y = H; ceiling.visible = false; scene.add(ceiling);

/* ---------- lighting ---------- */
// Lift seating and floor detail without losing the warm pools of club lighting.
scene.add(new THREE.HemisphereLight(0xfff0d8, 0x29332d, 0.32));
scene.add(new THREE.AmbientLight(0xffffff, 0.06));
const warm = (x, y, z, i, d) => { const l = new THREE.PointLight(0xffc98a, i * Math.PI, d, 1.6); l.position.set(x, y, z); scene.add(l); };
warm(0, 2.0, -3.2, 1.7, 8); warm(0, 2.0, 1.8, 1.7, 8);
[-1, 1].forEach(sg => { warm(sg * (hw - 2.6), 2.4, -4.5, 1.55, 9); warm(sg * (hw - 2.6), 2.4, 3.5, 1.55, 9); });
warm(0, 2.6, 8.4, 1.0, 5);

const dj = new THREE.PointLight(0x7a5cff, 1.4 * Math.PI, 8, 1.6); dj.position.set(0, 2.8, -7.4); scene.add(dj);
const key = new THREE.DirectionalLight(0xfff4e0, 0.22); key.position.set(-6, 14, 8); scene.add(key);
const fill = new THREE.DirectionalLight(0xaaa6e8, 0.1); fill.position.set(8, 6, -6); scene.add(fill);

/* ---------- views ---------- */
const VIEWS = {
  overview: { p: [0, 21, 17], t: [0, 0, 0.6], ceiling: false },
  curtain: { p: [X(C + 285), 1.62, Z(1800)], t: [X(C + 700), 1.0, Z(1730)], ceiling: true },
  stools: { p: [X(C - 265), 1.6, Z(1150)], t: [X(200), 1.0, Z(1000)], ceiling: true },
  dj: { p: [0, 2.0, Z(110)], t: [0, 0.8, Z(1300)], ceiling: true },
  lobby: { p: [0, 1.65, hd + 2.6], t: [0, 1.45, Z(1690)], ceiling: true },
};
let ceilingOn = false, anim = null;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function setCeiling(on) {
  ceilingOn = on; ceiling.visible = on;
  onCeilingChange(on);
}
function goTo(name, instant) {
  const v = VIEWS[name];
  if (!v) return;
  setCeiling(v.ceiling);
  const p1 = new THREE.Vector3(...v.p), t1 = new THREE.Vector3(...v.t);
  if (instant || reduce) { camera.position.copy(p1); controls.target.copy(t1); controls.update(); return; }
  anim = { p0: camera.position.clone(), t0: controls.target.clone(), p1, t1, start: performance.now(), dur: 1100 };
}
goTo("overview", true);

function resize() {
  const w = Math.max(1,stage.clientWidth), h = Math.max(1,stage.clientHeight);
  renderer.setSize(w, h); camera.aspect = w / h;
  camera.fov = w < h ? 62 : 50; camera.updateProjectionMatrix();
}
const observer = new ResizeObserver(resize); observer.observe(stage); resize();

let animationFrame;
function loop(now) {
  if (anim) {
    let k = Math.min(1, (now - anim.start) / anim.dur); k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(anim.p0, anim.p1, k); controls.target.lerpVectors(anim.t0, anim.t1, k);
    if (k >= 1) anim = null;
  }
  controls.update();
  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(loop);
}
animationFrame = requestAnimationFrame(loop);
return {
 selectTable,
 goTo: name => goTo(name, false),
 setCeiling,
 setLabels: visible => { labels.visible = visible; },
 dispose() {
  cancelAnimationFrame(animationFrame);
  observer.disconnect();
  renderer.domElement.removeEventListener('pointerdown', pointerDown);
  renderer.domElement.removeEventListener('pointerup', pointerUp);
  renderer.domElement.removeEventListener('pointermove', pointerMove);
  renderer.domElement.removeEventListener('pointerleave', pointerLeave);
  controls.dispose();
  const geometries = new Set(), materials = new Set();
  scene.traverse(object => {
   if (object.geometry) geometries.add(object.geometry);
   if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
  textures.forEach(t => t.dispose());
  renderer.dispose();
  renderer.domElement.remove();
 }
};
}
