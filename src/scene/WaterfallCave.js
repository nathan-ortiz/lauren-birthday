import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS } from '../utils/Colors.js';
import { getMaterial } from '../utils/Materials.js';
import { rand } from '../utils/Helpers.js';

// ── Layout — keyhole: narrow entrance → massive cavern ──
const ENTER_X = 55;        // waterfall plane x
const CAVE_Z = 24;         // center z — aligned with river approach

// Narrow entrance (car can squeeze through, hidden behind waterfall)
const PASS_HW = 5;         // passage half-width → z=22 to z=32 (10 wide)
const PASS_LEN = 8;        // passage length x=55..63

// Huge cavern behind entrance
const CAVERN_HW = 18;      // cavern half-width → z=9 to z=45 (36 wide)
const CAVERN_DEPTH = 50;   // cavern depth x=63..113
const CAVE_H = 24;         // ceiling height (camera at y≈13)

// Cliff face
const CLIFF_H = 38;
const WFALL_H = 35;
const WFALL_W = 20;        // waterfall width (wider than entrance)

// Palette
const CLIFF_MAIN = 0x7a6d5b;
const CLIFF_LIGHT = 0x9a8d7b;
const CLIFF_DARK = 0x5a5048;
const CLIFF_ACCENT = 0x8a7d6b;

// ── Helpers ──

function distortGeo(geo, amount = 0.15) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setX(i, p.getX(i) * (1 + rand(-amount, amount)));
    p.setY(i, p.getY(i) * (1 + rand(-amount, amount)));
    p.setZ(i, p.getZ(i) * (1 + rand(-amount, amount)));
  }
  geo.computeVertexNormals();
  return geo;
}

function addRock(group, x, y, z, radius, color) {
  const geo = distortGeo(new THREE.DodecahedronGeometry(radius, 1));
  const mesh = new THREE.Mesh(geo, getMaterial(color || CLIFF_DARK));
  mesh.position.set(x, y, z);
  mesh.rotation.set(rand(0, 0.5), rand(0, Math.PI * 2), rand(0, 0.5));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function staticBox(world, hx, hy, hz, px, py, pz) {
  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)),
  });
  body.position.set(px, py, pz);
  world.addBody(body);
}

