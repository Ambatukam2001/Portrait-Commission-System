// ============================================================
// PENCILATION — Gallery, Services & Rates Renderer (index.html)
// ============================================================

// ── Default Fallback Data (when API is unreachable) ─────────
// NOTE: DEFAULT_ARTWORKS removed — portfolio only shows real DB artworks.
// Services and rates still have fallbacks for display continuity.

const DEFAULT_SERVICES = [
    { id: 1, title: 'Pencil Realism Art',   description: 'Hyper-realistic pencil portrait capturing every fine detail.',       image_url: 'images/portrait_sample.png' },
    { id: 2, title: 'Digital Drawing Art',  description: 'Professional digital commission with vibrant, symbolic illustration.',image_url: 'images/digital_art.png'     },
    { id: 3, title: 'Colored Drawing Art',  description: 'Hand-drawn triple-panel illustration with colored pencils & markers.',image_url: 'images/colored.jpg'         }
];

const DEFAULT_RATES = [
    { id: 1, size: '6x8',     label: 'Mini Portrait', price: '300 - 400' },
    { id: 2, size: '8.5x11',  label: 'Letter Format', price: '400 - 700' },
    { id: 3, size: 'A4',      label: 'Standard Size', price: '500 - 800' },
    { id: 4, size: '12x18',   label: 'Large Scale',   price: '1k - 1.5k' }
];

// ── Helpers ──────────────────────────────────────────────────
async function fetchAPI(endpoint) {
    try {
        await PencilationDB.waitForSupabase();
        if (endpoint === 'artworks') return await PencilationDB.listArtworks();
        if (endpoint === 'services') return await PencilationDB.listServices();
        if (endpoint === 'rates') return await PencilationDB.listRates();
        console.warn('Unknown fetchAPI endpoint:', endpoint);
        return null;
    } catch (e) {
        console.warn(`Supabase /${endpoint} unreachable, using defaults.`, e.message);
        return null;
    }
}

function safeImg(src, fallback) {
    if (!src || src.startsWith('data:')) return fallback || 'images/portrait_sample.png';
    // If already absolute URL, return as-is
    if (src.startsWith('http')) return src;
    // Relative path — prepend base for Live Server compatibility
    return src;
}

// ── 1. Gallery Renderer ──────────────────────────────────────
window.renderGallery = async () => {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    // Show loading spinner
    galleryContainer.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-24 gap-4 opacity-40">
            <div class="w-10 h-10 border-4 border-[#C16053] border-t-transparent rounded-full animate-spin"></div>
            <p class="text-[10px] font-black uppercase tracking-widest">Loading Portfolio...</p>
        </div>`;

    try {
        await PencilationDB.waitForSupabase();
        const artworks = await PencilationDB.listArtworks();

        if (!artworks || !artworks.length) {
            galleryContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-32 gap-6 opacity-40">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">No artworks yet — check back soon!</p>
                </div>`;
            return;
        }

        galleryContainer.innerHTML = artworks.map(art => `
            <div class="portrait-card" onclick="viewImage(this)">
                <img src="${safeImg(art.image_url || art.img, 'images/portrait_sample.png')}"
                     alt="${art.title}"
                     onerror="this.src='images/portrait_sample.png'">
                <div class="overlay-info">
                    <p class="text-[10px] uppercase tracking-widest mb-1 italic opacity-60">${art.category}</p>
                    <h4 class="text-xl font-bold uppercase tracking-widest mb-2">${art.title}</h4>
                    <div class="flex items-center justify-between border-t border-white/20 pt-3 mt-1">
                        <span class="text-[10px] font-black uppercase tracking-widest">Size: <span class="artwork-size">${art.size}</span></span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.warn('Gallery load failed:', e.message);
        galleryContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-24 gap-4">
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-[#C16053]">⚠ Could not load portfolio</p>
                <button onclick="renderGallery()" class="px-6 py-3 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C16053] transition-all">Retry</button>
            </div>`;
    }
};

