// Three.js 3D Scene Setup
let scene, camera, renderer;
let particles = [];
let lines = [];

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e27, 0.002);

    // Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.z = 50;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x0a0e27, 0.1);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Create 3D elements
    createParticles();
    createConnectingLines();
    createGeometry();

    // Animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color = new THREE.Color();

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;

        // Gradient colors from cyan to purple to magenta
        const hue = Math.random();
        color.setHSL(hue * 0.3 + 0.5, 1, 0.5);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function createConnectingLines() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const particlePositions = particles.geometry.attributes.position.array;
    const particleCount = particlePositions.length / 3;

    // Create lines between nearby particles
    for (let i = 0; i < particleCount; i++) {
        const x1 = particlePositions[i * 3];
        const y1 = particlePositions[i * 3 + 1];
        const z1 = particlePositions[i * 3 + 2];

        for (let j = i + 1; j < particleCount; j++) {
            const x2 = particlePositions[j * 3];
            const y2 = particlePositions[j * 3 + 1];
            const z2 = particlePositions[j * 3 + 2];

            const distance = Math.sqrt(
                Math.pow(x2 - x1, 2) + 
                Math.pow(y2 - y1, 2) + 
                Math.pow(z2 - z1, 2)
            );

            if (distance < 60) {
                positions.push(x1, y1, z1, x2, y2, z2);
                
                // Color based on distance
                const colorValue = distance / 60;
                colors.push(0.0, 1 - colorValue * 0.5, 1, colorValue * 0.5, 0.5, 1);
            }
        }
    }

    if (positions.length > 0) {
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.2
        });

        const lineSegments = new THREE.LineSegments(geometry, material);
        scene.add(lineSegments);
    }
}

function createGeometry() {
    // Create rotating geometries
    
    // Rotating cube
    const cubeGeometry = new THREE.BoxGeometry(30, 30, 30);
    const cubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.x = -40;
    cube.rotation.x = Math.random() * Math.PI;
    cube.rotation.y = Math.random() * Math.PI;
    cube.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005
    };
    scene.add(cube);

    // Rotating octahedron
    const octaGeometry = new THREE.OctahedronGeometry(25, 0);
    const octaMaterial = new THREE.MeshPhongMaterial({
        color: 0xff006e,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    const octahedron = new THREE.Mesh(octaGeometry, octaMaterial);
    octahedron.position.x = 40;
    octahedron.position.y = 20;
    octahedron.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.004,
        y: (Math.random() - 0.5) * 0.004,
        z: (Math.random() - 0.5) * 0.004
    };
    scene.add(octahedron);

    // Rotating icosahedron
    const icoGeometry = new THREE.IcosahedronGeometry(20, 0);
    const icoMaterial = new THREE.MeshPhongMaterial({
        color: 0x7c3aed,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    icosahedron.position.y = -30;
    icosahedron.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: (Math.random() - 0.5) * 0.003
    };
    scene.add(icosahedron);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d9ff, 1, 100);
    pointLight1.position.set(50, 50, 50);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff006e, 1, 100);
    pointLight2.position.set(-50, -50, 50);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x7c3aed, 1, 100);
    pointLight3.position.set(0, 50, -50);
    scene.add(pointLight3);
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate particles
    if (particles) {
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0002;
    }

    // Rotate geometries
    scene.children.forEach(child => {
        if (child.userData.rotationSpeed) {
            child.rotation.x += child.userData.rotationSpeed.x;
            child.rotation.y += child.userData.rotationSpeed.y;
            child.rotation.z += child.userData.rotationSpeed.z;
        }
    });

    // Gentle camera rotation
    camera.position.x = Math.sin(Date.now() * 0.0001) * 30;
    camera.position.z = 50 + Math.cos(Date.now() * 0.0001) * 20;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Countdown Timer
function updateCountdown() {
    // Calculate launch date: 100 days from now
    const today = new Date('2026-01-03');
    const launchDate = new Date(today);
    launchDate.setDate(launchDate.getDate() + 100);
    const launchTime = launchDate.getTime();
    
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = launchTime - now;

        if (distance < 0) {
            clearInterval(timer);
            document.querySelector('.countdown-timer').innerHTML = '<div style="color: #00ff88; font-size: 1.5rem; font-weight: bold;">🚀 CYBRIX IS LIVE! 🚀</div>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// Modal Functionality
const modal = document.getElementById('notify-modal');
const notifyBtn = document.getElementById('notify-btn');
const closeBtn = document.querySelector('.close');
const notifyForm = document.getElementById('notify-form');
const successMessage = document.getElementById('success-message');

notifyBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

notifyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = notifyForm.querySelector('input[type="email"]').value;
    
    // Simulate email submission
    console.log('Email submitted:', email);
    
    notifyForm.style.display = 'none';
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        modal.style.display = 'none';
        notifyForm.style.display = 'flex';
        successMessage.style.display = 'none';
        notifyForm.reset();
    }, 3000);
});

// Learn More Button - Smooth Scroll to Features
document.getElementById('learn-btn').addEventListener('click', () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
});

// Smooth scroll for nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        if (targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Parallax effect on scroll
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    if (particles) {
        particles.rotation.z += scrollY * 0.00001;
    }
    
    // Fade out 3D canvas as user scrolls
    const container = document.getElementById('canvas-container');
    const scrollPercent = (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    if (container) {
        container.style.opacity = Math.max(0, 1 - scrollPercent / 100);
    }
});

// Mouse interaction with 3D scene
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if (particles) {
        particles.rotation.x += mouseY * 0.00005;
        particles.rotation.y += mouseX * 0.00005;
    }
});

// Animated page load
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    updateCountdown();
    
    // Add subtle animation on page load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 1s ease-in';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Performance optimization - reduce particle count on mobile
if (window.innerWidth < 768) {
    // Mobile optimization handled by CSS media queries
}
