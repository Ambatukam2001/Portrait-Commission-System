// Gallery & Service Visualization Engine
const DEFAULT_ARTWORKS = [
    { id: 1, title: 'The Silent Gaze', category: 'Featured Pencil', size: 'A4', price: '1,500', img: 'images/gallery_1.jpg', fallback: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop' },
    { id: 2, title: 'Vibrant Soul', category: 'Digital Illustration', size: 'Digital', price: '2,200', img: 'images/gallery_2.jpg', fallback: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1972&auto=format&fit=crop' },
    { id: 3, title: 'Midnight Shadow', category: 'Charcoal Study', size: 'A3', price: '2,800', img: 'images/gallery_3.jpg', fallback: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop' },
    { id: 4, title: 'Urban Profile', category: 'Mix Media', size: 'A4', price: '1,800', img: 'images/gallery_4.jpg', fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop' },
    { id: 5, title: 'Reflection', category: 'Monochrome Pencil', size: 'A5', price: '900', img: 'images/gallery_5.jpg', fallback: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop' },
    { id: 6, title: 'Study in Grey', category: 'Graphite Sketch', size: 'A4', price: '1,200', img: 'images/gallery_6.jpg', fallback: 'https://images.unsplash.com/photo-1560707854-fb9a10eeaace?q=80&w=1974&auto=format&fit=crop' }
];

const DEFAULT_SERVICES = [
    {
        id: 1,
        title: "Pencil Realism Art",
        desc: '"BINI Mikha" - A breathtaking hyper-realistic pencil portrait, meticulously crafted to capture every fine detail and the most subtle micro-expressions for a truly lifelike finish.',
        img: "images/portrait_sample.png"
    },
    {
        id: 2,
        title: "Digital Drawing Art",
        desc: '"ASEAN Diversity & DMMMSU Legacy" - A professional digital commission. A vibrantly symbolic celebration of Southeast Asian unity, educational research, and cultural harmony.',
        img: "images/digital_art.png"
    },
    {
        id: 3,
        title: "Colored Drawing Art",
        desc: '"Evil Demon Slayer" - A masterful triple-panel hand-drawn illustration. Features Zenitsu, Inosuke, and Tanjiro with vibrant colored pencils, markers, and bold Japanese calligraphy.',
        img: "images/colored_art.png"
    }
];

const DEFAULT_RATES = [
    { id: 1, size: '6x8', label: 'Mini Portrait', price: '300 - 400', popular: false },
    { id: 2, size: '8.5x11', label: 'Letter Format', price: '400 - 700', popular: true },
    { id: 3, size: 'A4', label: 'Standard Size', price: '500 - 800', popular: false },
    { id: 4, size: '12x18', label: 'Large Scale', price: '1k - 1.5k', popular: false }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Gallery Logic
    window.renderGallery = () => {
        const galleryContainer = document.getElementById('gallery-container');
        const adminGalleryGrid = document.querySelector('#gallery-tab .gallery-grid');
        const artworks = JSON.parse(localStorage.getItem('gallery_data')) || DEFAULT_ARTWORKS;
        
        if(!localStorage.getItem('gallery_data')) {
            localStorage.setItem('gallery_data', JSON.stringify(DEFAULT_ARTWORKS));
        }

        if(galleryContainer) {
            galleryContainer.innerHTML = artworks.map(art => `
                <div class="portrait-card" onclick="viewImage(this)">
                    <img src="${art.img}" alt="${art.title}" onerror="this.src='${art.fallback}'">
                    <div class="overlay-info">
                        <p class="text-[10px] uppercase tracking-widest mb-1 italic opacity-60">${art.category}</p>
                        <h4 class="text-xl font-bold uppercase tracking-widest mb-2">${art.title}</h4>
                        <div class="flex items-center justify-between border-t border-white/20 pt-3 mt-1">
                            <span class="text-[10px] font-black uppercase tracking-widest">Size: <span class="artwork-size">${art.size}</span></span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if(adminGalleryGrid) {
            adminGalleryGrid.innerHTML = artworks.map(art => `
                <div class="portrait-card rounded-[2rem] overflow-hidden group border-8 border-white shadow-xl relative" data-id="${art.id}">
                    <img src="${art.img}" onerror="this.src='${art.fallback}'" class="group-hover:scale-110 transition-transform duration-700">
                    <div class="overlay-info p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                         <p class="text-[10px] uppercase font-black text-[#C16053] tracking-widest">${art.category}</p>
                         <h4 class="text-xl font-bold text-white uppercase tracking-widest mb-2">${art.title}</h4>
                         <div class="flex items-center justify-between border-t border-white/20 pt-3 mt-1">
                             <span class="text-[9px] font-black uppercase text-white tracking-widest">Size: <span class="artwork-size">${art.size}</span></span>
                         </div>
                    </div>
                    <div class="absolute top-6 right-6 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editImage(this)" class="w-10 h-10 bg-white text-[#1A1A1A] rounded-full flex items-center justify-center hover:bg-[#C16053] hover:text-white transition-all shadow-lg">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteImage(this)" class="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        }
    };

    // 2. Render Services Logic
    window.renderServices = () => {
        const servicesGrid = document.getElementById('services-grid-container');
        if(!servicesGrid) return;
        const services = JSON.parse(localStorage.getItem('services_data')) || DEFAULT_SERVICES;

        servicesGrid.innerHTML = services.map(service => `
            <div class="group border-b border-gray-100 pb-12">
                <div class="aspect-square bg-[#FDFBF7] overflow-hidden mb-8 relative">
                    <img src="${service.img}" alt="${service.title}"
                        class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-all duration-700">
                </div>
                <h3 class="text-lg font-black uppercase tracking-[0.2em] mb-4 text-[#1A1A1A] font-sans pt-4">${service.title}</h3>
                <p class="opacity-60 text-[11px] leading-relaxed line-clamp-3">${service.desc}</p>
            </div>
        `).join('');
    };

    // 3. Render Rates Logic
    window.renderRates = () => {
        const ratesGrid = document.querySelector('#rates .md\\:w-2\\/3');
        if(!ratesGrid) return;
        const rates = JSON.parse(localStorage.getItem('rates_data')) || DEFAULT_RATES;

        ratesGrid.innerHTML = rates.map(rate => {
            const isPopular = rate.popular || rate.size === '8.5x11';
            return isPopular ? `
                <div class="p-8 bg-[#1A1A1A] text-white rounded-[3rem] shadow-2xl relative group flex flex-col justify-between h-full">
                    <div class="absolute -top-4 -right-4 bg-[#C16053] text-[9px] font-black uppercase px-6 py-2 rounded-full tracking-widest shadow-xl">Standard</div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053] mb-6 tracking-[0.2em]">${rate.label}</p>
                        <h4 class="text-4xl font-black mb-2 uppercase">${rate.size}</h4>
                        <p class="text-[9px] font-black uppercase opacity-30 tracking-[0.3em] mb-12 italic">Most Popular Choice</p>
                    </div>
                    <div class="text-xl font-black tracking-widest">
                        <span class="text-sm opacity-30">₱</span>${rate.price}
                    </div>
                </div>
            ` : `
                <div class="p-8 border-2 border-gray-100 rounded-[3rem] hover:border-[#1A1A1A] transition-all group flex flex-col justify-between h-full bg-white">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-6 tracking-[0.2em]">${rate.label}</p>
                        <h4 class="text-4xl font-black mb-2 uppercase">${rate.size}</h4>
                        <p class="text-[9px] font-black uppercase text-[#C16053] tracking-[0.3em] mb-12 italic">Premium Quality</p>
                    </div>
                    <div class="text-xl font-black tracking-widest">
                        <span class="text-sm opacity-30">₱</span>${rate.price}
                    </div>
                </div>
            `;
        }).join('');
    };

    // 4. Gallery Utilities
    window.viewImage = (el) => {
        const imgSrc = el.querySelector('img').src;
        const title = el.querySelector('h4').textContent;
        Swal.fire({
            title: title,
            imageUrl: imgSrc,
            imageWidth: '100%',
            confirmButtonColor: '#1A1A1A',
            customClass: { popup: 'rounded-3xl' }
        });
    };

    window.scrollGallery = (dir) => {
        const slider = document.getElementById('gallery-container');
        if(slider) slider.scrollBy({ left: dir * 344, behavior: 'smooth' });
    };

    // Initialize all
    renderGallery();
    renderServices();
    renderRates();
});

// Real-time Sync
window.addEventListener('storage', (e) => {
    if(['gallery_data', 'services_data', 'rates_data'].includes(e.key)) {
        if(typeof renderGallery === 'function') renderGallery();
        if(typeof renderServices === 'function') renderServices();
        if(typeof renderRates === 'function') renderRates();
    }
});