function addWall(group, w, h, d, x, y, z, color = CLIFF_MAIN, roughness = 0.3) {
  const geo = new THREE.BoxGeometry(w, h, d,
    Math.max(1, Math.ceil(w / 4)),
    Math.max(1, Math.ceil(h / 5)),
    1,
  );
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setX(i, p.getX(i) + rand(-roughness, roughness));
    p.setY(i, p.getY(i) + rand(-roughness * 0.8, roughness * 0.8));
    p.setZ(i, p.getZ(i) + rand(-roughness * 0.6, roughness * 0.6));
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, getMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

// ── Main export ──

export function createWaterfallCave(scene, world) {
  const group = new THREE.Group();

  buildCliffs(group);
  buildCaveInterior(group);
  const chest = buildTreasureChest(group);
  const wfData = buildWaterfall(group);
  buildPhysics(world);

  scene.add(group);

  // Treasure chest station (integrates with StationManager)
  const treasureStation = {
    position: new THREE.Vector3(chest.cx, 0, chest.cz),
    radius: 6,
    video: '/videos/treasure-chest.mov',
    caption: 'Congratulations! You found treasure! 🎉',
    ring: chest.ring,
    update(time) {
      chest.group.rotation.y = Math.sin(time * 0.5) * 0.05;
    },
  };

  return {
    station: treasureStation,
    update(elapsed) {
      animateWaterfall(wfData, elapsed);
    },
  };
}

// ── Cliff walls ──

function buildCliffs(group) {
  const outerZ0 = CAVE_Z - CAVERN_HW; // 9
  const outerZ1 = CAVE_Z + CAVERN_HW; // 45
  const passZ0 = CAVE_Z - PASS_HW;    // 22
  const passZ1 = CAVE_Z + PASS_HW;    // 32
  const backX = ENTER_X + PASS_LEN + CAVERN_DEPTH; // 113
  const cliffW = CAVERN_HW * 2 + 10;  // total width (46)

  // ═══ FRONT CLIFF FACE ═══ — the main wall the player sees
  // Single solid wall at x=55. Waterfall hangs directly on its west face.
  // Car drives "through" (visual only, no physics collider here).
  addWall(group, 5, CLIFF_H, cliffW, ENTER_X + 2.5, CLIFF_H / 2, CAVE_Z, CLIFF_MAIN, 0.3);
  // Base rubble along the front face (no strata ledges — they show through waterfall)
  for (let i = 0; i < 6; i++)
    addRock(group, ENTER_X + rand(-1, 1), rand(0.4, 1.5),
      CAVE_Z + rand(-cliffW / 2 + 4, cliffW / 2 - 4), rand(0.8, 1.8), CLIFF_DARK);

  // ═══ South side wall ═══ (runs east from front face, at z=9)
  const sideLen = backX - ENTER_X + 5; // length from entrance to back
  addWall(group, sideLen, CLIFF_H, 5,
    ENTER_X + sideLen / 2, CLIFF_H / 2, outerZ0 - 2.5, CLIFF_MAIN);
  for (let i = 0; i < 6; i++) {
    const ly = CLIFF_H * (0.08 + i * 0.14) + rand(-1, 1);
    addWall(group, rand(10, 30), rand(0.8, 1.5), rand(1, 2),
      ENTER_X + rand(10, sideLen - 5), ly, outerZ0 - rand(0, 1.5), CLIFF_ACCENT);
  }

  // ═══ North side wall ═══ (runs east from front face, at z=45)
  addWall(group, sideLen, CLIFF_H, 5,
    ENTER_X + sideLen / 2, CLIFF_H / 2, outerZ1 + 2.5, CLIFF_MAIN);
  for (let i = 0; i < 6; i++) {
    const ly = CLIFF_H * (0.08 + i * 0.14) + rand(-1, 1);
    addWall(group, rand(10, 30), rand(0.8, 1.5), rand(1, 2),
      ENTER_X + rand(10, sideLen - 5), ly, outerZ1 + rand(0, 1.5), CLIFF_ACCENT);
  }

  // ═══ Entrance pinch walls ═══ (narrow passage from z=22..32, behind front face)
  // South pinch: z=9..22 from x=55 to x=63
  addWall(group, PASS_LEN, CAVE_H, passZ0 - outerZ0,
    ENTER_X + PASS_LEN / 2, CAVE_H / 2,
    (outerZ0 + passZ0) / 2, CLIFF_MAIN, 0.1);
  // North pinch: z=32..45
  addWall(group, PASS_LEN, CAVE_H, outerZ1 - passZ1,
    ENTER_X + PASS_LEN / 2, CAVE_H / 2,
    (passZ1 + outerZ1) / 2, CLIFF_MAIN, 0.1);

  // ═══ Back cliff wall ═══
  addWall(group, 5, CLIFF_H, CAVERN_HW * 2 + 6, backX + 2.5, CLIFF_H / 2, CAVE_Z, CLIFF_MAIN);
  for (let i = 0; i < 5; i++) {
    const ly = CLIFF_H * (0.1 + i * 0.18) + rand(-1, 1);
    addWall(group, rand(1, 3), rand(0.8, 1.5), rand(10, 20),
      backX + rand(0.5, 2), ly, CAVE_Z + rand(-5, 5), CLIFF_ACCENT);
  }
  for (let i = 0; i < 6; i++)
    addRock(group, backX + rand(0, 2), rand(0.5, 2), CAVE_Z + rand(-14, 14), rand(1, 2.5), CLIFF_DARK);

  // ═══ Canyon approach walls ═══ (lead up to the front cliff face)
  buildCanyonWall(group, 42, outerZ0 - 6, ENTER_X, outerZ0);
  buildCanyonWall(group, 42, outerZ1 + 6, ENTER_X, outerZ1);

  // ═══ Rocks above entrance ═══
  for (let i = 0; i < 12; i++)
    addRock(group, ENTER_X + rand(-3, 2), CLIFF_H * 0.4 + rand(0, CLIFF_H * 0.5),
      CAVE_Z + rand(-WFALL_W / 2, WFALL_W / 2), rand(2, 4), CLIFF_ACCENT);

  // (ledge removed — was visible as horizontal bar through the waterfall)
}

function buildCanyonWall(group, x0, z0, x1, z1) {
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    const cx = x0 + (x1 - x0) * t;
    const cz = z0 + (z1 - z0) * t;
    const segW = (x1 - x0) / steps + 3;
    const segD = Math.abs(z1 - z0) / steps + 4;
    const h = 12 + t * 24 + rand(-2, 2);
    addWall(group, segW, h, segD, cx, h / 2, cz, CLIFF_MAIN);
    addWall(group, segW * 0.6, rand(0.5, 1.2), segD * 0.5,
      cx + rand(-1, 1), h * rand(0.3, 0.6), cz, CLIFF_ACCENT);
    for (let j = 0; j < 2; j++)
      addRock(group, cx + rand(-3, 3), rand(0.5, 1.5), cz, rand(1, 2), CLIFF_DARK);
  }
}

