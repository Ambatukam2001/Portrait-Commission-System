// ============================================================
// PENCILATION — Gallery, Services & Rates Renderer (index.html)
// ============================================================

// ── Default Fallback Data (when API is unreachable) ─────────
const DEFAULT_ARTWORKS = [
    { id: 1, title: 'Pencil Realism',    category: 'Graphite',          size: 'A4',     image_url: 'images/portrait_sample.png' },
    { id: 2, title: 'Digital Fauvism',   category: 'Digital Art',       size: 'Digital',image_url: 'images/digital_art.png'     },
    { id: 3, title: 'Colored Portrait',  category: 'Colored Pencil',    size: 'A3',     image_url: 'images/colored.jpg'         },
    { id: 4, title: 'Graceful Glance',   category: 'Graphite Study',    size: '9x12in', image_url: 'images/gallery_1.jpg'       },
    { id: 5, title: 'Portrait of ADEL',  category: 'Featured Work',     size: 'A4',     image_url: 'images/adel.JPG'            },
    { id: 6, title: 'Artist\'s Vision',  category: 'Mixed Media',       size: 'A3',     image_url: 'images/artist_adel.png'     }
];

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

    const data = await fetchAPI('artworks') || DEFAULT_ARTWORKS;
    const artworks = data.length ? data : DEFAULT_ARTWORKS;

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
