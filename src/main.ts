import * as THREE from "three";

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue
scene.fog = new THREE.Fog(0x87ceeb, 30, 60);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- Lights ---
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 10, 5);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// --- Ground (green grass) ---
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshLambertMaterial({ color: 0x4caf50 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Player (a cute boy) ---
const player = new THREE.Group();
player.position.y = 0;
scene.add(player);

// Body (blue shirt)
const body = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.35, 0.8, 16),
  new THREE.MeshToonMaterial({ color: 0x4488ff })
);
body.position.y = 0.7;
body.castShadow = true;
player.add(body);

// Head (skin color)
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 32, 32),
  new THREE.MeshToonMaterial({ color: 0xffcc99 })
);
head.position.y = 1.45;
head.castShadow = true;
player.add(head);

// Hair (brown, on top of head)
const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.37, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
  new THREE.MeshToonMaterial({ color: 0x4a2800 })
);
hair.position.y = 1.48;
player.add(hair);

// Fringe (front hair)
const fringe = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.1, 0.15),
  new THREE.MeshToonMaterial({ color: 0x4a2800 })
);
fringe.position.set(0, 1.65, 0.25);
player.add(fringe);

// Eyes
const eyeGeom = new THREE.SphereGeometry(0.07, 16, 16);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pupilGeom = new THREE.SphereGeometry(0.04, 16, 16);
const pupilMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

for (const side of [-1, 1]) {
  const eye = new THREE.Mesh(eyeGeom, eyeMat);
  eye.position.set(side * 0.13, 1.48, 0.3);
  player.add(eye);
  const pupil = new THREE.Mesh(pupilGeom, pupilMat);
  pupil.position.set(0, 0, 0.06);
  eye.add(pupil);
}

// Smile
const smileCurve = new THREE.EllipseCurve(0, 0, 0.1, 0.06, Math.PI, 0, false, 0);
const smilePoints = smileCurve.getPoints(20).map((p) => new THREE.Vector3(p.x, p.y + 1.35, 0.34));
const smileLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(smilePoints),
  new THREE.LineBasicMaterial({ color: 0xcc6655, linewidth: 2 })
);
player.add(smileLine);

// Legs (short pants)
for (const side of [-1, 1]) {
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8),
    new THREE.MeshToonMaterial({ color: 0x335533 })
  );
  leg.position.set(side * 0.15, 0.25, 0);
  leg.castShadow = true;
  player.add(leg);

  // Shoes
  const shoe = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshToonMaterial({ color: 0xcc3333 })
  );
  shoe.position.set(side * 0.15, 0.05, 0.05);
  shoe.scale.set(1, 0.6, 1.3);
  player.add(shoe);
}

// Arms
const leftArm = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.07, 0.5, 8),
  new THREE.MeshToonMaterial({ color: 0xffcc99 })
);
leftArm.position.set(-0.38, 0.85, 0);
leftArm.rotation.z = 0.3;
player.add(leftArm);

const rightArm = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.07, 0.5, 8),
  new THREE.MeshToonMaterial({ color: 0xffcc99 })
);
rightArm.position.set(0.38, 0.85, 0);
rightArm.rotation.z = -0.3;
player.add(rightArm);

// --- Stars to collect ---
const stars: THREE.Mesh[] = [];
const starColors = [0xffd700, 0xff69b4, 0x00bfff, 0x7cfc00, 0xff8c00, 0xda70d6, 0x00fa9a, 0xff4500, 0x1e90ff, 0xffa07a];

function createStar(color: number): THREE.Mesh {
  // Make a simple "star" from two overlapping tetrahedra
  const group = new THREE.Mesh();
  const geom = new THREE.OctahedronGeometry(0.4, 0);
  const mat = new THREE.MeshToonMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

for (let i = 0; i < 10; i++) {
  const star = createStar(starColors[i]);
  // Spread stars randomly on the ground
  star.position.set((Math.random() - 0.5) * 16, 1, (Math.random() - 0.5) * 16);
  scene.add(star);
  stars.push(star);
}

// --- Some trees for decoration ---
function createTree(x: number, z: number) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1, 8),
    new THREE.MeshLambertMaterial({ color: 0x8b4513 })
  );
  trunk.position.set(x, 0.5, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 1.5, 8),
    new THREE.MeshToonMaterial({ color: 0x228b22 })
  );
  leaves.position.set(x, 1.8, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

// Place trees around the edges
for (const pos of [[-6, -6], [6, -6], [-6, 6], [6, 6], [-8, 0], [8, 0], [0, -8], [0, 8]]) {
  createTree(pos[0], pos[1]);
}

// --- Clouds ---
function createCloud(x: number, y: number, z: number) {
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const group = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 16, 16), cloudMat);
    puff.position.set(i * 0.6 - 1.2, Math.random() * 0.3, Math.random() * 0.3);
    group.add(puff);
  }
  group.position.set(x, y, z);
  scene.add(group);
  return group;
}

