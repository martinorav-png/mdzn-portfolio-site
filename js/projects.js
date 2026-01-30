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
let allWorks = [];
let worksLoaded = false;
const INITIAL_ITEMS = 5;

// ==========================================================================
// Initialize
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initWebApps();
    initLazySections();
    initWorkModal();
});

// ==========================================================================
// Lazy Section Loading
// ==========================================================================
function initLazySections() {
    const sections = document.querySelectorAll('.works-section[data-lazy]');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !worksLoaded) {
                loadAllWorks();
                sectionObserver.disconnect();
            }
        });
    }, { rootMargin: '200px' });

    sections.forEach(section => sectionObserver.observe(section));
}

async function loadAllWorks() {
    if (worksLoaded) return;
    worksLoaded = true;
    
    try {
        allWorks = await fetchWorks();
        
        const catwees = allWorks.filter(w => w.category === 'catwees' || !w.category);
        const artistPosters = allWorks.filter(w => w.category === 'artist-posters');
        const gamePosters = allWorks.filter(w => w.category === 'game-posters');
        
        renderWorksLimited(catwees, 'works-grid-catwees', 'catwees');
        renderWorksLimited(artistPosters, 'works-grid-artist-posters', 'artist-posters');
        renderWorksLimited(gamePosters, 'works-grid-game-posters', 'game-posters');
        
    } catch (error) {
        console.error('Error loading works:', error);
    }
}

async function initWebApps() {
    try {
        const projects = await fetchProjects();
        renderWebApps(projects);
    } catch (error) {
        console.error('Error loading web apps:', error);
    }
}