// ── Cave interior ──

function buildCaveInterior(group) {
  const passEnd = ENTER_X + PASS_LEN;
  const backX = passEnd + CAVERN_DEPTH;
  const outerZ0 = CAVE_Z - CAVERN_HW;
  const outerZ1 = CAVE_Z + CAVERN_HW;

  // ── Ceilings ──
  addWall(group, PASS_LEN + 2, 3, PASS_HW * 2 + 2,
    ENTER_X + PASS_LEN / 2, CAVE_H + 1.5, CAVE_Z, CLIFF_DARK, 0.1);
  addWall(group, CAVERN_DEPTH + 2, 3, CAVERN_HW * 2 + 2,
    passEnd + CAVERN_DEPTH / 2, CAVE_H + 1.5, CAVE_Z, CLIFF_DARK, 0.15);

  // ── Stalactites (cavern only) ──
  for (let i = 0; i < 30; i++) {
    const len = rand(0.5, 4);
    const geo = new THREE.ConeGeometry(rand(0.1, 0.35), len, 5);
    const mesh = new THREE.Mesh(geo, getMaterial(CLIFF_DARK));
    mesh.position.set(
      passEnd + rand(3, CAVERN_DEPTH - 3),
      CAVE_H - len / 2,
      outerZ0 + rand(3, CAVERN_HW * 2 - 3),
    );
    mesh.rotation.x = Math.PI;
    group.add(mesh);
  }

  // ── Stalagmites (near walls only) ──
  for (let i = 0; i < 12; i++) {
    const len = rand(0.5, 3);
    const geo = new THREE.ConeGeometry(rand(0.15, 0.4), len, 5);
    const mesh = new THREE.Mesh(geo, getMaterial(CLIFF_ACCENT));
    const zOff = rand(0, 1) > 0.5 ? rand(2, 8) : CAVERN_HW * 2 - rand(2, 8);
    mesh.position.set(passEnd + rand(5, CAVERN_DEPTH - 5), len / 2, outerZ0 + zOff);
    group.add(mesh);
  }

  // ── Floors ──
  // Passage floor — below water level, invisible from outside
  const passFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(PASS_LEN + 4, PASS_HW * 2 + 2).rotateX(-Math.PI / 2),
    getMaterial(0x3a3a32),
  );
  passFloor.position.set(ENTER_X + PASS_LEN / 2, -0.2, CAVE_Z);
  passFloor.receiveShadow = true;
  group.add(passFloor);

  // Cavern floor — dark stone (player is fully inside by now)
  const cavFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(CAVERN_DEPTH + 8, CAVERN_HW * 2 + 6).rotateX(-Math.PI / 2),
    getMaterial(0x3a3a32),
  );
  cavFloor.position.set(passEnd + CAVERN_DEPTH / 2, 0.02, CAVE_Z);
  cavFloor.receiveShadow = true;
  group.add(cavFloor);

  // Ground extension behind mountain
  const gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 50).rotateX(-Math.PI / 2),
    getMaterial(0x5a5a4a),
  );
  gnd.position.set(90, -0.01, CAVE_Z);
  gnd.receiveShadow = true;
  group.add(gnd);

  // ── Lighting (2 lights — fewer = better performance) ──
  const warmLight1 = new THREE.PointLight(0xffaa55, 1.8, 65, 1.5);
  warmLight1.position.set(passEnd + 12, 10, CAVE_Z);
  group.add(warmLight1);

  const warmLight2 = new THREE.PointLight(0xff8833, 1.0, 50, 2);
  warmLight2.position.set(passEnd + 32, 8, CAVE_Z);
  group.add(warmLight2);
}

