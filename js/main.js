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

    // ── 2. Sticky Navbar ────────────────────────────────────
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                mainNav.classList.remove('bg-transparent', 'py-6', 'border-none');
                mainNav.classList.add('bg-white', 'py-4', 'border-b', 'border-gray-100', 'shadow-sm');
            } else {
                mainNav.classList.add('bg-transparent', 'py-6', 'border-none');
                mainNav.classList.remove('bg-white', 'py-4', 'border-b', 'border-gray-100', 'shadow-sm');
            }
        });
    }

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

    // ── 5. Live Session Badge (from localStorage) ───────────
    const liveBadge    = document.getElementById('artist-live-badge');
    const liveLink     = document.getElementById('live-session-link');
    const isArtistLive = localStorage.getItem('is_live_session') === 'true';
    const liveUrl      = localStorage.getItem('live_meeting_url');

    if (liveBadge && isArtistLive) {
        liveBadge.classList.replace('hidden', 'flex');
        if (liveLink && liveUrl) liveLink.href = liveUrl;
    }
});
