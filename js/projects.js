/* ==========================================================================
   MDZN Portfolio — Projects Module
   Supabase integration for fetching and rendering project data
   ========================================================================== */

// ==========================================================================
// CONFIGURATION — Replace with your Supabase credentials
// ==========================================================================
const SUPABASE_URL = 'https://ceexzutcamztvkpotwty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZXh6dXRjYW16dHZrcG90d3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTk2NDAsImV4cCI6MjA4MTkzNTY0MH0.TigK8iVPHMr0TR4LH7C2bRgvfzEVhzi6yUjuNdYub2g';

// ==========================================================================
// State
// ==========================================================================
let allProjects = [];
let currentFilter = 'all';

// ==========================================================================
// Initialize
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initProjects();
    initFilters();
});

async function initProjects() {
    try {
        // Fetch projects from Supabase
        allProjects = await fetchProjects();
        
        // Render all projects
        renderProjects(allProjects);
    } catch (error) {
        console.error('Error loading projects:', error);
        showError();
    }
}

// ==========================================================================
// Supabase API
// ==========================================================================
async function fetchProjects() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?select=*&order=display_order.asc`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

// ==========================================================================
// Rendering
// ==========================================================================
function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="projects__empty">
                <p>No projects found.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = projects.map((project, index) => `
        <article class="project-card" style="animation-delay: ${index * 0.1}s" data-tags="${(project.tags || []).join(' ').toLowerCase()}">
            <div class="project-card__image-wrapper">
                <img 
                    src="${project.image_url || 'https://via.placeholder.com/600x375'}" 
                    alt="${project.title}" 
                    class="project-card__image"
                    loading="lazy"
                >
                <div class="project-card__overlay">
                    <a href="${project.project_url || '#'}" class="project-card__link" target="_blank" rel="noopener noreferrer">
                        View Project
                    </a>
                </div>
            </div>
            <div class="project-card__content">
                <h3 class="project-card__title">${project.title}</h3>
                <p class="project-card__description">${project.description}</p>
                <div class="project-card__tags">
                    ${renderTags(project.tags)}
                </div>
            </div>
        </article>
    `).join('');
}

function renderTags(tags) {
    if (!tags || !Array.isArray(tags)) return '';
    
    // Color mapping for different tag types
    const tagColors = {
        'unity': 'cyan',
        'game design': 'cyan',
        'game-design': 'cyan',
        'web': 'purple',
        'html': 'purple',
        'css': 'purple',
        'javascript': 'purple',
        'product design': 'orange',
        'product-design': 'orange',
        'ux': 'orange',
        'ui': 'orange',
        'figma': 'orange',
        'hardware': 'green',
        'arduino': 'green'
    };

    return tags.map(tag => {
        const colorClass = tagColors[tag.toLowerCase()] || '';
        return `<span class="tag ${colorClass ? `tag--${colorClass}` : ''}">${tag}</span>`;
    }).join('');
}

function showError() {
    const grid = document.getElementById('projects-grid');
    
    if (!grid) return;

    grid.innerHTML = `
        <div class="projects__error">
            <p>Unable to load projects. Please try again later.</p>
            <button onclick="initProjects()" class="btn btn--ghost">Retry</button>
        </div>
    `;
}

// ==========================================================================
// Filtering
// ==========================================================================
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Update active state
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            // Filter projects
            currentFilter = filter;
            filterProjects(filter);
        });
    });
}

function filterProjects(filter) {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        const tags = card.dataset.tags || '';
        
        if (filter === 'all') {
            card.style.display = '';
            card.style.opacity = '1';
        } else {
            // Check if any tag contains the filter term
            const matchesFilter = tags.includes(filter.toLowerCase()) || 
                                  matchesCategory(tags, filter);
            
            if (matchesFilter) {
                card.style.display = '';
                card.style.opacity = '1';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Map filter buttons to tag keywords
function matchesCategory(tags, filter) {
    const categoryMap = {
        'game-design': ['unity', 'game', 'game design'],
        'web': ['web', 'html', 'css', 'javascript', 'js', 'react'],
        'product-design': ['product', 'ux', 'ui', 'figma', 'design'],
        'hardware': ['arduino', 'hardware', 'electronics', 'physical']
    };

    const keywords = categoryMap[filter] || [];
    return keywords.some(keyword => tags.includes(keyword));
}

// ==========================================================================
// Demo Mode (for testing without Supabase)
// ==========================================================================
// Uncomment this function and call it instead of fetchProjects() to test
// with sample data before setting up Supabase

/*
function getDemoProjects() {
    return [
        {
            id: 1,
            title: 'Neon Dawn',
            description: 'A 2D cyberpunk sidescroller shooter with PSX-style graphics and atmospheric gameplay.',
            tags: ['Unity', 'Game Design', 'C#'],
            image_url: 'https://via.placeholder.com/600x375/0a0a0f/00d4ff?text=Neon+Dawn',
            project_url: '#',
            featured: true,
            display_order: 1
        },
        {
            id: 2,
            title: 'Free Games Explorer',
            description: 'PlayStation Magazine-inspired free-to-play games browser with API integration.',
            tags: ['Web', 'JavaScript', 'API'],
            image_url: 'https://via.placeholder.com/600x375/0a0a0f/b347ea?text=Free+Games+Explorer',
            project_url: '#',
            featured: false,
            display_order: 2
        },
        {
            id: 3,
            title: 'Self-Care Tracker',
            description: 'Web app with Supabase backend, 3D plant visualization, and comprehensive theming.',
            tags: ['Web', 'JavaScript', 'Three.js'],
            image_url: 'https://via.placeholder.com/600x375/0a0a0f/ff6b35?text=Self-Care+Tracker',
            project_url: '#',
            featured: false,
            display_order: 3
        },
        {
            id: 4,
            title: 'Gesture Lighting',
            description: 'Arduino-based gesture-controlled RGB lighting system under €20 budget.',
            tags: ['Arduino', 'Hardware', 'Electronics'],
            image_url: 'https://via.placeholder.com/600x375/0a0a0f/00ff88?text=Gesture+Lighting',
            project_url: '#',
            featured: false,
            display_order: 4
        },
        {
            id: 5,
            title: 'Bus Stop Concept',
            description: 'Public transport shelter design for Tallinn with focus on accessibility and safety.',
            tags: ['Product Design', 'UX', 'Figma'],
            image_url: 'https://via.placeholder.com/600x375/0a0a0f/ff6b35?text=Bus+Stop+Concept',
            project_url: '#',
            featured: false,
            display_order: 5
        }
    ];
}
*/