function buildTreasureChest(group) {
  const chestGroup = new THREE.Group();
  const cx = ENTER_X + PASS_LEN + CAVERN_DEPTH - 10; // near back of cavern
  const cz = CAVE_Z;
  const S = 1.8; // scale factor — bigger chest

  const woodDark = getMaterial(0x5c3518);
  const woodMid = getMaterial(0x7a4a2a);
  const woodLight = getMaterial(0x9b6b3e);
  const goldBright = getMaterial(0xd4a843);
  const goldDark = getMaterial(0xa88530);
  const ironDark = getMaterial(0x4a4a4a);

  // ── Base box ──
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4 * S, 1.1 * S, 1.6 * S), woodDark);
  base.position.y = 0.55 * S;
  base.castShadow = true;
  chestGroup.add(base);

  // Base trim (lighter wood inset)
  const inset = new THREE.Mesh(new THREE.BoxGeometry(2.2 * S, 0.9 * S, 1.4 * S), woodMid);
  inset.position.y = 0.55 * S;
  chestGroup.add(inset);

  // ── Rounded lid (half-cylinder) ──
  const lidGeo = new THREE.CylinderGeometry(0.8 * S, 0.8 * S, 2.4 * S, 10, 1, false, 0, Math.PI);
  lidGeo.rotateZ(Math.PI / 2);
  lidGeo.rotateY(Math.PI / 2);
  const lid = new THREE.Mesh(lidGeo, woodLight);
  lid.position.set(0, 1.1 * S, 0);
  lid.castShadow = true;
  chestGroup.add(lid);

  // Lid trim strip
  const lidTrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82 * S, 0.82 * S, 0.15 * S, 10, 1, false, 0, Math.PI),
    goldDark,
  );
  lidTrim.rotation.copy(lid.rotation);
  lidTrim.position.set(0, 1.1 * S, 0);
  chestGroup.add(lidTrim);

  // ── Metal bands (3 horizontal) ──
  for (const zOff of [-0.5, 0, 0.5]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.5 * S, 0.12 * S, 0.1 * S), goldDark);
    band.position.set(0, 0.55 * S, zOff * S);
    chestGroup.add(band);
    // Vertical straps over lid
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1 * S, 0.12 * S, 1.65 * S), goldDark);
    strap.position.set(zOff * S * 2.2, 1.15 * S, 0);
    chestGroup.add(strap);
  }

  // ── Front clasp / lock plate ──
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5 * S, 0.5 * S, 0.08 * S), goldBright);
  plate.position.set(0, 0.85 * S, 0.82 * S);
  chestGroup.add(plate);

  // Keyhole (dark circle on plate)
  const keyhole = new THREE.Mesh(
    new THREE.CircleGeometry(0.08 * S, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, flatShading: true }),
  );
  keyhole.position.set(0, 0.82 * S, 0.87 * S);
  chestGroup.add(keyhole);

  // Latch bar
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.35 * S, 0.08 * S, 0.06 * S), goldBright);
  latch.position.set(0, 1.0 * S, 0.82 * S);
  chestGroup.add(latch);

  // ── Corner studs ──
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.1 * S, 5, 4), goldBright);
      stud.position.set(sx * 1.1 * S, 0.15 * S, sz * 0.7 * S);
      chestGroup.add(stud);
      // Top corner studs
      const topStud = new THREE.Mesh(new THREE.SphereGeometry(0.07 * S, 5, 4), goldDark);
      topStud.position.set(sx * 1.1 * S, 1.1 * S, sz * 0.7 * S);
      chestGroup.add(topStud);
    }
  }

  // ── Hinges on back ──
  for (const xOff of [-0.6, 0.6]) {
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.2 * S, 0.25 * S, 0.06 * S), ironDark);
    hinge.position.set(xOff * S, 1.05 * S, -0.82 * S);
    chestGroup.add(hinge);
  }

  // ── Base feet (little blocks at corners) ──
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2 * S, 0.1 * S, 0.2 * S), ironDark);
      foot.position.set(sx * 1.0 * S, 0.05 * S, sz * 0.6 * S);
      chestGroup.add(foot);
    }
  }

  chestGroup.position.set(cx, 0, cz);
  group.add(chestGroup);

  // Glowing ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4, 0.15, 8, 32),
    new THREE.MeshStandardMaterial({
      color: 0xf4c542, emissive: 0xf4c542, emissiveIntensity: 1.5, flatShading: true,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(cx, 0.1, cz);
  group.add(ring);

  // Warm spotlight
  const chestLight = new THREE.PointLight(0xf4c542, 1.5, 20, 2);
  chestLight.position.set(cx, 5, cz);
  group.add(chestLight);

  return { group: chestGroup, ring, cx, cz };
}

// ── Waterfall — near-opaque curtain ──

function buildWaterfall(group) {
  // All waterfall layers sit directly on the front cliff face (x=55)
  const WF_X = ENTER_X - 0.5; // x=54.5 — flush with cliff face

  // Layer 1 — dense inner curtain (closest to cliff)
  const geo1 = new THREE.PlaneGeometry(WFALL_W, WFALL_H + 2, 14, 36);
  const wf1 = new THREE.Mesh(geo1, new THREE.MeshStandardMaterial({
    color: 0x3377aa, transparent: true, opacity: 0.75,
    side: THREE.DoubleSide, flatShading: true,
  }));
  wf1.position.set(WF_X, WFALL_H / 2, CAVE_Z);
  wf1.rotation.y = Math.PI / 2;
  group.add(wf1);

  // Layer 2 — mid
  const geo2 = new THREE.PlaneGeometry(WFALL_W, WFALL_H + 2, 12, 30);
  const wf2 = new THREE.Mesh(geo2, new THREE.MeshStandardMaterial({
    color: 0x4488bb, transparent: true, opacity: 0.6,
    side: THREE.DoubleSide, flatShading: true,
  }));
  wf2.position.set(WF_X - 0.8, WFALL_H / 2, CAVE_Z);
  wf2.rotation.y = Math.PI / 2;
  group.add(wf2);

  // Layer 3 — outer spray (wider)
  const geo3 = new THREE.PlaneGeometry(WFALL_W + 4, WFALL_H + 4, 10, 26);
  const wf3 = new THREE.Mesh(geo3, new THREE.MeshStandardMaterial({
    color: 0x6699bb, transparent: true, opacity: 0.4,
    side: THREE.DoubleSide, flatShading: true,
  }));
  wf3.position.set(WF_X - 1.6, WFALL_H / 2, CAVE_Z);
  wf3.rotation.y = Math.PI / 2;
  group.add(wf3);

  // Layer 4 — white foam overlay
  const geo4 = new THREE.PlaneGeometry(WFALL_W + 1, WFALL_H, 10, 24);
  const wf4 = new THREE.Mesh(geo4, new THREE.MeshStandardMaterial({
    color: 0xccddee, transparent: true, opacity: 0.3,
    side: THREE.DoubleSide,
  }));
  wf4.position.set(WF_X - 2.4, WFALL_H / 2, CAVE_Z);
  wf4.rotation.y = Math.PI / 2;
  group.add(wf4);

  // Foam crest at top
  const foamTopGeo = new THREE.PlaneGeometry(WFALL_W + 2, 3, 8, 4);
  const foamTop = new THREE.Mesh(foamTopGeo, new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
  }));
  foamTop.position.set(WF_X - 0.5, WFALL_H + 1, CAVE_Z);
  foamTop.rotation.y = Math.PI / 2;
  group.add(foamTop);

  // Pool at base — connects waterfall to river (centered on CAVE_Z=27)
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(10, 20).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: COLORS.waterDeep, transparent: true, opacity: 0.75,
      flatShading: true, side: THREE.DoubleSide,
    }),
  );
  pool.position.set(WF_X - 4, -0.1, CAVE_Z);
  pool.receiveShadow = true;
  group.add(pool);

  return { geo1, geo2, geo3, geo4, foamTopGeo };
}

