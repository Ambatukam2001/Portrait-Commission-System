// Dashboard Logic for User/Admin Role Simulator
document.addEventListener('DOMContentLoaded', () => {
    // 1. Detect Role via URL and LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const storedRole = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_name');
    
    const headerTitle = document.getElementById('tab-title');
    const dashboardName = document.getElementById('dashboard-user-name');
    const dashboardRole = document.getElementById('dashboard-user-role');

    // Handle Admin Logic
    const isAdmin = (storedRole === 'admin' || role === 'admin');

    if(isAdmin) {
        if(dashboardName) dashboardName.textContent = "ADEL";
        if(dashboardRole) dashboardRole.textContent = "SUPER ADMIN";
        if(headerTitle) headerTitle.textContent = "OVERVIEW";
        const adminControls = document.getElementById('admin-map-controls');
        if(adminControls) adminControls.classList.remove('hidden');
        renderAdminRequests();
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

    // 1. Render Admin Requests from API/Supabase
    async function renderAdminRequests() {
        const bookingsTable = document.querySelector('tbody');
        const historyTable = document.getElementById('history-list-body');
        if(!bookingsTable) return;

        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/bookings`);
            if(!response.ok) throw new Error('API Sync Failed');
            const bookings = await response.json();
            
            // Update Stats
            const totalReqEl = document.getElementById('total-requests-stat');
            const galleryCountEl = document.getElementById('gallery-count-stat');
            const revenueEl = document.getElementById('revenue-stat');

            if(totalReqEl) totalReqEl.textContent = bookings.length;
            
            if(galleryCountEl) {
                // We'll fetch artworks count from API in a real scenario, but for now use the list
                const artRes = await fetch(`${CONFIG.API_URL}/artworks`);
                const gallery = await artRes.json();
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
                                <button onclick="viewAddress('${book.address || 'Standard Location'}')" class="w-10 h-10 bg-[#C16053]/5 text-[#C16053] rounded-full flex items-center justify-center hover:bg-[#C16053] hover:text-white transition-all shadow-sm">
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
                            <button onclick="viewReferencePhoto('${book.reference_url}')" class="text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#C16053] transition-all shadow-lg">
                                Open Photo
                            </button>
                        </td>
                        <td class="py-10 px-4">
                            <div class="flex flex-col space-y-2">
                                <span class="font-bold text-sm">₱${book.medium === 'digital' ? '2,200' : '1,500'}</span>
                                <button onclick="viewPayment('${book.receipt_url}', '${book.payment_method}')" class="text-[9px] uppercase font-black tracking-widest py-1 px-3 ${book.receipt_url ? 'bg-green-600' : 'bg-[#1A1A1A]'} text-white rounded-md hover:bg-[#C16053] transition-colors w-fit tracking-[0.2em]">${book.payment_method}</button>
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
        } catch (error) {
            console.error("Dashboard Sync Error:", error);
        }
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
                    const response = await fetch(`${CONFIG.API_URL}/admin/bookings/${id}`, {
                        method: 'DELETE'
                    });
                    if(!response.ok) throw new Error('Delete Failed');
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Erased!',
                        confirmButtonColor: '#1A1A1A'
                    }).then(() => renderAdminRequests());
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
                    const response = await fetch(`${CONFIG.API_URL}/admin/bookings/clear-archive`, {
                        method: 'DELETE'
                    });
                    if(!response.ok) throw new Error('Clear Archive Failed');
                    
                    renderAdminRequests();
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
            case 'declined': return 'bg-red-50 text-red-600 border border-red-100';
            default: return 'bg-gray-50 text-gray-400';
        }
    }

    window.updateBookingStatus = async (id, status) => {
        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: status })
            });
            if(!response.ok) throw new Error('Update Failed');
            
            Swal.fire({
                icon: 'success',
                title: `Commission ${status.toUpperCase()}`,
                text: `Database updated and notification synced.`,
                confirmButtonColor: '#1A1A1A'
            }).then(() => renderAdminRequests());
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
    window.viewAddress = (adr) => {
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

    // 5. Simulated Real-Time Updates (Auto-refresh on storage change)
    window.addEventListener('storage', (e) => {
        if(e.key === 'bookings') {
            console.log("Real-time Update: Syncing new requests...");
            renderAdminRequests();
        }
    });

    // 5. View GCash Receipt
    window.viewPayment = (receiptData, method) => {
        if(method !== 'gcash' || !receiptData || receiptData === 'null' || receiptData === '') {
            Swal.fire({
                icon: 'info',
                title: 'No Digital Receipt',
                text: method === 'gcash' 
                    ? 'The client selected GCash but did not upload a screenshot.'
                    : 'This client selected Cash-on-Meetup. No digital receipt was provided.',
                confirmButtonColor: '#1A1A1A'
            });
            return;
        }

        Swal.fire({
            title: 'GCash Payment Receipt',
            html: '<p class="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-[#C16053]">Transaction Verification</p>',
            imageUrl: receiptData,
            imageWidth: '100%',
            imageAlt: 'GCash Receipt',
            confirmButtonColor: '#1A1A1A',
            confirmButtonText: 'Verify & Close',
            customClass: {
                image: 'rounded-3xl border-4 border-gray-100 shadow-2xl'
            }
        });
    };

    // 6. View Reference Photo
    window.viewReferencePhoto = (photoData) => {
        if(!photoData || photoData === 'null' || photoData === '' || photoData === 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'No Reference Photo',
                text: 'The client did not upload a reference photo for this commission.',
                confirmButtonColor: '#1A1A1A'
            });
            return;
        }

        Swal.fire({
            title: 'Reference Photo',
            html: '<p class="text-[9px] font-black uppercase tracking-[0.2em] mb-4 text-[#C16053]">Client Request</p>',
            imageUrl: photoData,
            imageWidth: '100%',
            imageAlt: 'Reference Photo',
            confirmButtonColor: '#1A1A1A',
            confirmButtonText: 'Close',
            customClass: {
                image: 'rounded-3xl border-4 border-gray-100 shadow-2xl max-h-[70vh] object-contain'
            }
        });
    };
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
        const res = await fetch(`${CONFIG.API_URL}/artworks`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const artworks = await res.json();

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
            <div class="portrait-card group w-full"
                 data-id="${art.id}"
                 data-title="${(art.title || '').replace(/"/g, '&quot;')}"
                 data-category="${(art.category || '').replace(/"/g, '&quot;')}"
                 data-size="${(art.size || '').replace(/"/g, '&quot;')}">
                <img src="${art.image_url || 'images/portrait_sample.png'}"
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
                <p class="text-[#C16053] font-black uppercase tracking-widest text-xs">⚠ Could not load gallery — Is XAMPP running?</p>
                <p class="text-gray-400 text-[10px] mt-2">${err.message}</p>
                <button onclick="renderGallery()" class="mt-6 px-6 py-3 bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#C16053] transition-all">Retry</button>
            </div>`;
    }
};

// ── Delete Artwork ────────────────────────────────────────────
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
            const res = await fetch(`${CONFIG.API_URL}/admin/artworks/${artId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            card.style.transition = 'all 0.4s ease';
            card.style.transform  = 'scale(0)';
            card.style.opacity    = '0';
            setTimeout(() => renderGallery(), 450);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message, confirmButtonColor: '#1A1A1A' });
        }
    });
};

// ── Edit Artwork ─────────────────────────────────────────────
window.editImage = (btn) => {
    const card     = btn.closest('.portrait-card');
    const artId    = card?.getAttribute('data-id');
    // Read from data attributes — not from DOM text (avoids wrong element selection)
    const title    = card?.getAttribute('data-title')    || '';
    const category = card?.getAttribute('data-category') || '';
    const size     = card?.getAttribute('data-size')     || '';

    Swal.fire({
        title: 'Edit Artwork',
        html: `
            <style>.swal2-input{color:#1A1A1A!important;font-family:'Outfit',sans-serif;font-size:14px;margin:8px auto}.swal-label{font-size:10px;font-weight:900;text-transform:uppercase;color:#C16053;display:block;text-align:left;margin-left:3rem;margin-top:10px}</style>
            <label class="swal-label">Artwork Title</label>
            <input id="swal-title" class="swal2-input" value="${title}">
            <label class="swal-label">Media Category</label>
            <input id="swal-category" class="swal2-input" value="${category}">
            <label class="swal-label">Physical Size</label>
            <input id="swal-size" class="swal2-input" value="${size}">
        `,
        focusConfirm: false,
        confirmButtonColor: '#1A1A1A',
        showCancelButton: true,
        preConfirm: () => ({
            title:    document.getElementById('swal-title').value.trim(),
            category: document.getElementById('swal-category').value.trim(),
            size:     document.getElementById('swal-size').value.trim()
        })
    }).then(async (result) => {
        if (!result.isConfirmed || !result.value?.title) return;
        try {
            const res = await fetch(`${CONFIG.API_URL}/admin/artworks/${artId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.value)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await renderGallery();
            Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message, confirmButtonColor: '#1A1A1A' });
        }
    });
};

