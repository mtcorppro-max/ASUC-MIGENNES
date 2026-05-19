import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('hero3d');
if (!canvas) throw new Error('hero3d canvas not found');

// Graceful WebGL fallback
try {
    const test = document.createElement('canvas');
    const gl = test.getContext('webgl') || test.getContext('experimental-webgl');
    if (!gl) throw new Error('no webgl');
} catch {
    canvas.style.display = 'none';
    throw new Error('WebGL unavailable — 3D hero disabled');
}

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
camera.position.set(0, 0, 0);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 2.0);
sun.position.set(5, 10, 5);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x99ddff, 0.5);
fill.position.set(-4, -2, -3);
scene.add(fill);

// Fewer balls on mobile for performance
const isMobile = window.innerWidth < 768;
const BALL_COUNT = isMobile ? 8 : 14;
const DEPTH = 70;      // total tunnel depth (world units)
const SPEED = 7;       // units per second
const FADE_NEAR = 5;   // fade out when this close to camera
const FADE_FAR  = 12;  // fade in when this far from back

// Spatial distribution using golden angle so balls don't overlap
const GOLDEN = 2.618;
const spatial = Array.from({ length: BALL_COUNT }, (_, i) => ({
    x: Math.sin(i * GOLDEN)            * (i % 3) * 2.2 * 1.3,
    y: Math.cos(i * 1.618 + Math.PI/3) * ((i + 1) % 4) * 0.9,
}));

// Ball state — each ball has a start X (far) and end X (close) for lateral drift
const balls = Array.from({ length: BALL_COUNT }, (_, i) => {
    const xBase = spatial[i].x;
    // Drift 3–7 units to the right as balls approach (negative = left, rare)
    const driftDir  = i % 5 === 0 ? -1 : 1;
    const driftDist = 3 + (i % 4) * 1.2;
    return {
        mesh:   null,
        z:      -(DEPTH / BALL_COUNT) * i - 3,
        xStart: xBase,
        xEnd:   xBase + driftDir * driftDist,
        y:      spatial[i].y,
        rx:     Math.random() * Math.PI * 2,
        ry:     Math.random() * Math.PI * 2,
        rsx:    (Math.random() - 0.5) * 1.5,
        rsy:    (Math.random() - 0.5) * 1.5,
    };
});

// Load GLB
new GLTFLoader().load(
    'models/tennis_ball.glb',
    gltf => {
        // Compute natural size once to auto-scale
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const bsize = bbox.getSize(new THREE.Vector3());
        const naturalMax = Math.max(bsize.x, bsize.y, bsize.z);
        const targetDiam = 0.9;   // desired diameter in world units
        const autoScale  = naturalMax > 0 ? targetDiam / naturalMax : 0.4;

        balls.forEach(ball => {
            const obj = gltf.scene.clone(true);
            // Clone materials so each ball can have independent opacity
            obj.traverse(child => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.depthWrite  = false;
                }
            });
            obj.scale.setScalar(autoScale);
            obj.position.set(ball.x, ball.y, ball.z);
            scene.add(obj);
            ball.mesh = obj;
        });
    },
    undefined,
    err => console.warn('Impossible de charger tennis_ball.glb :', err)
);

// Resize handler
function resize() {
    const hero = canvas.parentElement;
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize, { passive: true });
resize();

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05); // cap delta to avoid jumps

    balls.forEach(ball => {
        if (!ball.mesh) return;

        // Move ball towards camera (+Z direction)
        ball.z += SPEED * dt;

        // Wrap: teleport back when it passes the camera
        if (ball.z > FADE_NEAR + 1) ball.z -= DEPTH;

        // Rotate
        ball.rx += ball.rsx * dt;
        ball.ry += ball.rsy * dt;

        // Interpolate X from start (far) to end (close) for lateral drift
        const progress = Math.max(0, Math.min(1, (ball.z + DEPTH) / DEPTH));
        const currentX = ball.xStart + (ball.xEnd - ball.xStart) * progress;

        ball.mesh.position.set(currentX, ball.y, ball.z);
        ball.mesh.rotation.set(ball.rx, ball.ry, 0);

        // Opacity: fade in at far end, fade out when very close
        const depth = -ball.z; // positive = in front of camera
        let opacity = 1;
        if (depth < FADE_NEAR)          opacity = Math.max(0, depth / FADE_NEAR);
        if (depth > DEPTH - FADE_FAR)   opacity = Math.max(0, (DEPTH - depth) / FADE_FAR);

        ball.mesh.traverse(child => {
            if (child.isMesh) child.material.opacity = opacity;
        });
    });

    renderer.render(scene, camera);
}
animate();
