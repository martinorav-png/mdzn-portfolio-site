/* ==========================================================================
   MDZN Portfolio – Aero Effects Engine
   Dynamic particles, light effects, and interactive animations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initGlowEffects();
    initScrollEffects();
});

/* --------------------------------------------------------------------------
   Floating Particles (Vista-style sparkles)
   -------------------------------------------------------------------------- */
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 10 + 15;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${startX}px;
            top: ${startY}px;
            background: radial-gradient(circle, 
                rgba(255, 255, 255, 0.8) 0%, 
                rgba(186, 230, 253, 0.6) 50%, 
                transparent 100%
            );
            border-radius: 50%;
            pointer-events: none;
            animation: float-particle ${duration}s infinite ease-in-out ${delay}s;
            box-shadow: 0 0 ${size * 3}px rgba(255, 255, 255, 0.6);
            filter: blur(0.5px);
        `;
        
        container.appendChild(particle);
        particles.push(particle);
    }

    // Add particle animation keyframes
    if (!document.getElementById('particle-animations')) {
        const style = document.createElement('style');
        style.id = 'particle-animations';
        style.textContent = `
            @keyframes float-particle {
                0%, 100% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0;
                }
                10% {
                    opacity: 0.8;
                }
                50% {
                    transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -200 - 100}px) scale(1.5);
                    opacity: 1;
                }
                90% {
                    opacity: 0.8;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/* --------------------------------------------------------------------------
   Interactive Glow Effects
   -------------------------------------------------------------------------- */
function initGlowEffects() {
    const glowElements = document.querySelectorAll('.glass-panel, .glass-frame');
    
    glowElements.forEach(element => {
        element.addEventListener('mouseenter', function(e) {
            this.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 0 80px rgba(14, 165, 233, 0.4)
            `;
        });
        
        element.addEventListener('mouseleave', function(e) {
            this.style.boxShadow = `
                0 8px 32px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 0 60px rgba(14, 165, 233, 0.2)
            `;
        });
        
        // Add cursor tracking glow
        element.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const glow = this.querySelector('.cursor-glow') || createCursorGlow(this);
            glow.style.left = x + 'px';
            glow.style.top = y + 'px';
            glow.style.opacity = '1';
        });
        
        element.addEventListener('mouseleave', function(e) {
            const glow = this.querySelector('.cursor-glow');
            if (glow) {
                glow.style.opacity = '0';
            }
        });
    });
}

function createCursorGlow(parent) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.cssText = `
        position: absolute;
        width: 150px;
        height: 150px;
        margin: -75px 0 0 -75px;
        background: radial-gradient(circle, 
            rgba(255, 255, 255, 0.15) 0%, 
            transparent 70%
        );
        pointer-events: none;
        transition: opacity 0.3s ease;
        opacity: 0;
        z-index: 1;
    `;
    parent.style.position = 'relative';
    parent.appendChild(glow);
    return glow;
}

/* --------------------------------------------------------------------------
   Scroll-based Parallax Effects
   -------------------------------------------------------------------------- */
function initScrollEffects() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    function updateParallax() {
        const scrollY = window.pageYOffset;
        
        // Parallax bubbles
        const bubbles = document.querySelectorAll('.bubble');
        bubbles.forEach((bubble, index) => {
            const speed = 0.3 + (index * 0.1);
            const yPos = -(scrollY * speed);
            bubble.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        
        // Parallax rays
        const rays = document.querySelectorAll('.ray');
        rays.forEach((ray, index) => {
            const rotation = scrollY * 0.05 + (index * 120);
            ray.style.transform = `rotate(${rotation}deg)`;
        });
    }
}

/* --------------------------------------------------------------------------
   Dynamic Lens Flare Effect
   -------------------------------------------------------------------------- */
function createLensFlare() {
    const flare = document.createElement('div');
    flare.className = 'lens-flare';
    flare.style.cssText = `
        position: fixed;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, 
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(186, 230, 253, 0.2) 30%, 
            transparent 70%
        );
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: screen;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(flare);
    
    // Track mouse for flare position
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        flare.style.opacity = '1';
    });
    
    // Smooth animation
    function animate() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;
        
        flare.style.left = (currentX - 100) + 'px';
        flare.style.top = (currentY - 100) + 'px';
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Fade out when mouse stops
    let timeout;
    document.addEventListener('mousemove', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            flare.style.opacity = '0';
        }, 2000);
    });
}

// Initialize lens flare on desktop only
if (window.innerWidth > 768) {
    createLensFlare();
}

/* --------------------------------------------------------------------------
   Button Ripple Effect
   -------------------------------------------------------------------------- */
document.querySelectorAll('.btn--aero, .glass-button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-effect 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Ripple animation
if (!document.getElementById('ripple-animation')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation';
    style.textContent = `
        @keyframes ripple-effect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

/* --------------------------------------------------------------------------
   Performance Optimization
   -------------------------------------------------------------------------- */
// Reduce animations when page is not visible
document.addEventListener('visibilitychange', () => {
    const bubbles = document.querySelectorAll('.bubble');
    const particles = document.querySelectorAll('.particle');
    
    if (document.hidden) {
        bubbles.forEach(b => b.style.animationPlayState = 'paused');
        particles.forEach(p => p.style.animationPlayState = 'paused');
    } else {
        bubbles.forEach(b => b.style.animationPlayState = 'running');
        particles.forEach(p => p.style.animationPlayState = 'running');
    }
});

// Reduce motion for users who prefer it
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.bubble, .particle, .ray').forEach(el => {
        el.style.animation = 'none';
    });
}

console.log('🌈 Aero effects initialized');