// ── 2. Services Renderer ─────────────────────────────────────
window.renderServices = async () => {
    const servicesGrid  = document.getElementById('services-grid-container');
    const bookingMedium = document.getElementById('booking-medium');

    const data     = await fetchAPI('services') || DEFAULT_SERVICES;
    const services = (data && data.length) ? data : DEFAULT_SERVICES;

    if (servicesGrid) {
        servicesGrid.innerHTML = services.map(s => {
            const imgSrc = buildImgUrl(s.image_url || s.img);
            return `
            <div class="group border-b border-gray-100 pb-12">
                <div class="aspect-square bg-[#FDFBF7] overflow-hidden mb-8 relative">
                    <img src="${imgSrc}"
                         alt="${s.title}"
                         onerror="this.src='images/portrait_sample.png'"
                         class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-all duration-700">
                </div>
                <h3 class="text-xl font-bold uppercase tracking-normal mb-8 text-[#1A1A1A] pt-4 leading-[1.8] break-all">${s.title}</h3>
                <p class="opacity-60 text-xs leading-[1.8] line-clamp-3 overflow-hidden text-ellipsis">${s.description || s.desc || ''}</p>
            </div>`;
        }).join('');
    }

    if (bookingMedium) {
        bookingMedium.innerHTML = services.map(s =>
            `<option value="${s.title}">${s.title}</option>`
        ).join('');
    }
};

// ── 3. Rates Renderer ────────────────────────────────────────
window.renderRates = async () => {
    const ratesContainer = document.querySelector('#rates .md\\:w-2\\/3');
    const bookingSize    = document.getElementById('booking-size');

    const data  = await fetchAPI('rates') || DEFAULT_RATES;
    const rates = data.length ? data : DEFAULT_RATES;

    if (ratesContainer) {
        ratesContainer.innerHTML = rates.map(rate => {
            const isPopular = rate.size === '8.5x11' || rate.size === '8.5 x 11' || rate.size === '9 x 12';
            return isPopular ? `
                <div class="p-8 bg-[#1A1A1A] text-white rounded-[3rem] shadow-2xl relative group flex flex-col justify-between h-full">
                    <div class="absolute -top-4 -right-4 bg-[#C16053] text-[9px] font-black uppercase px-6 py-2 rounded-full tracking-widest shadow-xl">Standard</div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053] mb-6">${rate.label}</p>
                        <h4 class="text-4xl font-black mb-2 uppercase">${rate.size}</h4>
                        <p class="text-[9px] font-black uppercase opacity-30 tracking-[0.3em] mb-12 italic">Most Popular Choice</p>
                    </div>
                    <div class="text-xl font-black tracking-widest"><span class="text-sm opacity-30">₱</span>${rate.price}</div>
                </div>` : `
                <div class="p-8 border-2 border-gray-100 rounded-[3rem] hover:border-[#1A1A1A] transition-all group flex flex-col justify-between h-full bg-white">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-6">${rate.label}</p>
                        <h4 class="text-4xl font-black mb-2 uppercase">${rate.size}</h4>
                        <p class="text-[9px] font-black uppercase text-[#C16053] tracking-[0.3em] mb-12 italic">Premium Quality</p>
                    </div>
                    <div class="text-xl font-black tracking-widest"><span class="text-sm opacity-30">₱</span>${rate.price}</div>
                </div>`;
        }).join('');
    }

    if (bookingSize) {
        bookingSize.innerHTML = rates.map(r =>
            `<option value="${r.size}">${r.size} — ₱${r.price}</option>`
        ).join('');
    }
};

// ── 4. Lightbox Viewer ───────────────────────────────────────
window.viewImage = (el) => {
    const imgSrc = el.querySelector('img').src;
    const title  = el.querySelector('h4')?.textContent || '';
    Swal.fire({
        title,
        imageUrl: imgSrc,
        imageWidth: '100%',
        confirmButtonColor: '#1A1A1A',
        customClass: { popup: 'rounded-3xl' }
    });
};

window.scrollGallery = (dir) => {
    const slider = document.getElementById('gallery-container');
    if (slider) slider.scrollBy({ left: dir * 344, behavior: 'smooth' });
};

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Initial renders
    renderGallery();
    renderServices();
    renderRates();

    if (typeof PencilationDB !== 'undefined') {
        PencilationDB.waitForSupabase()
            .then(() => {
                if (typeof PencilationDB.subscribeArtworks === 'function') {
                    PencilationDB.subscribeArtworks(() => {
                        renderGallery();
                    });
                }
            })
            .catch(() => {});
    }

    // Cross-tab real-time sync wrapper
    window.addEventListener('storage', (e) => {
        if (e.key === 'gallery_updated') {
            renderGallery();
        } else if (e.key === 'services_updated') {
            renderServices();
        } else if (e.key === 'rates_updated') {
            renderRates();
        }
    });
});
