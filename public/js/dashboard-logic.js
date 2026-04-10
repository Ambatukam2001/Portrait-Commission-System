// Dashboard Logic for User/Admin Role Simulator
document.addEventListener('DOMContentLoaded', async () => {
    const sessionOk = await PencilationDB.requireAdminSession();
    if (!sessionOk) return;

    // 1. Detect Role via URL and LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const storedRole = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_name');
    
    const headerTitle = document.getElementById('tab-title');
    const dashboardName = document.getElementById('dashboard-user-name');
    const dashboardRole = document.getElementById('dashboard-user-role');

    // Handle Admin Logic
    // On dashboard.php, admin is always true (PHP-protected page)
    const isAdmin = true;

    if(isAdmin) {
        if(dashboardName) dashboardName.textContent = "ADEL";
        if(dashboardRole) dashboardRole.textContent = "SUPER ADMIN";
        if(headerTitle) headerTitle.textContent = "OVERVIEW";
        const adminControls = document.getElementById('admin-map-controls');
        if(adminControls) adminControls.classList.remove('hidden');
        // syncDashboardData() is called below after it's defined on window
    } else {
        if(headerTitle) headerTitle.textContent = storedName || "Guest User";
        if(dashboardRole) dashboardRole.textContent = "Client Profile";
        renderUserOverview();
    }

    // Initialize Live Session Control
    if(isAdmin) {
        const liveBtn = document.getElementById('live-session-btn');
        if(liveBtn) {
            const isLive = localStorage.getItem('is_live_session') === 'true';
            if(isLive) {
                liveBtn.classList.replace('bg-yellow-50', 'bg-red-500');
                liveBtn.classList.replace('text-yellow-600', 'text-white');
                liveBtn.querySelector('span').textContent = 'Live Now';
                liveBtn.querySelector('i').classList.add('animate-pulse');
            }
        }
    }

    // ── Unified Data Sync — full API re-fetch & re-render ──────────
    // Called explicitly by: Refresh button, updateBookingStatus(), deleteHistoryEntry()
    window.syncDashboardData = async () => {
        const bookingsTable = document.getElementById('request-tbody');
        if (!bookingsTable) return;
        
        try {
            await PencilationDB.waitForSupabase();
            const bookings = await PencilationDB.listBookings();

            await renderAdminRequests(bookings);
            initStatsCharts(bookings);
        } catch (error) {
            console.error("Dashboard Sync Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Sync Failed',
                text: error.message || 'Could not reach Supabase. Check URL, anon key, and database policies.',
                confirmButtonColor: '#1A1A1A'
            });
        }
    };

    window.renderAdminRequests = async (bookings) => {
        window._currentBookings = bookings; // Cache globally to avoid enormous base64 strings in inline HTML
        const bookingsTable = document.getElementById('request-tbody');
        const historyTable = document.getElementById('history-list-body');
        if(!bookingsTable) return;
            
            // Update Stats
            const totalReqEl = document.getElementById('total-requests-stat');
            const galleryCountEl = document.getElementById('gallery-count-stat');
            const revenueEl = document.getElementById('revenue-stat');

            if(totalReqEl) totalReqEl.textContent = bookings.length;
            
            if(galleryCountEl) {
                const gallery = await PencilationDB.listArtworks();
                galleryCountEl.textContent = gallery.length.toString().padStart(2, '0');
            }
            
            if(revenueEl) {
                const confirmed = bookings.filter(b => b.status === 'accepted' || b.status === 'completed');
                const total = confirmed.length * 1500; // Mock calculation based on standard price
                revenueEl.textContent = total >= 1000 ? `₱${(total/1000).toFixed(1)}k` : `₱${total}`;
            }

            // Current Requests (Pending/Accepted)
            const currentBookings = bookings.filter(b => b.status === 'pending' || b.status === 'accepted');
            if(currentBookings.length === 0) {
                bookingsTable.innerHTML = `<tr><td colspan="6" class="py-20 text-center font-bold opacity-30 uppercase tracking-widest text-xs">No active requests</td></tr>`;
            } else {
                bookingsTable.innerHTML = currentBookings.map(book => `
                    <tr class="border-b border-gray-50 group hover:bg-gray-50/80 transition-all duration-300">
                        <td class="py-10 px-4">
                            <div class="flex flex-col">
                                <span class="font-bold text-sm text-[#1A1A1A] uppercase tracking-widest">${book.client_name}</span>
                                <span class="text-[9px] font-bold text-gray-400">${book.client_email} | ${book.client_phone || 'No Phone'}</span>
                                <span class="text-[9px] font-black text-[#C16053] uppercase">${book.client_social || 'No Social'}</span>
                            </div>
                        </td>
                        <td class="py-10 px-4">
                            <div class="flex flex-col items-center justify-center space-y-2">
                                <button onclick="viewAddress(${book.id})" class="w-10 h-10 bg-[#C16053]/5 text-[#C16053] rounded-full flex items-center justify-center hover:bg-[#C16053] hover:text-white transition-all shadow-sm">
                                    <i data-lucide="home" class="w-4 h-4"></i>
                                </button>
                                <span class="text-[8px] font-black uppercase text-gray-300 tracking-tighter truncate max-w-[60px]">${book.address || 'N/A'}</span>
                            </div>
                        </td>
                        <td class="py-10 px-4">
                            <div class="flex flex-col">
                                <span class="font-black italic text-[#C16053] capitalize">${book.medium}</span>
                                <span class="text-[9px] font-black uppercase text-gray-300 tracking-widest">${book.size || 'Standard'}</span>
                            </div>
                        </td>
                        <td class="py-10 px-4">
                            <button onclick="viewReferencePhoto(${book.id})" class="text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#C16053] transition-all shadow-lg">
                                Open Photo
                            </button>
                        </td>
                        <td class="py-10 px-4">
                            <div class="flex flex-col space-y-2">
                                <span class="font-bold text-sm">₱${book.medium === 'digital' ? '2,200' : '1,500'}</span>
                                <button onclick="viewPayment(${book.id})" class="text-[9px] uppercase font-black tracking-widest py-1 px-3 ${book.receipt_url && book.receipt_url !== 'null' ? 'bg-green-600' : 'bg-[#1A1A1A]'} text-white rounded-md hover:bg-[#C16053] transition-colors w-fit tracking-[0.2em]">${book.payment_method}</button>
                            </div>
                        </td>
                        <td class="py-10 px-4 text-right">
                            <div class="flex justify-end space-x-3">
                                ${book.status === 'pending' ? `
                                    <button onclick="updateBookingStatus(${book.id}, 'accepted')" class="p-4 bg-[#1A1A1A] text-white rounded-2xl hover:bg-green-600 transition-all group/btn">
                                        <i data-lucide="check" class="w-5 h-5"></i>
                                    </button>
                                    <button onclick="updateBookingStatus(${book.id}, 'rejected')" class="p-4 border-2 border-gray-100 text-gray-300 rounded-2xl hover:border-red-500 hover:text-red-500 transition-all">
                                        <i data-lucide="x" class="w-5 h-5"></i>
                                    </button>
                                ` : (book.status === 'accepted' ? `
                                    <button onclick="updateBookingStatus(${book.id}, 'completed')" class="text-[9px] uppercase font-black tracking-widest py-3 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg italic">Complete</button>
                                ` : `<span class="text-[10px] font-black uppercase tracking-widest opacity-20 italic">Archived</span>`)}
                            </div>
                        </td>
                    </tr>
                `).join('');
            }

            // History Content (Rejected/Completed)
            if(historyTable) {
                const historyBookings = bookings.filter(b => b.status === 'rejected' || b.status === 'completed').reverse();
                if(historyBookings.length === 0) {
                   historyTable.innerHTML = `<tr><td colspan="4" class="py-12 text-center font-bold opacity-30 uppercase text-[10px] tracking-widest">Archive empty</td></tr>`;
                } else {
                    historyTable.innerHTML = historyBookings.map(book => `
                        <tr class="border-b border-gray-50 opacity-60 hover:opacity-100 transition-opacity">
                            <td class="py-8 px-4 font-bold uppercase tracking-widest text-[#1A1A1A]">${book.client_name}</td>
                            <td class="py-8 px-4 capitalize italic">${book.medium}</td>
                            <td class="py-8 px-4 text-gray-400 font-bold uppercase tracking-tighter">${new Date(book.created_at).toLocaleDateString()}</td>
                            <td class="py-8 px-4">
                                <span class="px-4 py-1 ${statusClass(book.status)} rounded-md text-[8px] font-black uppercase tracking-widest">${book.status}</span>
                            </td>
                            <td class="py-8 px-4 text-right">
                                 <button onclick="deleteHistoryEntry(${book.id})" class="p-2 text-red-500/30 hover:text-red-500 transition-colors">
                                     <i data-lucide="trash-2" class="w-4 h-4"></i>
                                 </button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
            lucide.createIcons();
    }

    // Individual History Deletion
    window.deleteHistoryEntry = async (id) => {
        Swal.fire({
            title: `Delete Archvied Entry?`,
            text: 'This will permanently erase this record from the cloud database.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#C16053',
            cancelButtonColor: '#1A1A1A',
            confirmButtonText: 'Yes, Erase'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await PencilationDB.deleteBooking(id);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Erased!',
                        confirmButtonColor: '#1A1A1A'
                    }).then(() => syncDashboardData());
                } catch (error) {
                    console.error("Delete Error:", error);
                }
            }
        });
    };

    // Bulk Archive Clearance
    window.clearArchive = () => {
        Swal.fire({
            title: 'Wipe Archive?',
            text: 'This will permanently remove all completed and declined commissions from the cloud.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#C16053',
            cancelButtonColor: '#1A1A1A',
            confirmButtonText: 'Yes, Clear'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await PencilationDB.clearBookingArchive();
                    
                    syncDashboardData();
                    Swal.fire({
                        icon: 'success',
                        title: 'Archive Cleared',
                        confirmButtonColor: '#1A1A1A'
                    });
                } catch (error) {
                    console.error("Clear Archive Error:", error);
                }
            }
        });
    };

    function statusClass(status) {
        switch(status) {
            case 'pending': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
            case 'accepted': return 'bg-green-50 text-green-600 border border-green-100';
            case 'rejected': return 'bg-red-50 text-red-600 border border-red-100';
            default: return 'bg-gray-50 text-gray-400';
        }
    }

    window.updateBookingStatus = async (id, status) => {
        try {
            await PencilationDB.updateBookingStatus(id, status);
            
            Swal.fire({
                icon: 'success',
                title: `Commission ${status.toUpperCase()}`,
                text: `Database updated and notification synced.`,
                confirmButtonColor: '#1A1A1A'
            }).then(() => syncDashboardData());
        } catch (error) {
            console.error("Status Update Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Could not sync with the cloud server.',
                confirmButtonColor: '#1A1A1A'
            });
        }
    };

    function renderUserOverview() {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const userEmail = localStorage.getItem('user_email') || storedName?.toLowerCase() + '@example.com';
        const userBookings = bookings.filter(b => b.email === userEmail || b.name.toUpperCase() === storedName?.toUpperCase());
        
        // Update User Stats
        const totalReq = document.querySelector('#booking-tab h4:nth-of-type(1)');
        if(totalReq) totalReq.textContent = userBookings.length;
        
        const activeProj = document.querySelectorAll('#booking-tab h4')[1];
        if(activeProj) activeProj.textContent = userBookings.filter(b => b.status === 'accepted').length.toString().padStart(2, '0');
    }

    // 4. Admin Meet-up Address Viewer (Dynamic Map with Leaflet Support)
    window.viewAddress = (id) => {
        const book = window._currentBookings?.find(b => b.id == id);
        if(!book) return;
        const adr = book.address || 'Standard Location';

        const isCoord = adr.includes('📍 Map Location:');
        let lat = 14.5492, lng = 121.0450; // Default BGC
        
        if(isCoord) {
            const coords = adr.split(': ')[1].split(', ');
            lat = parseFloat(coords[0]);
            lng = parseFloat(coords[1]);
        }

        const query = encodeURIComponent(adr || 'BGC, Taguig');
        const searchSrc = `https://maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

        Swal.fire({
            title: `<span class="text-xs font-black uppercase tracking-widest">Location: ${adr}</span>`,
            html: `
                <div id="admin-map-view" class="w-full h-80 rounded-2xl shadow-inner border border-gray-100"></div>
                <div class="mt-6">
                    <button onclick="window.open('https://www.google.com/maps/search/?api=1&query=${lat},${lng}', '_blank')" class="w-full bg-[#1A1A1A] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-[#C16053] transition-all">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                        <span>Open Google Map</span>
                    </button>
                </div>
            `,
            didOpen: () => {
                const map = L.map('admin-map-view', {
                    zoomControl: false 
                }).setView([lat, lng], 16);
                
                L.control.zoom({ position: 'bottomright' }).addTo(map);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                L.marker([lat, lng]).addTo(map).bindPopup("<b>Client's Meeting Spot</b>").openPopup();
                setTimeout(() => map.invalidateSize(), 500);
            },
            confirmButtonColor: '#C16053',
            confirmButtonText: 'Done'
        });
    };

    // ── Image Viewer Helper ────────────────────────────────────
    const showImageModal = (title, subtitle, imageUrl, icon = 'info') => {
        if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl === '') {
            Swal.fire({
                icon,
                title: `No ${title}`,
                text: `The client did not provide a ${title.toLowerCase()} for this commission.`,
                confirmButtonColor: '#1A1A1A'
            });
            return;
        }

        Swal.fire({
            title: title + ' Review',
            html: `<p class="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-[#C16053]">${subtitle}</p>`,
            imageUrl: imageUrl,
            imageWidth: '100%',
            imageAlt: title,
            confirmButtonColor: '#1A1A1A',
            confirmButtonText: 'Close & Verify',
            customClass: {
                image: 'rounded-[3rem] border-4 border-gray-50 shadow-2xl max-h-[70vh] object-contain'
            }
        });
    };

    // 5. View GCash Receipt
    window.viewPayment = (id) => {
        const book = window._currentBookings?.find(b => b.id == id);
        if (!book) return;
        
        if (book.payment_method !== 'gcash') {
            Swal.fire({
                icon: 'info',
                title: 'Offline Payment',
                text: 'This client selected Cash-on-Meetup. No digital receipt was provided.',
                confirmButtonColor: '#1A1A1A'
            });
            return;
        }
        showImageModal('GCash Receipt', 'Transaction Verification', book.receipt_url);
    };

    // 6. View Reference Photo
    window.viewReferencePhoto = (id) => {
        const book = window._currentBookings?.find(b => b.id == id);
        if (!book) return;
        
        showImageModal('Reference Photo', 'Client Request Details', book.reference_url);
    };

    // ── Real-Time Sync Utility ────────────────────────────────
    window.addEventListener('storage', (e) => {
        if (e.key === 'bookings' || e.key === 'is_live_session') {
            if (typeof renderAdminRequests === 'function') renderAdminRequests();
            if (typeof renderGallery === 'function') renderGallery();
        }
    });

    if (isAdmin) {
        syncDashboardData();
        PencilationDB.subscribeBookings(() => {
            if (typeof syncDashboardData === 'function') syncDashboardData();
        });
    }
});

// ── Admin Gallery Renderer ───────────────────────────────────
window.renderGallery = async () => {
    const container = document.getElementById('admin-gallery-container');
    if (!container) return;

    container.innerHTML = `
        <div class="col-span-full py-20 text-center">
            <div class="inline-block w-8 h-8 border-4 border-[#C16053] border-t-transparent rounded-full animate-spin"></div>
        </div>`;

    try {
        await PencilationDB.waitForSupabase();
        const artworks = await PencilationDB.listArtworks();

        if (!artworks.length) {
            container.innerHTML = `
                <div class="col-span-full py-32 text-center border-4 border-dashed border-gray-100">
                    <i data-lucide="image-off" class="w-16 h-16 text-gray-200 mx-auto mb-4"></i>
                    <p class="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">No artworks yet — upload your first piece!</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        container.innerHTML = artworks.map(art => `
            <div class="portrait-card group w-full relative overflow-hidden"
                 data-id="${art.id}"
                 data-title="${(art.title || '').replace(/"/g, '&quot;')}"
                 data-category="${(art.category || '').replace(/"/g, '&quot;')}"
                 data-size="${(art.size || '').replace(/"/g, '&quot;')}"
                 data-img="${art.image_url || ''}">
                <img src="${buildImgUrl(art.image_url)}"
                     alt="${art.title}"
                     onerror="this.src='images/portrait_sample.png'">

                <!-- Admin Controls -->
                <div class="absolute top-6 right-6 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-10 group-hover:translate-x-0 z-30">
                    <button onclick="editImage(this)" class="w-12 h-12 bg-white/90 backdrop-blur-md text-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all shadow-xl">
                        <i data-lucide="edit-3" class="w-5 h-5"></i>
                    </button>
                    <button onclick="deleteImage(this)" class="w-12 h-12 bg-white/90 backdrop-blur-md text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="overlay-info">
                    <p class="text-[9px] uppercase font-black tracking-widest text-[#C16053] mb-2">${art.category || 'Uncategorized'}</p>
                    <h4 class="text-xl font-black uppercase tracking-widest mb-4">${art.title}</h4>
                    <div class="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span class="text-[9px] font-bold uppercase tracking-widest opacity-60">Size: <span class="artwork-size">${art.size || 'N/A'}</span></span>
                        <i data-lucide="maximize-2" class="w-4 h-4 text-white/40 cursor-pointer" onclick="viewImage(this.closest('.portrait-card'))"></i>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    } catch (err) {
        console.error('Gallery Load Error:', err);
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <p class="text-[#C16053] font-black uppercase tracking-widest text-xs">⚠ Could not load gallery — check Supabase.</p>
                <p class="text-gray-400 text-[10px] mt-2">${err.message}</p>
                <button onclick="renderGallery()" class="mt-6 px-6 py-3 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C16053] transition-all">Retry</button>
            </div>`;
    }
};

// ── Shared Modal Utilities ───────────────────────────────────
const SWAL_MODAL_STYLE = `
    <style>
        .swal2-input { color: #1A1A1A !important; font-family: 'Outfit', sans-serif; font-size: 13px!important; margin: 8px auto!important; border-radius: 12px!important; border: 1px solid #eee!important; width: 100%!important; box-sizing: border-box!important; height: 3rem!important;}
        .swal-label  { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #C16053; display: block; text-align: left; margin-top: 10px; letter-spacing: 1px;}
        .preview-overlay { border: 2px dashed #eee; border-radius: 12px; margin-top: 15px; position: relative; overflow: hidden; background: #fafafa; }
    </style>
`;

async function uploadImageToServer(file, statusEl) {
    if (!file) return null;
    try {
        if (statusEl) { statusEl.textContent = 'Preparing image…'; statusEl.className = 'text-[9px] text-yellow-600 font-bold mt-1'; }
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        if (statusEl) { statusEl.textContent = '✓ Ready to save'; statusEl.className = 'text-[9px] text-green-600 font-bold mt-1'; }
        return dataUrl;
    } catch (e) {
        if (statusEl) { statusEl.textContent = '✗ Read Failed'; statusEl.className = 'text-[9px] text-red-500 font-bold mt-1'; }
        throw e;
    }
}

// ── Gallery Actions (Add/Edit/Delete) ─────────────────────────
window.deleteImage = (btn) => {
    const card  = btn.closest('.portrait-card');
    const artId = card?.getAttribute('data-id');
    if (!artId) return;

    Swal.fire({
        title: 'Delete Artwork?',
        text: 'This will permanently remove it from the database.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#C16053',
        cancelButtonColor: '#1A1A1A',
        confirmButtonText: 'Yes, Delete'
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        try {
            await PencilationDB.deleteArtwork(artId);
            card.style.transition = 'all 0.4s ease';
            card.style.transform  = 'scale(0)';
            card.style.opacity    = '0';
            setTimeout(() => {
                renderGallery();
                localStorage.setItem('gallery_updated', Date.now());
            }, 450);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message, confirmButtonColor: '#1A1A1A' });
        }
    });
};

// Unified Gallery Entry Modal (Shared for Add & Edit)
async function showGalleryModal(mode, data = {}) {
    const isEdit = mode === 'edit';
    const artId  = data.id || null;

    const { value: formValue } = await Swal.fire({
        title: isEdit ? 'Edit Artwork' : 'New Gallery Addition',
        html: `
            ${SWAL_MODAL_STYLE}
            <div class="text-left px-5">
                <label class="swal-label">Artwork Title</label>
                <input id="sw-title" class="swal2-input" value="${data.title || ''}" placeholder="The Masterpiece">

                <label class="swal-label">Media Category</label>
                <input id="sw-category" class="swal2-input" value="${data.category || ''}" placeholder="Graphite Study">

                <label class="swal-label">Physical Size</label>
                <input id="sw-size" class="swal2-input" value="${data.size || ''}" placeholder="A4 or 12x18">

                <label class="swal-label">${isEdit ? 'Update Image (Optional)' : 'Upload Artwork Image'}</label>
                <div class="relative mt-2 mb-4 w-full group">
                    <label for="sw-file" class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-[1rem] cursor-pointer bg-gray-50 hover:bg-[#C16053]/5 hover:border-[#C16053]/50 transition-all duration-300">
                        <div class="flex flex-col items-center justify-center pointer-events-none">
                            <svg class="w-6 h-6 mb-2 text-gray-300 group-hover:text-[#C16053] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <p class="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400 group-hover:text-[#C16053] transition-colors">Select or Drag Media</p>
                        </div>
                        <input id="sw-file" type="file" class="hidden" accept="image/*" onchange="previewImageInModal(this, 'sw-preview-img', 'sw-status')" />
                    </label>
                </div>
                <div id="sw-preview-wrap" class="preview-overlay ${isEdit ? '' : 'hidden'}">
                    <img id="sw-preview-img" src="${buildImgUrl(data.image_url)}" class="w-full h-44 object-cover" alt="Preview">
                    <p id="sw-status" class="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 rounded backdrop-blur-sm">
                        ${isEdit ? 'Current Image' : 'No file picked'}
                    </p>
                </div>
            </div>
        `,
        focusConfirm: false,
        confirmButtonColor: '#1A1A1A',
        confirmButtonText: isEdit ? 'Save Changes' : 'Publish to Gallery',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        preConfirm: async () => {
            const title    = document.getElementById('sw-title').value.trim();
            const category = document.getElementById('sw-category').value.trim();
            const size     = document.getElementById('sw-size').value.trim();
            const file     = document.getElementById('sw-file').files[0];

            if (!title || !category) {
                Swal.showValidationMessage('Title and Category are required');
                return false;
            }

            if (!isEdit && !file) {
                Swal.showValidationMessage('Image file is required for new entries');
                return false;
            }

            let image_url = data.image_url || '';
            if (file) {
                try {
                    image_url = await uploadImageToServer(file, document.getElementById('sw-status'));
                } catch (e) {
                    Swal.showValidationMessage(`Upload error: ${e.message}`);
                    return false;
                }
            }
            return { title, category, size, image_url };
        }
    });

    if (formValue) {
        try {
            if (isEdit) {
                await PencilationDB.updateArtwork(artId, formValue);
            } else {
                await PencilationDB.createArtwork(formValue);
            }
            
            renderGallery();
            localStorage.setItem('gallery_updated', Date.now());
            Swal.fire({ icon: 'success', title: isEdit ? 'Entry Updated' : 'Entry Published', confirmButtonColor: '#1A1A1A', timer: 2000 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message, confirmButtonColor: '#C16053' });
        }
    }
}

// Global modal triggers
window.addArtworkModal = () => showGalleryModal('add');
window.editImage = (btn) => {
    const card = btn.closest('.portrait-card');
    const data = {
        id:        card.dataset.id,
        title:     card.dataset.title,
        category:  card.dataset.category,
        size:      card.dataset.size,
        image_url: card.dataset.img
    };
    showGalleryModal('edit', data);
};

// ── Universal Image Previewer for Modals ────────────────────
window.previewImageInModal = (input, previewId, statusId) => {
    const preview = document.getElementById(previewId);
    const status  = document.getElementById(statusId);
    const file    = input.files[0];
    if (!file || !preview) return;

    if (status) {
        status.textContent = '📎 Asset Staged';
        status.classList.remove('hidden');
    }
    const reader = new FileReader();
    reader.onload = (e) => { preview.src = e.target.result; };
    reader.readAsDataURL(file);
};



// ── 8. Services Management — Dynamic Modal Logic ────────────────
window.renderServicesEditor = async () => {
    const grid = document.getElementById('services-manager-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="col-span-full py-20 text-center">
            <div class="inline-block w-8 h-8 border-4 border-[#C16053] border-t-transparent rounded-full animate-spin"></div>
        </div>`;

    try {
        await PencilationDB.waitForSupabase();
        const services = await PencilationDB.listServices();

        if (!services.length) {
            grid.innerHTML = '<p class="col-span-full py-20 text-center opacity-30 font-black uppercase text-[10px] tracking-widest italic">No services defined in database</p>';
            return;
        }

        grid.innerHTML = services.map(s => `
            <div class="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 flex flex-col justify-between group hover:border-[#C16053] transition-all">
                <div class="space-y-6">
                    <div class="flex justify-between items-start">
                        <span class="text-[9px] font-black uppercase tracking-widest text-[#C16053] bg-[#C16053]/5 px-3 py-1 rounded-full">OFFERING</span>
                        <button onclick='editServiceModal(${JSON.stringify(s).replace(/'/g, "&apos;")})' class="text-[#1A1A1A] hover:text-[#C16053] transition-colors">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="w-full aspect-video bg-gray-50 rounded-2xl overflow-hidden relative">
                        <img src="${buildImgUrl(s.image_url)}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="${s.title}">
                    </div>
                    <div>
                        <h3 class="text-xl font-black uppercase tracking-tight mb-2 truncate">${s.title}</h3>
                        <p class="text-[10px] leading-relaxed opacity-50 line-clamp-3">${s.description || 'No description provided.'}</p>
                    </div>
                </div>
                <button onclick='editServiceModal(${JSON.stringify(s).replace(/'/g, "&apos;")})' 
                        class="mt-8 w-full py-4 border-2 border-gray-50 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all">
                    Configure Offering
                </button>
            </div>
        `).join('');
        lucide.createIcons();
    } catch (err) {
        grid.innerHTML = `<p class="col-span-full py-10 text-center text-red-500 font-bold text-xs uppercase tracking-widest">Error: ${err.message}</p>`;
    }
};

window.editServiceModal = async (service) => {
    const { value: formValue } = await Swal.fire({
        title: 'Customize Offering',
        html: `
            ${SWAL_MODAL_STYLE}
            <div class="text-left px-5">
                <label class="swal-label">Offering Name</label>
                <input id="se-title" class="swal2-input" value="${service.title || ''}">

                <label class="swal-label">Summary / Description</label>
                <textarea id="se-desc" class="swal2-input !h-32 p-4 resize-none leading-relaxed" placeholder="Tell the world about this service...">${service.description || ''}</textarea>

                <label class="swal-label">Update Feature Image</label>
                <div class="relative mt-2 mb-4 w-full group">
                    <label for="se-file" class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-[1rem] cursor-pointer bg-gray-50 hover:bg-[#C16053]/5 hover:border-[#C16053]/50 transition-all duration-300">
                        <div class="flex flex-col items-center justify-center pointer-events-none">
                            <svg class="w-6 h-6 mb-2 text-gray-300 group-hover:text-[#C16053] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <p class="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400 group-hover:text-[#C16053] transition-colors">Select or Drag Media</p>
                        </div>
                        <input id="se-file" type="file" class="hidden" accept="image/*" onchange="previewServiceImageInModal(this)" />
                    </label>
                </div>
                
                <div id="se-preview-wrap" class="preview-overlay">
                    <img id="se-preview-img" src="${buildImgUrl(service.image_url)}" class="w-full h-44 object-cover" alt="Preview">
                    <p id="se-status" class="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 rounded backdrop-blur-sm">Current Asset</p>
                </div>
            </div>
        `,
        focusConfirm: false,
        confirmButtonColor: '#1A1A1A',
        confirmButtonText: 'Save Offering Changes',
        showCancelButton: true,
        preConfirm: async () => {
            const title       = document.getElementById('se-title').value.trim();
            const description = document.getElementById('se-desc').value.trim();
            const file        = document.getElementById('se-file').files[0];

            if (!title) {
                Swal.showValidationMessage('A name is required for your offering');
                return false;
            }

            let image_url = service.image_url;
            if (file) {
                try {
                    image_url = await uploadImageToServer(file, document.getElementById('se-status'));
                } catch (e) {
                    Swal.showValidationMessage(`Upload error: ${e.message}`);
                    return false;
                }
            }
            return { title, description, image_url };
        }
    });

    if (formValue) {
        try {
            await PencilationDB.updateService(service.id, formValue);
            
            renderServicesEditor();
            localStorage.setItem('services_updated', Date.now());
            Swal.fire({ icon: 'success', title: 'Offering Optimized', text: 'Landing page will reflect changes instantly.', confirmButtonColor: '#1A1A1A', timer: 2000 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Update Blocked', text: err.message, confirmButtonColor: '#C16053' });
        }
    }
};

window.previewServiceImageInModal = (input) => window.previewImageInModal(input, 'se-preview-img', 'se-status');


// ── Load Rates to Form (from DB) ─────────────────────────────
window.loadRatesToForm = async () => {
    try {
        await PencilationDB.waitForSupabase();
        const rates = await PencilationDB.listRates();

        rates.forEach((rate, index) => {
            const i       = index + 1;
            const sizeEl  = document.getElementById(`rate-${i}-size`);
            const labelEl = document.getElementById(`rate-${i}-label`);
            const priceEl = document.getElementById(`rate-${i}-price`);

            if (sizeEl)  { sizeEl.value  = rate.size  || ''; sizeEl.dataset.dbId = rate.id; }
            if (labelEl)   labelEl.value = rate.label || '';
            if (priceEl)   priceEl.value = rate.price || '';
        });
    } catch (err) {
        console.error('Load Rates Error:', err);
    }
};

// ── Save Rates to DB via API ────────────────────────────────
window.saveRates = async () => {
    Swal.fire({ title: 'Saving Rates…', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        for (let i = 1; i <= 4; i++) {
            const sizeEl  = document.getElementById(`rate-${i}-size`);
            if (!sizeEl) continue;
            const id    = sizeEl.dataset.dbId || i;
            const size  = sizeEl.value.trim();
            const label = document.getElementById(`rate-${i}-label`)?.value.trim() || '';
            const price = document.getElementById(`rate-${i}-price`)?.value.trim() || '0';

            await PencilationDB.updateRate(id, { size, label, price });
        }

        localStorage.setItem('rates_updated', Date.now());
        Swal.fire({ icon: 'success', title: 'Rates Updated!', confirmButtonColor: '#1A1A1A', timer: 2000, timerProgressBar: true });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message, confirmButtonColor: '#C16053' });
    }
};

// 9. Change Password Logic
window.handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const current = document.getElementById('current-pass').value;
    const newP = document.getElementById('new-pass').value;
    const confirmP = document.getElementById('confirm-pass').value;

    if(newP !== confirmP) {
        Swal.fire({
            icon: 'error',
            title: 'Mismatch',
            text: 'New password and confirmation do not match.',
            confirmButtonColor: '#C16053'
        });
        return;
    }

    if(newP.length < 6) {
        Swal.fire({
            icon: 'warning',
            title: 'Security Notice',
            text: 'Please choose a stronger password (at least 6 characters).',
            confirmButtonColor: '#1A1A1A'
        });
        return;
    }

    try {
        Swal.fire({ title: 'Updating Credentials...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await PencilationDB.updateAdminPassword(current, newP);

        Swal.fire({
            icon: 'success',
            title: 'Passkey Updated!',
            text: 'Your administrative security credentials have been securely changed in the database.',
            confirmButtonColor: '#1A1A1A'
        }).then(() => {
            // Clear inputs for security
            document.getElementById('current-pass').value = '';
            document.getElementById('new-pass').value = '';
            document.getElementById('confirm-pass').value = '';
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message || 'Incorrect current passkey.',
            confirmButtonColor: '#C16053'
        });
    }
};

// 10. Intelligent Duplicate Cleanup
window.cleanDuplicates = () => {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    let initialCount = bookings.length;

    if(initialCount === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Empty Records',
            text: 'There are no commissions to check for duplicates.',
            confirmButtonColor: '#1A1A1A'
        });
        return;
    }

    // Filter logic: Unique by name, email, and medium
    const seen = new Set();
    const uniqueBookings = bookings.filter(book => {
        const key = `${book.name.toLowerCase()}-${book.email.toLowerCase()}-${book.medium.toLowerCase()}`;
        if(seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });

    const duplicateCount = initialCount - uniqueBookings.length;

    if(duplicateCount === 0) {
        Swal.fire({
            icon: 'success',
            title: 'Data is Clean',
            text: 'No duplicate booking records were found.',
            confirmButtonColor: '#1A1A1A'
        });
        return;
    }

    Swal.fire({
        title: `Remove ${duplicateCount} Duplicates?`,
        text: `We found ${duplicateCount} redundant entries with matching credentials. Would you like to purge them?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#C16053',
        cancelButtonColor: '#1A1A1A',
        confirmButtonText: 'Yes, Purge'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem('bookings', JSON.stringify(uniqueBookings));
            syncDashboardData();
            
            Swal.fire({
                icon: 'success',
                title: 'Data Optimized',
                text: `${duplicateCount} duplicate entries have been successfully removed.`,
                confirmButtonColor: '#1A1A1A'
            });
        }
    });
};

// 12. Smart Live Session Control
window.toggleLiveSession = () => {
    const isLive = localStorage.getItem('is_live_session') === 'true';
    const liveBtn = document.getElementById('live-session-btn');
    
    if(!isLive) {
        Swal.fire({
            title: 'Launch Live Session?',
            html: `
                <div class="space-y-4 text-left p-4">
                    <p class="text-xs font-black uppercase text-gray-400">Meeting URL (Optional)</p>
                    <input type="url" id="live-url" class="swal2-input !m-0 w-full" placeholder="https://meet.google.com/..." value="${localStorage.getItem('live_meeting_url') || ''}">
                     <p class="text-[10px] opacity-40 italic mt-2">This link will be visible to clients while you are live.</p>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#C16053',
            confirmButtonText: 'Go Live Now',
            preConfirm: () => {
                return document.getElementById('live-url').value;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem('is_live_session', 'true');
                localStorage.setItem('live_meeting_url', result.value || '');
                
                // Update Button
                if(liveBtn) {
                    liveBtn.classList.replace('bg-yellow-50', 'bg-red-500');
                    liveBtn.classList.replace('text-yellow-600', 'text-white');
                    liveBtn.querySelector('span').textContent = 'Live Now';
                    const icon = liveBtn.querySelector('i');
                    if(icon) icon.classList.add('animate-pulse');
                }

                Swal.fire({
                    icon: 'success',
                    title: 'System is Live!',
                    text: 'Your current status is now broadcasted to all visitors.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    } else {
        Swal.fire({
            title: 'End Live Session?',
            text: 'This will hide your live status and meeting link from the public pool.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1A1A1A',
            confirmButtonText: 'End Session'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.setItem('is_live_session', 'false');
                
                // Update Button
                if(liveBtn) {
                    liveBtn.classList.replace('bg-red-500', 'bg-yellow-50');
                    liveBtn.classList.replace('text-white', 'text-yellow-600');
                    liveBtn.querySelector('span').textContent = 'Live Session';
                    const icon = liveBtn.querySelector('i');
                    if(icon) icon.classList.remove('animate-pulse');
                }

                Swal.fire({
                    icon: 'info',
                    title: 'Session Archived',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }
};

// Administrative Logout
window.logout = () => {
    Swal.fire({
        title: 'Sign Out?',
        text: 'You will need to re-authenticate to manage your commissions.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#C16053',
        cancelButtonColor: '#1A1A1A',
        confirmButtonText: 'Yes, Sign Out'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await PencilationDB.signOut();
            } catch (e) {
                console.warn(e);
            }
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_email');
            window.location.href = 'index.html';
        }
    });
};

// 12. UI Architecture & Tab Management
window.switchTab = (tabId) => {
    const sidebar = document.getElementById('sidebar');
    const sideToggle = document.getElementById('sidebar-toggle');

    // Close sidebar on mobile
    if (window.innerWidth < 1024 && sidebar) {
        sidebar.style.transform = 'translateX(-100%)';
        if(sideToggle) sideToggle.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
        lucide.createIcons();
    }

    // Hide all tabs
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('animate-fade-in-up');
    });

    // Remove active state from all nav buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab');
    });

    // Show new tab
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('hidden');
        setTimeout(() => targetTab.classList.add('animate-fade-in-up'), 10);
    }

    // Update title
    const titleMap = {
        'booking-tab': 'DASHBOARD OVERVIEW',
        'request-tab': 'REQUEST QUEUE',
        'gallery-tab': 'GALLERY MANAGER',
        'services-tab': 'SERVICES MANAGER',
        'rates-tab': 'RATES MANAGER',
        'history-tab': 'ARCHIVE',
        'password-tab': 'SECURITY PORTAL'
    };
    const titleEl = document.getElementById('tab-title');
    if (titleEl) titleEl.textContent = titleMap[tabId] || 'ADMIN';

    // Highlight Button
    const sidebarBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
        const attr = btn.getAttribute('onclick');
        return attr && attr.includes(tabId);
    });
    if (sidebarBtn) sidebarBtn.classList.add('active-tab');

    // Sync Data on tab switch
    // Note: booking-tab, request-tab AND gallery-tab rows are pre-rendered by PHP on page load.
    // syncDashboardData() / renderGallery() is called manually or after a CRUD action.
    if (tabId === 'services-tab' && typeof renderServicesEditor === 'function') renderServicesEditor();
    if (tabId === 'rates-tab' && typeof loadRatesToForm === 'function') loadRatesToForm();
};

let volumeChartInst = null;
let revenueChartInst = null;

window.initStatsCharts = (bookings) => {
    const ctxVol = document.getElementById('volumeChart');
    const ctxRev = document.getElementById('revenueChart');
    if (!ctxVol || !ctxRev || !bookings) return;

    if (volumeChartInst) volumeChartInst.destroy();
    if (revenueChartInst) revenueChartInst.destroy();

    const getParsedDate = (dateStr) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const completedVolume = new Array(7).fill(0);
    bookings.filter(b => b.status === 'completed').forEach(b => {
        const date = getParsedDate(b.created_at || b.date);
        completedVolume[date.getDay()]++;
    });

    const volCtx2d = ctxVol.getContext('2d');
    const gradient = volCtx2d.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(193, 96, 83, 0.5)'); // Pencilation Red fading
    gradient.addColorStop(1, 'rgba(193, 96, 83, 0)');

    volumeChartInst = new Chart(ctxVol, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{ 
                label: 'Completions', 
                data: completedVolume, 
                borderColor: '#C16053',
                backgroundColor: gradient,
                borderWidth: 4,
                tension: 0, // Sharp lightning effect
                fill: true,
                pointBackgroundColor: '#FDFBF7',
                pointBorderColor: '#C16053',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 9
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f3f4f6' } },
                x: { grid: { display: false } }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });

    const pending = bookings.filter(b => b.status === 'pending').length;
    const accepted = bookings.filter(b => b.status === 'accepted').length;

    revenueChartInst = new Chart(ctxRev, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'WIP (Accepted)'],
            datasets: [{ 
                data: [pending, accepted], 
                backgroundColor: ['#3b82f6', '#C16053'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { family: 'Outfit', weight: 'bold', size: 10 },
                        usePointStyle: true,
                        padding: 20
                    }
                } 
            },
            cutout: '75%'
        }
    });
};

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // Core Navigation logic
    const sideToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sideToggle && sidebar) {
        sideToggle.addEventListener('click', () => {
            const isClosed = sidebar.style.transform === 'translateX(-100%)' || !sidebar.style.transform;
            if (isClosed) {
                sidebar.style.transform = 'translateX(0px)';
                sideToggle.innerHTML = '<i data-lucide="x" class="w-6 h-6"></i>';
            } else {
                sidebar.style.transform = 'translateX(-100%)';
                sideToggle.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
            }
            lucide.createIcons();
        });
    }

    window.addEventListener('resize', () => {
        if (sidebar && sideToggle) {
            if (window.innerWidth >= 1024) {
                sidebar.style.transform = 'translateX(0px)';
                sideToggle.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
            } else {
                sidebar.style.transform = 'translateX(-100%)';
                sideToggle.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
            }
            lucide.createIcons();
        }
    });

    if(window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('dashboard.php')) {
        switchTab('booking-tab');
    }
});