const clouds = [
  createCloud(-5, 7, -10),
  createCloud(4, 8, -8),
  createCloud(-2, 9, -12),
];

// --- Input ---
const keys: Record<string, boolean> = {};
addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// --- Game state ---
let score = 0;
const scoreEl = document.getElementById("score")!;
const instructionsEl = document.getElementById("instructions")!;
const speed = 5;

// --- Particle burst on collect ---
const particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

function spawnParticles(pos: THREE.Vector3, color: number) {
  for (let i = 0; i < 12; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color })
    );
    p.position.copy(pos);
    scene.add(p);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 6
    );
    particles.push({ mesh: p, vel, life: 1 });
  }
}

// --- Game loop ---
let lastTime = 0;

function animate(time: number) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Move player
  const dir = new THREE.Vector3();
  if (keys["arrowup"] || keys["w"]) dir.z -= 1;
  if (keys["arrowdown"] || keys["s"]) dir.z += 1;
  if (keys["arrowleft"] || keys["a"]) dir.x -= 1;
  if (keys["arrowright"] || keys["d"]) dir.x += 1;
  const isMoving = dir.length() > 0;
  if (isMoving) {
    dir.normalize();
    player.position.x += dir.x * speed * dt;
    player.position.z += dir.z * speed * dt;
    // Face movement direction
    player.rotation.y = Math.atan2(dir.x, -dir.z);
  }

  // Walking animation: swing legs and arms
  const swing = isMoving ? Math.sin(time * 0.012) * 0.6 : 0;
  leftArm.rotation.x = swing;
  rightArm.rotation.x = -swing;
  // Legs are at indices that we find by child position
  player.children.forEach((child) => {
    // Legs are green cylinders
    if ((child as THREE.Mesh).material &&
        ((child as THREE.Mesh).material as THREE.MeshToonMaterial).color &&
        ((child as THREE.Mesh).material as THREE.MeshToonMaterial).color.getHex() === 0x335533) {
      const legSide = child.position.x > 0 ? 1 : -1;
      child.rotation.x = legSide * swing * 0.8;
    }
  });

  // Keep player on the ground
  player.position.x = THREE.MathUtils.clamp(player.position.x, -18, 18);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -18, 18);

  // Gentle bob while walking
  player.position.y = isMoving ? Math.abs(Math.sin(time * 0.012)) * 0.1 : 0;

  // Spin and bob stars
  for (const star of stars) {
    star.rotation.y += 2 * dt;
    star.rotation.x += 1 * dt;
    star.position.y = 1 + Math.sin(time * 0.003 + star.position.x) * 0.3;
  }

  // Check star collection
  for (let i = stars.length - 1; i >= 0; i--) {
    const playerXZ = new THREE.Vector3(player.position.x, 0, player.position.z);
    const starXZ = new THREE.Vector3(stars[i].position.x, 0, stars[i].position.z);
    if (playerXZ.distanceTo(starXZ) < 1.2) {
      const star = stars[i];
      const color = (star.material as THREE.MeshToonMaterial).color.getHex();
      spawnParticles(star.position.clone(), color);
      scene.remove(star);
      stars.splice(i, 1);
      score++;
      scoreEl.textContent = `Stars: ${score} / 10`;
      if (score === 10) {
        scoreEl.textContent = "You collected all the stars! Great job!";
        instructionsEl.textContent = "";
      }
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vel.y -= 10 * dt; // gravity
    p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
    p.life -= dt * 2;
    p.mesh.scale.setScalar(Math.max(p.life, 0));
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }

  // Drift clouds
  for (const cloud of clouds) {
    cloud.position.x += 0.3 * dt;
    if (cloud.position.x > 15) cloud.position.x = -15;
  }

  // Camera follows player smoothly
  const camTarget = new THREE.Vector3(player.position.x * 0.5, 8, player.position.z + 12);
  camera.position.lerp(camTarget, 2 * dt);
  camera.lookAt(player.position.x * 0.5, 0, player.position.z);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// --- Handle resize ---
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