// 7. Add Artwork Modal (API Synchronized)
window.addArtworkModal = () => {
    Swal.fire({
        title: 'New Gallery Addition',
        html: `
            <style>
                .swal2-input, .swal2-file { color: #1A1A1A !important; font-family: 'Outfit', sans-serif; font-size: 13px; margin: 8px auto; border-radius: 12px; border: 1px solid #eee; width: 100%; box-sizing: border-box; }
                .swal-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #C16053; display: block; text-align: left; margin-top: 10px; tracking: 1px; }
            </style>
            <div class="text-left px-4">
                <label class="swal-label">Artwork Title</label>
                <input id="add-title" class="swal2-input" placeholder="e.g. The Soulful Stroke">
                
                <label class="swal-label">Media Category</label>
                <input id="add-category" class="swal2-input" placeholder="e.g. Charcoal on Vellum">
                
                <label class="swal-label">Standard Size</label>
                <input id="add-size" class="swal2-input" placeholder="e.g. 12x18 inches">
                
                <label class="swal-label">Upload Artwork Image</label>
                <input type="file" id="add-img-file" class="swal2-file p-3 cursor-pointer" accept="image/*">
            </div>
        `,
        focusConfirm: false,
        confirmButtonColor: '#1A1A1A',
        confirmButtonText: 'Publish to Gallery',
        showCancelButton: true,
        cancelButtonText: 'Discard',
        preConfirm: () => {
             const title = document.getElementById('add-title').value;
             const category = document.getElementById('add-category').value;
             const size = document.getElementById('add-size').value;
             const fileInput = document.getElementById('add-img-file');

             if(!title || !category || !fileInput.files.length) {
                 Swal.showValidationMessage('Please fill in Required fields (Title, Category, Image File)');
                 return false;
             }

             return new Promise((resolve) => {
                 const reader = new FileReader();
                 reader.onload = (e) => resolve({ title, category, size, image_url: e.target.result });
                 reader.readAsDataURL(fileInput.files[0]);
             });
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${CONFIG.API_URL}/admin/artworks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.value)
                });
                if(!response.ok) throw new Error('Publish Failed');

                renderGallery(); // Re-render everything

                Swal.fire({
                    icon: 'success',
                    title: 'Artwork Published!',
                    text: 'Your new masterpiece is now live on the public gallery.',
                    confirmButtonColor: '#1A1A1A'
                });
            } catch (error) {
                console.error("Publish Error:", error);
            }
        }
    });
};

