import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Camera setup
const canvas = document.getElementById('motion-canvas');
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
);
camera.position.z = 5;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create animated objects
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({ 
    color: 0x667eea,
    shininess: 100
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Create a sphere
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x764ba2,
    shininess: 100
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.x = 2;
scene.add(sphere);

// Create a torus
const torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
const torusMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xff6b9d,
    shininess: 100
});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
torus.position.x = -2;
scene.add(torus);

// Animation variables
let isAnimating = true;
let animationSpeed = 1.0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        // Rotate the cube
        cube.rotation.x += 0.01 * animationSpeed;
        cube.rotation.y += 0.01 * animationSpeed;

        // Animate sphere - bounce up and down
        sphere.position.y = Math.sin(Date.now() * 0.001 * animationSpeed) * 1;
        sphere.rotation.x += 0.02 * animationSpeed;

        // Animate torus - rotate and orbit
        torus.rotation.x += 0.02 * animationSpeed;
        torus.rotation.y += 0.01 * animationSpeed;
        torus.position.y = Math.cos(Date.now() * 0.001 * animationSpeed) * 1;
    }

    controls.update();
    renderer.render(scene, camera);
}

// Controls
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

playBtn.addEventListener('click', () => {
    isAnimating = true;
});

pauseBtn.addEventListener('click', () => {
    isAnimating = false;
});

resetBtn.addEventListener('click', () => {
    cube.rotation.set(0, 0, 0);
    sphere.position.set(2, 0, 0);
    sphere.rotation.set(0, 0, 0);
    torus.position.set(-2, 0, 0);
    torus.rotation.set(0, 0, 0);
    camera.position.set(0, 0, 5);
    controls.reset();
});

speedSlider.addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    speedValue.textContent = `${animationSpeed.toFixed(1)}x`;
});

// Handle window resize
window.addEventListener('resize', () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
});

// Start animation
animate();
