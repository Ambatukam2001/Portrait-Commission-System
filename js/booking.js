// ============================================================
// PENCILATION — Booking Form Logic (index.html)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    // ── Payment toggle ───────────────────────────────────────
    window.toggleGCashReceipt = (el) => {
        const wrapper = document.getElementById('gcash-receipt-wrapper');
        const input   = document.getElementById('gcash-receipt-file');
        if (!wrapper) return;
        const isGcash = el.value === 'gcash';
        wrapper.classList.toggle('hidden', !isGcash);
        if (input) input.required = isGcash;
    };

    // Initialise on page load
    const paySelect = bookingForm.querySelector('select[name="payment"]');
    if (paySelect) toggleGCashReceipt(paySelect);

    // ── File name display ────────────────────────────────────
    window.updateFilename = (inputId, targetId) => {
        const input  = document.getElementById(inputId);
        const target = document.getElementById(targetId);
        if (input?.files[0] && target) {
            target.textContent = `Attached: ${input.files[0].name.substring(0, 24)}...`;
            target.parentElement.classList.add('bg-green-50', 'border-green-200');
        }
    };

    // ── Compress image to base64 ─────────────────────────────
    function compressImage(file, maxW = 800, maxH = 800, quality = 0.5) {
        return new Promise((resolve, reject) => {
            if (!file) { resolve(null); return; }
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (e) => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxW) { height = height * maxW / width; width = maxW; }
                    if (height > maxH) { width = width * maxH / height; height = maxH; }
                    const canvas = document.createElement('canvas');
                    canvas.width  = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ── Form submit ──────────────────────────────────────────
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd          = new FormData(bookingForm);
        const paymentType = fd.get('payment');
        const receiptInput = document.getElementById('gcash-receipt-file');

        // Validate GCash receipt
        if (paymentType === 'gcash' && !receiptInput?.files[0]) {
            Swal.fire({ icon: 'warning', title: 'Receipt Required', text: 'Please upload your GCash screenshot.', confirmButtonColor: '#C16053' });
            return;
        }

        Swal.fire({ title: 'Submitting...', text: 'Curating your commission details…', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const refFile     = bookingForm.querySelector('input[name="file"]');
            const referenceUrl = refFile?.files[0] ? await compressImage(refFile.files[0]) : null;
            const receiptUrl   = (paymentType === 'gcash' && receiptInput?.files[0])
                                 ? await compressImage(receiptInput.files[0])
                                 : null;

            const payload = {
                client_name:    fd.get('name'),
                client_email:   fd.get('email'),
                client_phone:   fd.get('phone'),
                client_social:  fd.get('social'),
                medium:         fd.get('medium'),
                size:           fd.get('size'),
                address:        fd.get('address'),
                deadline:       fd.get('deadline') || null,
                payment_method: paymentType,
                reference_url:  referenceUrl,
                receipt_url:    receiptUrl
            };

            const res = await fetch(`${CONFIG.API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Server error ${res.status}`);
            }

            await Swal.fire({
                icon: 'success',
                title: 'Commission Submitted!',
                text: `We'll reach out to you at ${payload.client_email} soon.`,
                confirmButtonColor: '#C16053'
            });

            bookingForm.reset();
            if (paySelect) toggleGCashReceipt(paySelect);

        } catch (err) {
            console.error('Booking Error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: err.message || 'Could not connect to the server. Please try again.',
                confirmButtonColor: '#1A1A1A'
            });
        }
    });

    // ── Leaflet Map Picker ───────────────────────────────────
    const mapDiv      = document.getElementById('booking-map-picker');
    const addrInput   = document.getElementById('booking-address-input');
    if (!mapDiv) return;

    const bgc = [14.5492, 121.0450];
    const map = L.map('booking-map-picker', { zoomControl: false }).setView(bgc, 15);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

    let pickedLatLng = { lat: bgc[0], lng: bgc[1] };
    const marker = L.marker(bgc, { draggable: true }).addTo(map);

    function setAddress(lat, lng, label = '') {
        pickedLatLng = { lat, lng };
        if (addrInput) addrInput.value = label || `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        setAddress(lat, lng);
    });

    window.searchMapLocation = async () => {
        const query = document.getElementById('map-search-input')?.value.trim();
        if (!query) return;
        try {
            const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.length) {
                const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
                map.setView([lat, lng], 16);
                marker.setLatLng([lat, lng]);
                setAddress(lat, lng, `📍 ${query}`);
            } else {
                Swal.fire({ icon: 'error', title: 'Not Found', text: 'Try a more specific location.', confirmButtonColor: '#1A1A1A' });
            }
        } catch { Swal.fire({ icon: 'error', title: 'Search Error', confirmButtonColor: '#1A1A1A' }); }
    };

    window.openExternalGoogleMap = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${pickedLatLng.lat},${pickedLatLng.lng}`, '_blank');
    };

    // Fix map tile loading after tab visibility change
    window.addEventListener('click', () => setTimeout(() => map.invalidateSize(), 300), { passive: true });
});
