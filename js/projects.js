/* ==========================================================================
   MDZN Portfolio — Projects Module
   Supabase integration for fetching and rendering project data
   ========================================================================== */

// ==========================================================================
// CONFIGURATION — Replace with your Supabase credentials
// ==========================================================================
const SUPABASE_URL = 'https://ceexzutcamztvkpotwty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZXh6dXRjYW16dHZrcG90d3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTk2NDAsImV4cCI6MjA4MTkzNTY0MH0.TigK8iVPHMr0TR4LH7C2bRgvfzEVhzi6yUjuNdYub2g';
const STORAGE_BUCKET = 'portfolio-images';

// ==========================================================================
// State
// ==========================================================================
let allProjects = [];
let currentFilter = 'all';
let galleryImages = [];
let currentLightboxIndex = 0;

// ==========================================================================
// Initialize
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initProjects();
    initFilters();
    initModal();
    initLightbox();
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

async function fetchGalleryImages(folderPath) {
    console.log('Fetching gallery from folder:', folderPath);
    
    const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/list/${STORAGE_BUCKET}`,
        {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prefix: folderPath + '/',
                limit: 100,
                offset: 0
            })
        }
    );

    console.log('Response status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const files = await response.json();
    console.log('Files returned:', files);
    
    // Filter out folders and build full URLs
    return files
        .filter(file => file.name && !file.name.endsWith('/') && file.id)
        .map(file => ({
            name: file.name,
            url: `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${folderPath}/${file.name}`,
            type: getFileType(file.name)
        }));
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['gif'].includes(ext)) return 'gif';
    return 'image';
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
        <article class="project-card" 
                 style="animation-delay: ${index * 0.1}s" 
                 data-tags="${(project.tags || []).join(' ').toLowerCase()}"
                 data-gallery-folder="${project.gallery_folder || ''}"
                 data-project-url="${project.project_url || ''}"
                 data-title="${project.title}">
            <div class="project-card__image-wrapper">
                <img 
                    src="${project.image_url || 'https://via.placeholder.com/600x375'}" 
                    alt="${project.title}" 
                    class="project-card__image"
                    loading="lazy"
                >
                <div class="project-card__overlay">
                    ${project.gallery_folder 
                        ? `<button class="project-card__link" data-open-gallery>View Gallery</button>`
                        : project.project_url 
                            ? `<a href="${project.project_url}" class="project-card__link" target="_blank" rel="noopener noreferrer">View Project</a>`
                            : ''
                    }
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

    // Add click handlers for gallery cards
    grid.querySelectorAll('[data-open-gallery]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.project-card');
            const folder = card.dataset.galleryFolder;
            const title = card.dataset.title;
            if (folder) openGalleryModal(folder, title);
        });
    });
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
        'adverts': 'green',
        'advert': 'green',
        'poster': 'green',
        'graphic design': 'green',
        'branding': 'green',
        'animation': 'cyan'
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
        'adverts': ['advert', 'adverts', 'advertisement', 'poster', 'marketing', 'graphic design', 'branding']
    };

    const keywords = categoryMap[filter] || [];
    return keywords.some(keyword => tags.includes(keyword));
}

// ==========================================================================
// Gallery Modal
// ==========================================================================
function initModal() {
    const modal = document.getElementById('gallery-modal');
    if (!modal) return;

    // Close on backdrop click or close button
    modal.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeGalleryModal);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeGalleryModal();
            closeLightbox();
        }
    });
}

async function openGalleryModal(folderPath, title) {
    const modal = document.getElementById('gallery-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalGallery = document.getElementById('modal-gallery');

    if (!modal || !modalGallery) return;

    // Show modal with loading state
    modalTitle.textContent = title;
    modalGallery.innerHTML = `
        <div class="projects__loading">
            <div class="loader"></div>
            <p>Loading gallery...</p>
        </div>
    `;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    try {
        // Fetch images from folder
        galleryImages = await fetchGalleryImages(folderPath);

        if (galleryImages.length === 0) {
            modalGallery.innerHTML = '<p>No images found in this gallery.</p>';
            return;
        }

        // Render gallery
        modalGallery.innerHTML = galleryImages.map((img, index) => {
            if (img.type === 'video') {
                return `
                    <div class="gallery__item" data-index="${index}">
                        <video src="${img.url}" muted loop playsinline></video>
                    </div>
                `;
            }
            return `
                <div class="gallery__item" data-index="${index}">
                    <img src="${img.url}" alt="${img.name}" loading="lazy">
                </div>
            `;
        }).join('');

        // Add click handlers to open lightbox
        modalGallery.querySelectorAll('.gallery__item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                openLightbox(index);
            });

            // Play video on hover
            const video = item.querySelector('video');
            if (video) {
                item.addEventListener('mouseenter', () => video.play());
                item.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
            }
        });

    } catch (error) {
        console.error('Error loading gallery:', error);
        modalGallery.innerHTML = '<p>Error loading gallery. Please try again.</p>';
    }
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// ==========================================================================
// Lightbox
// ==========================================================================
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    // Close button
    lightbox.querySelector('[data-close-lightbox]')?.addEventListener('click', closeLightbox);

    // Backdrop click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Navigation
    document.getElementById('lightbox-prev')?.addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('lightbox-next')?.addEventListener('click', () => navigateLightbox(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    if (!lightbox || !lightboxImage) return;

    currentLightboxIndex = index;
    const img = galleryImages[index];
    
    lightboxImage.src = img.url;
    lightboxImage.alt = img.name;

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
}

function navigateLightbox(direction) {
    const newIndex = currentLightboxIndex + direction;
    
    if (newIndex < 0) {
        currentLightboxIndex = galleryImages.length - 1;
    } else if (newIndex >= galleryImages.length) {
        currentLightboxIndex = 0;
    } else {
        currentLightboxIndex = newIndex;
    }

    const lightboxImage = document.getElementById('lightbox-image');
    const img = galleryImages[currentLightboxIndex];
    lightboxImage.src = img.url;
    lightboxImage.alt = img.name;
}