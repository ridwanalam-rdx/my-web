// 3D Scene Setup
let scene, camera, renderer, models = [];

function init3D() {
    // Hero 3D Scene
    const heroCanvas = document.getElementById('hero-canvas');
    if (heroCanvas) {
        setupHeroScene(heroCanvas);
    }
    
    // Model preview canvases
    const modelCanvases = document.querySelectorAll('.model-canvas');
    modelCanvases.forEach(canvas => {
        setupModelPreview(canvas);
    });
}

function setupHeroScene(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0);
    
    // Create animated geometry
    const geometry = new THREE.IcosahedronGeometry(2, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ccff,
        transparent: true,
        opacity: 0.8,
        wireframe: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Add wireframe overlay
    const wireframeGeometry = new THREE.IcosahedronGeometry(2.1, 1);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x0066cc,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframeMesh);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00ccff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xff6b35, 0.8, 100);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);
    
    camera.position.z = 6;
    
    // Animation
    function animate() {
        requestAnimationFrame(animate);
        
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
        wireframeMesh.rotation.x -= 0.003;
        wireframeMesh.rotation.y -= 0.007;
        
        // Floating animation
        mesh.position.y = Math.sin(Date.now() * 0.001) * 0.3;
        wireframeMesh.position.y = Math.cos(Date.now() * 0.001) * 0.2;
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
}

function setupModelPreview(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0);
    
    const modelType = canvas.getAttribute('data-model');
    let geometry, material, mesh;
    
    switch(modelType) {
        case 'cube':
            geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            material = new THREE.MeshPhongMaterial({ 
                color: 0x00ccff,
                transparent: true,
                opacity: 0.8
            });
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(1, 32, 32);
            material = new THREE.MeshPhongMaterial({ 
                color: 0xff6b35,
                transparent: true,
                opacity: 0.9,
                emissive: 0x331100
            });
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
            material = new THREE.MeshPhongMaterial({ 
                color: 0x9966cc,
                transparent: true,
                opacity: 0.8
            });
            break;
        default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshPhongMaterial({ color: 0x00ccff });
    }
    
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);
    
    camera.position.z = 3;
    
    // Animation
    function animate() {
        requestAnimationFrame(animate);
        
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
        
        if (modelType === 'sphere') {
            // Pulsing effect for energy sphere
            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
            mesh.scale.set(scale, scale, scale);
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
}

// Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Initialize 3D scenes
    init3D();
    
    // Button interactions
    const buttons = document.querySelectorAll('.btn-download, .btn-tool');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Check if user is logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            if (!isLoggedIn) {
                alert('Please login to access premium features!');
                window.location.href = 'login.html';
                return;
            }
            
            // Simulate download/tool action
            this.innerHTML = 'Processing...';
            this.disabled = true;
            
            setTimeout(() => {
                this.innerHTML = this.classList.contains('btn-download') ? 'Downloaded!' : 'Completed!';
                setTimeout(() => {
                    this.innerHTML = this.classList.contains('btn-download') ? 'Download' : 'Use Tool';
                    this.disabled = false;
                }, 2000);
            }, 1500);
        });
    });
    
    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        
        if (heroSection) {
            const rate = scrolled * -0.5;
            heroSection.style.transform = `translateY(${rate}px)`;
        }
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe cards for animation
    const cards = document.querySelectorAll('.model-card, .tool-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Performance monitoring (simulated)
function updatePerformanceMetrics() {
    const metrics = document.querySelectorAll('.metric-fill');
    
    setInterval(() => {
        metrics.forEach(metric => {
            const randomValue = Math.floor(Math.random() * 40) + 30; // 30-70%
            metric.style.width = randomValue + '%';
            
            const valueSpan = metric.parentElement.parentElement.querySelector('.metric-value');
            if (valueSpan) {
                valueSpan.textContent = randomValue + '%';
            }
        });
    }, 3000);
}

// Initialize performance monitoring if on dashboard
if (window.location.pathname.includes('dashboard')) {
    updatePerformanceMetrics();
}