function animateWaterfall({ geo1, geo2, geo3, geo4, foamTopGeo }, t) {
  const p1 = geo1.attributes.position;
  for (let i = 0; i < p1.count; i++) {
    const lx = p1.getX(i), ly = p1.getY(i);
    p1.setZ(i,
      Math.sin(ly * 1.5 - t * 5 + lx * 0.3) * 0.3 +
      Math.sin(ly * 3 - t * 7 + lx * 0.7) * 0.15 +
      Math.sin(ly * 5 - t * 9 + lx * 0.5) * 0.07);
  }
  p1.needsUpdate = true;

  const p2 = geo2.attributes.position;
  for (let i = 0; i < p2.count; i++) {
    const lx = p2.getX(i), ly = p2.getY(i);
    p2.setZ(i,
      Math.sin(ly * 1.3 - t * 4.5 + lx * 0.4 + 2) * 0.25 +
      Math.sin(ly * 2.8 - t * 6.5 + lx * 0.6) * 0.12);
  }
  p2.needsUpdate = true;

  const p3 = geo3.attributes.position;
  for (let i = 0; i < p3.count; i++) {
    const lx = p3.getX(i), ly = p3.getY(i);
    p3.setZ(i, Math.sin(ly * 0.8 - t * 3 + lx * 0.5 + 4) * 0.18);
  }
  p3.needsUpdate = true;

  const p4 = geo4.attributes.position;
  for (let i = 0; i < p4.count; i++) {
    const lx = p4.getX(i), ly = p4.getY(i);
    p4.setZ(i, Math.sin(ly * 2 - t * 6 + lx * 0.8 + 1) * 0.2);
  }
  p4.needsUpdate = true;

  const pf = foamTopGeo.attributes.position;
  for (let i = 0; i < pf.count; i++)
    pf.setZ(i, Math.sin(pf.getX(i) * 2 + t * 3) * 0.12);
  pf.needsUpdate = true;
}

