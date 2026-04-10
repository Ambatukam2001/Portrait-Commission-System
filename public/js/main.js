// ============================================================
// PENCILATION — Main UI Logic (index.html only)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Smooth Anchor Scrolling ──────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const el = document.querySelector(targetId);
            if (el) {
                e.preventDefault();
                window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // ── 2. Sticky Navbar (Removed to allow absolute scrolling) ────────────────

    // ── 3. Mobile Menu Toggle ───────────────────────────────
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose  = document.getElementById('mobile-close');
    const mobileMenu   = document.getElementById('mobile-menu');

    const openMenu  = () => { if (mobileMenu) { mobileMenu.classList.add('translate-x-0'); mobileMenu.classList.remove('translate-x-full'); document.body.style.overflow = 'hidden'; } };
    const closeMenu = () => { if (mobileMenu) { mobileMenu.classList.remove('translate-x-0'); mobileMenu.classList.add('translate-x-full'); document.body.style.overflow = ''; } };

    if (mobileToggle) mobileToggle.addEventListener('click', openMenu);
    if (mobileClose)  mobileClose.addEventListener('click', closeMenu);
    document.querySelectorAll('.mobile-nav-link').forEach(link => link.addEventListener('click', closeMenu));

    // ── 4. Scroll Spy for Glass Dock ────────────────────────
    const sections = document.querySelectorAll('section[id]');
    const dockItems = document.querySelectorAll('.dock-item');

    if (sections.length && dockItems.length) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                if (window.pageYOffset >= section.offsetTop - 150) {
                    current = section.getAttribute('id');
                }
            });
            dockItems.forEach(item => {
                item.classList.toggle('active-dock-item', item.getAttribute('href') === `#${current}`);
            });
        }, { passive: true });
    }

    // ── 5. Live Artist Session Badge ────────────────────────
    function checkLiveStatus() {
        const liveBadge    = document.getElementById('artist-live-badge');
        const liveLink     = document.getElementById('live-session-link');
        const isArtistLive = localStorage.getItem('is_live_session') === 'true';
        const liveUrl      = localStorage.getItem('live_meeting_url');

        if (liveBadge && isArtistLive) {
            liveBadge.classList.replace('hidden', 'flex');
            if (liveLink && liveUrl) liveLink.href = liveUrl;
        }
    }

    // ── 6. Live Booking Notification ──────────────────────────
    async function checkBookingNotification() {
        const lastEmail = localStorage.getItem('last_booking_email');
        if (!lastEmail) return;

        const noticeEl = document.getElementById('user-meetup-notice');
        const nameEl   = document.getElementById('user-meetup-name');
        if (!noticeEl) return;

        try {
            if (typeof PencilationDB === 'undefined') return;
            await PencilationDB.waitForSupabase();
            const data = await PencilationDB.getBookingStatusByEmail(lastEmail);

            if (data && data.status === 'accepted') {
                noticeEl.classList.remove('hidden');
                noticeEl.classList.add('flex');
                if (nameEl) nameEl.textContent = data.address || 'Standard Location Spot';
                lucide.createIcons();
            }
        } catch (e) {
            console.warn('Booking status check failed:', e);
        }
    }

    // Initialize all status components
    checkLiveStatus();
    checkBookingNotification();
});