// 7. Services Management Logic
window.previewServiceImage = (id) => {
    const file = document.getElementById(`service-${id}-file`).files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewEl = document.getElementById(`service-${id}-preview`);
            if(previewEl) previewEl.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

window.saveServices = async () => {
    try {
        const getBase64 = (file) => {
            return new Promise((resolve, reject) => {
                if(!file) resolve(null);
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        Swal.fire({
            title: 'Updating Services...',
            text: 'Synchronizing your artistic categories...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const currentServices = JSON.parse(localStorage.getItem('services_data')) || [];
        const services = [];
        
        for(let i=1; i<=3; i++) {
            const fileInput = document.getElementById(`service-${i}-file`);
            const titleInput = document.getElementById(`service-${i}-title`);
            const descInput = document.getElementById(`service-${i}-desc`);
            
            if(!titleInput || !descInput) continue;

            const title = titleInput.value;
            const desc = descInput.value;
            
            let img = currentServices.find(s => s.id === i)?.img || "";
            
            if(!img) {
                const defaultMap = { 1: 'images/portrait_sample.png', 2: 'images/digital_art.png', 3: 'images/colored.jpg' };
                img = defaultMap[i];
            }

            if(fileInput && fileInput.files[0]) {
                const b64 = await getBase64(fileInput.files[0]);
                if(b64) img = b64;
            }
            
            services.push({ id: i, title, desc, img });
        }

        localStorage.setItem('services_data', JSON.stringify(services));

        await Swal.fire({
            icon: 'success',
            title: 'Sync Complete!',
            text: 'Your landing page highlights have been updated successfully.',
            confirmButtonColor: '#1A1A1A',
            timer: 2000,
            timerProgressBar: true
        });

        if(typeof loadServicesToForm === 'function') loadServicesToForm();

    } catch (error) {
        console.error("Save Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.name === 'QuotaExceededError' 
                ? 'Your images are too large for browser storage. Please try smaller files.' 
                : 'An unexpected error occurred while saving.',
            confirmButtonColor: '#C16053'
        });
    }
};

window.loadServicesToForm = () => {
    const defaultServices = [
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
            img: "images/colored.jpg"
        }
    ];

    const services = JSON.parse(localStorage.getItem('services_data')) || defaultServices;

    services.forEach(service => {
        const titleInput = document.getElementById(`service-${service.id}-title`);
        const descInput = document.getElementById(`service-${service.id}-desc`);
        const previewImg = document.getElementById(`service-${service.id}-preview`);

        if(titleInput) titleInput.value = service.title;
        if(descInput) descInput.value = service.desc;
        if(previewImg) previewImg.src = service.img;
    });
};

// 8. Rates Management Logic
window.saveRates = async () => {
    Swal.fire({
        title: 'Updating Rates...',
        text: 'Synchronizing pricing structures with the cloud...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        for(let i=1; i<=4; i++) {
            const data = {
                size: document.getElementById(`rate-${i}-size`).value,
                label: document.getElementById(`rate-${i}-label`).value,
                price: document.getElementById(`rate-${i}-price`).value
            };
            
            await fetch(`${CONFIG.API_URL}/admin/rates/${i}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }

        Swal.fire({
            icon: 'success',
            title: 'Rates Updated!',
            text: 'Pricing tiers have been updated securely.',
            confirmButtonColor: '#1A1A1A'
        });
    } catch(err) {
        Swal.fire({ icon: 'error', title: 'Update Failed', confirmButtonColor: '#C16053' });
    }
};

window.loadRatesToForm = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/rates`);
        const rates = response.ok ? await response.json() : [];

        rates.forEach(rate => {
            const sizeInput = document.getElementById(`rate-${rate.id}-size`);
            const labelInput = document.getElementById(`rate-${rate.id}-label`);
            const priceInput = document.getElementById(`rate-${rate.id}-price`);

            if(sizeInput) sizeInput.value = rate.size;
            if(labelInput) labelInput.value = rate.label;
            if(priceInput) priceInput.value = rate.price;
        });
    } catch(err) {
        console.error("Error loading rates:", err);
    }
};

// 9. Change Password Logic
window.handlePasswordUpdate = (e) => {
    e.preventDefault();
    const current = document.getElementById('current-pass').value;
    const newP = document.getElementById('new-pass').value;
    const confirmP = document.getElementById('confirm-pass').value;
    
    // Check against stored password or default
    const storedPass = localStorage.getItem('admin_pass') || 'admin123';

    if(current !== storedPass) {
        Swal.fire({
            icon: 'error',
            title: 'Incorrect Passkey',
            text: 'Your current passkey does not match our records.',
            confirmButtonColor: '#C16053'
        });
        return;
    }

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

    // Save New Password
    localStorage.setItem('admin_pass', newP);

    Swal.fire({
        icon: 'success',
        title: 'Passkey Updated!',
        text: 'Your administrative security credentials have been changed successfully.',
        confirmButtonColor: '#1A1A1A'
    }).then(() => {
        // Clear inputs for security
        document.getElementById('current-pass').value = '';
        document.getElementById('new-pass').value = '';
        document.getElementById('confirm-pass').value = '';
    });
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
            renderAdminRequests();
            if(typeof initStatsCharts === 'function') initStatsCharts(); // Update Charts
            
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
    }).then((result) => {
        if (result.isConfirmed) {
            // Clear Authentication State
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_email');
            
            // Graceful Redirect
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

    // Sync Data
    if (tabId === 'gallery-tab' && typeof renderGallery === 'function') renderGallery();
    if (tabId === 'booking-tab' && typeof renderAdminRequests === 'function') {
        renderAdminRequests();
        initStatsCharts();
    }
    if (tabId === 'services-tab' && typeof loadServicesToForm === 'function') loadServicesToForm();
    if (tabId === 'rates-tab' && typeof loadRatesToForm === 'function') loadRatesToForm();
};

let volumeChartInst = null;
let revenueChartInst = null;

window.initStatsCharts = async () => {
    const ctxVol = document.getElementById('volumeChart');
    const ctxRev = document.getElementById('revenueChart');
    if (!ctxVol || !ctxRev) return;

    if (volumeChartInst) volumeChartInst.destroy();
    if (revenueChartInst) revenueChartInst.destroy();

    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/bookings`);
        const bookings = await response.json();

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

        volumeChartInst = new Chart(ctxVol, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{ label: 'Completions', data: completedVolume, backgroundColor: '#22c55e' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f3f4f6' } },
                    x: { grid: { display: false } }
                }
            }
        });

        const pending = bookings.filter(b => b.status === 'pending').length;
        const accepted = bookings.filter(b => b.status === 'accepted').length;

        revenueChartInst = new Chart(ctxRev, {
            type: 'bar',
            data: {
                labels: ['Pending', 'WIP (Accepted)'],
                datasets: [{ data: [pending, accepted], backgroundColor: ['#3b82f6', '#1A1A1A'] }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#f3f4f6' } },
                    x: { grid: { display: false } }
                }
            }
        });
    } catch (e) {
        console.error("Charts Sync Error:", e);
    }
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

    if(window.location.pathname.includes('dashboard.html')) {
        switchTab('booking-tab');
    }
});

// SERVICE MANAGER LOGIC
window.loadServicesToForm = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/services`);
        const services = await response.json();
        
        services.forEach((service, index) => {
            const i = index + 1;
            const titleInput = document.getElementById(`service-${i}-title`);
            const descInput = document.getElementById(`service-${i}-desc`);
            const previewImg = document.getElementById(`service-${i}-preview`);
            
            if(titleInput) titleInput.value = service.title;
            if(descInput) descInput.value = service.description;
            if(previewImg) previewImg.src = service.image_url || 'images/portrait_sample.png';
            
            // Store database ID on the element
            if(titleInput) titleInput.dataset.dbId = service.id;
        });
    } catch (e) { console.error("Load Services Error:", e); }
};

window.saveServices = async () => {
    Swal.fire({ title: 'Saving Services...', didOpen: () => Swal.showLoading() });
    try {
        for(let i=1; i<=3; i++) {
            const id = document.getElementById(`service-${i}-title`).dataset.dbId;
            const title = document.getElementById(`service-${i}-title`).value;
            const description = document.getElementById(`service-${i}-desc`).value;
            const image_url = document.getElementById(`service-${i}-preview`).src;

            await fetch(`${CONFIG.API_URL}/admin/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, image_url })
            });
        }
        Swal.fire({ icon: 'success', title: 'Services Updated', confirmButtonColor: '#1A1A1A' });
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Update Failed', confirmButtonColor: '#1A1A1A' });
    }
};

window.previewServiceImage = async (index) => {
    const file = document.getElementById(`service-${index}-file`).files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById(`service-${index}-preview`).src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// RATE MANAGER LOGIC
window.loadRatesToForm = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/rates`);
        const rates = await response.json();
        
        rates.forEach((rate, index) => {
            const i = index + 1;
            const sizeInput = document.getElementById(`rate-${i}-size`);
            const labelInput = document.getElementById(`rate-${i}-label`);
            const priceInput = document.getElementById(`rate-${i}-price`);
            
            if(sizeInput) sizeInput.value = rate.size;
            if(labelInput) labelInput.value = rate.label;
            if(priceInput) priceInput.value = rate.price;
            
            if(sizeInput) sizeInput.dataset.dbId = rate.id;
        });
    } catch (e) { console.error("Load Rates Error:", e); }
};

window.saveRates = async () => {
    Swal.fire({ title: 'Saving Rates...', didOpen: () => Swal.showLoading() });
    try {
        for(let i=1; i<=4; i++) {
            const id = document.getElementById(`rate-${i}-size`).dataset.dbId;
            const size = document.getElementById(`rate-${i}-size`).value;
            const label = document.getElementById(`rate-${i}-label`).value;
            const price = document.getElementById(`rate-${i}-price`).value;

            await fetch(`${CONFIG.API_URL}/admin/rates/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ size, label, price })
            });
        }
        Swal.fire({ icon: 'success', title: 'Rates Updated', confirmButtonColor: '#1A1A1A' });
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Update Failed', confirmButtonColor: '#1A1A1A' });
    }
};

