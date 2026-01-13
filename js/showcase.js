/* ==========================================================================
   MDZN Portfolio — Showcase Carousel
   Animated gallery that cycles through random works on the hero
   ========================================================================== */

// ==========================================================================
// CONFIGURATION
// ==========================================================================
const SUPABASE_URL = 'https://ceexzutcamztvkpotwty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZXh6dXRjYW16dHZrcG90d3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTk2NDAsImV4cCI6MjA4MTkzNTY0MH0.TigK8iVPHMr0TR4LH7C2bRgvfzEVhzi6yUjuNdYub2g';

// Carousel settings
const SLIDE_DURATION = 4000; // ms between slides
const TRANSITION_DURATION = 600; // ms for fade transition
const MAX_SLIDES = 10; // Limit slides for performance

// ==========================================================================
// State
// ==========================================================================
let showcaseImages = [];
let currentSlide = 0;
let carouselInterval = null;

// ==========================================================================
// Initialize
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initShowcase();
});

async function initShowcase() {
    try {
        // Fetch from both projects and works
        const [projects, works] = await Promise.all([
            fetchShowcaseProjects(),
            fetchShowcaseWorks()
        ]);

        // Combine and filter for images only (no videos/gifs for performance)
        const allItems = [
            ...projects.filter(p => p.image_url && !p.image_url.endsWith('.gif') && !p.image_url.endsWith('.mp4')).map(p => ({
                url: p.image_url,
                title: p.title,
                link: p.project_url || 'projects.html'
            })),
            ...works.filter(w => w.image_url && !w.image_url.endsWith('.gif') && !w.image_url.endsWith('.mp4')).map(w => ({
                url: w.image_url,
                title: w.title,
                link: 'projects.html'
            }))
        ];

        if (allItems.length === 0) {
            hideShowcase();
            return;
        }

        // Shuffle and limit
        shuffleArray(allItems);
        showcaseImages = allItems.slice(0, MAX_SLIDES);

        // Render and start carousel
        renderShowcase();
        startCarousel();

    } catch (error) {
        console.error('Error loading showcase:', error);
        hideShowcase();
    }
}

// ==========================================================================
// Supabase API
// ==========================================================================
async function fetchShowcaseProjects() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?select=title,image_url,project_url&order=display_order.asc`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) return [];
    return await response.json();
}

async function fetchShowcaseWorks() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/works?select=title,image_url&order=display_order.asc`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) return [];
    return await response.json();
}

// ==========================================================================
// Rendering
// ==========================================================================
function renderShowcase() {
    const container = document.getElementById('showcase-images');
    const indicators = document.getElementById('showcase-indicators');

    if (!container || !indicators) return;

    // Render images
    container.innerHTML = showcaseImages.map((img, index) => `
        <a href="${img.link}" class="showcase__slide ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${img.url}" alt="${img.title}" loading="${index === 0 ? 'eager' : 'lazy'}">
            <span class="showcase__slide-title">${img.title}</span>
        </a>
    `).join('');

    // Render indicator dots
    indicators.innerHTML = showcaseImages.map((_, index) => `
        <button 
            class="showcase__dot ${index === 0 ? 'active' : ''}" 
            data-index="${index}"
            aria-label="Go to slide ${index + 1}"
        ></button>
    `).join('');

    // Add click handlers to dots
    indicators.querySelectorAll('.showcase__dot').forEach(dot => {
        dot.addEventListener('click', () => {
            goToSlide(parseInt(dot.dataset.index));
            resetInterval();
        });
    });
}

function hideShowcase() {
    const showcase = document.getElementById('showcase-carousel');
    if (showcase) {
        showcase.style.display = 'none';
    }
    
    // Make hero full-width centered when no carousel
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.classList.add('hero--no-showcase');
    }
}

// ==========================================================================
// Carousel Logic
// ==========================================================================
function startCarousel() {
    if (showcaseImages.length <= 1) return;
    
    carouselInterval = setInterval(() => {
        nextSlide();
    }, SLIDE_DURATION);
}

function resetInterval() {
    clearInterval(carouselInterval);
    startCarousel();
}

function nextSlide() {
    const next = (currentSlide + 1) % showcaseImages.length;
    goToSlide(next);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.showcase__slide');
    const dots = document.querySelectorAll('.showcase__dot');

    // Remove active from current
    slides[currentSlide]?.classList.remove('active');
    dots[currentSlide]?.classList.remove('active');

    // Set new current
    currentSlide = index;

    // Add active to new
    slides[currentSlide]?.classList.add('active');
    dots[currentSlide]?.classList.add('active');
}

// ==========================================================================
// Utilities
// ==========================================================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Pause carousel when tab is not visible (performance)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(carouselInterval);
    } else {
        startCarousel();
    }
});