// ── Physics ──

function buildPhysics(world) {
  const outerZ0 = CAVE_Z - CAVERN_HW; // 9
  const outerZ1 = CAVE_Z + CAVERN_HW; // 45
  const passZ0 = CAVE_Z - PASS_HW;    // 22
  const passZ1 = CAVE_Z + PASS_HW;    // 32
  const backX = ENTER_X + PASS_LEN + CAVERN_DEPTH; // 113

  // Outer walls
  staticBox(world, 36, 20, 3, 76, 20, outerZ0 - 3);
  staticBox(world, 36, 20, 3, 76, 20, outerZ1 + 3);
  // Back wall
  staticBox(world, 3, 20, CAVERN_HW + 3, backX + 3, 20, CAVE_Z);

  // Entrance seal (blocks everything except car gap)
  // Top seal: y=4..38 across full waterfall width
  staticBox(world, 1, 17, WFALL_W / 2 + 2, ENTER_X + 1, 21, CAVE_Z);
  // Left seal: y=0..4, z < passZ0
  staticBox(world, 1, 2, (WFALL_W / 2 - PASS_HW) / 2 + 0.5,
    ENTER_X + 1, 2, CAVE_Z - (PASS_HW + WFALL_W / 2) / 2);
  // Right seal
  staticBox(world, 1, 2, (WFALL_W / 2 - PASS_HW) / 2 + 0.5,
    ENTER_X + 1, 2, CAVE_Z + (PASS_HW + WFALL_W / 2) / 2);

  // Pinch walls
  const pinchW = (passZ0 - outerZ0) / 2;
  staticBox(world, PASS_LEN / 2 + 1, 12, pinchW,
    ENTER_X + PASS_LEN / 2, 12, (outerZ0 + passZ0) / 2);
  staticBox(world, PASS_LEN / 2 + 1, 12, pinchW,
    ENTER_X + PASS_LEN / 2, 12, (passZ1 + outerZ1) / 2);

  // Passage side walls
  staticBox(world, PASS_LEN / 2, 12, 0.5, ENTER_X + PASS_LEN / 2, 12, passZ0);
  staticBox(world, PASS_LEN / 2, 12, 0.5, ENTER_X + PASS_LEN / 2, 12, passZ1);

  // Canyon approach
  staticBox(world, 3.5, 12, 2, 44, 12, outerZ0 - 5);
  staticBox(world, 3.5, 12, 2, 49, 12, outerZ0 - 3);
  staticBox(world, 3.5, 12, 2, 53, 12, outerZ0 - 1);
  staticBox(world, 3.5, 12, 2, 44, 12, outerZ1 + 5);
  staticBox(world, 3.5, 12, 2, 49, 12, outerZ1 + 3);
  staticBox(world, 3.5, 12, 2, 53, 12, outerZ1 + 1);
}