function renderWebApps(projects) {
    const grid = document.getElementById('works-grid-webapps');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = '<p class="works__empty">No web apps found.</p>';
        return;
    }

    grid.innerHTML = projects.map((project) => `
        <article class="work-card" 
                 data-title="${project.title}"
                 data-description="${project.description || ''}"
                 data-client=""
                 data-url="${project.image_url || ''}"
                 data-type="image"
                 data-project-url="${project.project_url || ''}">
            <div class="work-card__media">
                <img src="${project.image_url}" alt="${project.title}">
            </div>
            <div class="work-card__info">
                <h3 class="work-card__title">${project.title}</h3>
                <div class="work-card__meta">
                    <span class="work-card__meta-item">${project.description || ''}</span>
                </div>
            </div>
            <div class="work-card__actions">
                ${project.project_url ? `<a href="${project.project_url}" target="_blank" rel="noopener noreferrer" class="work-card__btn" onclick="event.stopPropagation()">Live</a>` : ''}
                <button class="work-card__btn" data-view-details>View</button>
            </div>
        </article>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.work-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('a')) {
                openWorkModal(card.dataset);
            }
        });
    });
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
// Works (Catwees, Artist Posters, Game Posters)
// ==========================================================================
function renderWorksLimited(works, gridId, category) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (works.length === 0) {
        grid.innerHTML = '<p class="works__empty">No works found.</p>';
        return;
    }

    const initialItems = works.slice(0, INITIAL_ITEMS);
    const hasMore = works.length > INITIAL_ITEMS;

    grid.innerHTML = initialItems.map((work) => createWorkCard(work)).join('');
    
    if (hasMore) {
        const showMoreBtn = document.createElement('button');
        showMoreBtn.className = 'works__show-more';
        showMoreBtn.textContent = `Show all ${works.length} items`;
        showMoreBtn.addEventListener('click', () => {
            showMoreBtn.remove();
            const remainingItems = works.slice(INITIAL_ITEMS);
            remainingItems.forEach(work => {
                grid.insertAdjacentHTML('beforeend', createWorkCard(work));
            });
            initCardListeners(grid);
            lazyLoadImages(grid);
        });
        grid.parentElement.appendChild(showMoreBtn);
    }

    initCardListeners(grid);
    lazyLoadImages(grid);
}

function createWorkCard(work) {
    const isVideo = work.image_url && (work.image_url.endsWith('.mp4') || work.image_url.endsWith('.webm'));
    const isGif = work.image_url && work.image_url.endsWith('.gif');
    
    return `
        <article class="work-card" 
                 data-work-id="${work.id}"
                 data-title="${work.title}"
                 data-description="${work.description || ''}"
                 data-client="${work.client || ''}"
                 data-url="${work.image_url || ''}"
                 data-type="${isVideo ? 'video' : 'image'}">
            <div class="work-card__media">
                ${isVideo 
                    ? `<video data-src="${work.image_url}" muted loop playsinline preload="none"></video>`
                    : isGif
                        ? `<canvas class="gif-canvas" data-gif-src="${work.image_url}"></canvas>`
                        : `<img data-src="${work.image_url}" alt="${work.title}">`
                }
            </div>
            <div class="work-card__info">
                <h3 class="work-card__title">${work.title}</h3>
                <div class="work-card__meta">
                    ${work.description ? `<span class="work-card__meta-item">${work.description}</span>` : ''}
                </div>
            </div>
            <div class="work-card__actions">
                <button class="work-card__btn" data-view-details>View</button>
            </div>
        </article>
    `;
}

function initCardListeners(grid) {
    grid.querySelectorAll('.work-card:not([data-initialized])').forEach(card => {
        card.setAttribute('data-initialized', 'true');
        
        card.addEventListener('click', () => {
            openWorkModal(card.dataset);
        });

        const video = card.querySelector('video');
        if (video) {
            card.addEventListener('mouseenter', () => {
                if (video.src) video.play();
            });
            card.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }
    });
}

function lazyLoadImages(container) {
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const img = card.querySelector('img[data-src]');
                const video = card.querySelector('video[data-src]');
                const canvas = card.querySelector('canvas[data-gif-src]');
                
                if (img) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                if (video) {
                    video.src = video.dataset.src;
                    video.removeAttribute('data-src');
                }
                if (canvas) {
                    const gifImg = new Image();
                    gifImg.crossOrigin = 'anonymous';
                    gifImg.onload = () => {
                        canvas.width = gifImg.width;
                        canvas.height = gifImg.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(gifImg, 0, 0);
                    };
                    gifImg.src = canvas.dataset.gifSrc;
                }
                
                lazyObserver.unobserve(card);
            }
        });
    }, { rootMargin: '100px' });

    container.querySelectorAll('.work-card:not([data-loaded])').forEach(card => {
        card.setAttribute('data-loaded', 'true');
        lazyObserver.observe(card);
    });
}

async function fetchWorks() {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/works?select=*&order=display_order.asc`,
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
// Work Modal
// ==========================================================================
function initWorkModal() {
    const modal = document.getElementById('work-modal');
    if (!modal) return;

    modal.querySelectorAll('[data-close-work-modal]').forEach(el => {
        el.addEventListener('click', closeWorkModal);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeWorkModal();
        }
    });
}

function openWorkModal(data) {
    const modal = document.getElementById('work-modal');
    const mediaContainer = document.getElementById('work-modal-media');
    const titleEl = document.getElementById('work-modal-title');
    const descEl = document.getElementById('work-modal-description');
    const clientEl = document.getElementById('work-modal-client');

    if (!modal) return;

    // Set content
    titleEl.textContent = data.title;
    descEl.textContent = data.description;
    clientEl.textContent = data.client ? `Client: ${data.client}` : '';

    // Set media
    if (data.type === 'video') {
        mediaContainer.innerHTML = `<video src="${data.url}" controls autoplay loop></video>`;
    } else {
        mediaContainer.innerHTML = `<img src="${data.url}" alt="${data.title}">`;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeWorkModal() {
    const modal = document.getElementById('work-modal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Stop video if playing
    const video = modal.querySelector('video');
    if (video) video.pause();
}