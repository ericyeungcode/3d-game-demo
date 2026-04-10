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

// --- Player (a cute bouncing ball) ---
const player = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshToonMaterial({ color: 0xff6b6b })
);
player.position.y = 0.5;
player.castShadow = true;
scene.add(player);

// Eyes on the ball
const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pupilGeom = new THREE.SphereGeometry(0.06, 16, 16);
const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

for (const side of [-1, 1]) {
  const eye = new THREE.Mesh(eyeGeom, eyeMat);
  eye.position.set(side * 0.18, 0.15, 0.4);
  player.add(eye);
  const pupil = new THREE.Mesh(pupilGeom, pupilMat);
  pupil.position.set(0, 0, 0.1);
  eye.add(pupil);
}

// Smile
const smileCurve = new THREE.EllipseCurve(0, -0.05, 0.15, 0.1, Math.PI, 0, false, 0);
const smilePoints = smileCurve.getPoints(20).map((p) => new THREE.Vector3(p.x, p.y, 0.48));
const smileLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(smilePoints),
  new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
);
player.add(smileLine);

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
  if (dir.length() > 0) {
    dir.normalize();
    player.position.x += dir.x * speed * dt;
    player.position.z += dir.z * speed * dt;
    // Rotate player in movement direction
    player.rotation.z = -dir.x * 0.3;
    player.rotation.x = dir.z * 0.3;
  } else {
    player.rotation.z *= 0.9;
    player.rotation.x *= 0.9;
  }

  // Keep player on the ground
  player.position.x = THREE.MathUtils.clamp(player.position.x, -18, 18);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -18, 18);

  // Bounce animation
  player.position.y = 0.5 + Math.abs(Math.sin(time * 0.005)) * 0.15;

  // Spin and bob stars
  for (const star of stars) {
    star.rotation.y += 2 * dt;
    star.rotation.x += 1 * dt;
    star.position.y = 1 + Math.sin(time * 0.003 + star.position.x) * 0.3;
  }

  // Check star collection
  for (let i = stars.length - 1; i >= 0; i--) {
    if (player.position.distanceTo(stars[i].position) < 1.0) {
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
