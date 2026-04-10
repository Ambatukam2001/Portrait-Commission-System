<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Pencilation - Bespoke Portrait Drawing & Commission System">
    <title>Pencilation | Artistic Portrait Booking System</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Supabase JS Client -->
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/style.css?v=10.0') }}">
    <!-- Leaflet Map -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
</head>

<body class="bg-[#FDFBF7] text-[#1A1A1A] overflow-x-hidden">
    <!-- Absolute Header (Scrolls away natively) -->
    <nav id="main-nav"
        class="absolute top-0 left-0 right-0 z-[999] py-8 px-6 md:px-12 flex justify-between items-center w-full">
        <div class="logo font-display text-2xl md:text-3xl font-black flex items-center space-x-2">
            <i data-lucide="pencil" class="text-[#C16053] w-5 h-5 md:w-6 md:h-6"></i>
            <span>Pencilation</span>
        </div>

        <!-- Mobile Navigation Toggle -->
        <div class="md:hidden flex items-center justify-center space-x-4">
            <button id="mobile-toggle" class="hamburger p-2 focus:outline-none">
                <span class="line"></span>
                <span class="line"></span>
                <span class="line"></span>
            </button>
        </div>

        <!-- Admin Access Button -->
        <div id="nav-auth-container" class="md:block hidden">
            <a href="/login"
                class="bg-white text-[#1A1A1A] border-none shadow-xl px-10 py-4 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#C16053] hover:text-white transition-all transform hover:-translate-y-1 inline-block">
                Artist Login
            </a>
        </div>
    </nav>

    <!-- Mobile Navigation Overlay -->
    <div id="mobile-menu"
        class="fixed inset-0 bg-[#FDFBF7] z-[1000] transform translate-x-full transition-transform duration-500 ease-in-out md:hidden flex flex-col items-center justify-center space-y-12 p-8">
        <button id="mobile-close" class="absolute top-8 right-12 text-[#1A1A1A]">
            <i data-lucide="x" class="w-8 h-8"></i>
        </button>
        <ul class="text-center space-y-8">
            <li><a href="#hero" class="mobile-nav-link text-3xl font-black uppercase tracking-tighter hover:text-[#C16053]">Overview</a></li>
            <li><a href="#services" class="mobile-nav-link text-3xl font-black uppercase tracking-tighter hover:text-[#C16053]">Services</a></li>
            <li><a href="#about" class="mobile-nav-link text-3xl font-black uppercase tracking-tighter hover:text-[#C16053]">About Me</a></li>
            <li><a href="#rates" class="mobile-nav-link text-3xl font-black uppercase tracking-tighter hover:text-[#C16053]">Pricing</a></li>
            <li><a href="#gallery" class="mobile-nav-link text-3xl font-black uppercase tracking-tighter hover:text-[#C16053]">Portfolio</a></li>
            <li><a href="#booking" class="mobile-nav-link text-3xl font-black uppercase tracking-tighter text-[#C16053]">Book Now</a></li>
        </ul>
        <a href="/login" class="bg-[#1A1A1A] text-white px-12 py-5 font-black uppercase tracking-[0.4em] text-xs">Artist Login</a>
    </div>

    <main>
        <!-- Hero Section -->
        <section id="hero" class="min-h-screen relative flex items-center px-12 pt-32 pb-24">
            <div class="absolute right-0 top-0 w-1/2 h-full bg-[#1A1A1A] hidden md:block"
                style="clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%);">
                <div class="relative w-full h-full flex items-center justify-center">
                    <img src="{{ asset('images/adel.JPG') }}" alt="Artist Adel"
                        class="auth-img absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70%] opacity-100 drop-shadow-2xl">
                    <div class="absolute top-[20%] right-[10%] text-white text-right space-y-4">
                        <p class="font-display text-8xl leading-none">FAUVISM<br>PORTRAIT</p>
                        <p class="font-sans text-sm tracking-[0.5em] text-[#C16053]">EST. 2024</p>
                    </div>
                </div>
            </div>

            <div class="max-w-3xl space-y-10 relative z-20 animate-fade-in-up">
                <p class="text-xs tracking-[0.3em] uppercase text-[#C16053] font-bold">Custom Portraits & Drawings</p>
                <h1 class="text-6xl md:text-8xl leading-[0.9] font-black">"HI<br>IM<br>ASSHING"</h1>
                <p class="text-lg max-w-md opacity-80">
                    Capturing souls through monochromatic and vibrant Fauvism-inspired digital and traditional
                    portraiture. Bespoke art tailored for you.
                </p>
                <div class="flex flex-wrap gap-4 pt-6 relative z-30">
                    <a href="#booking" class="bg-[#1A1A1A] text-white px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-[#C16053] transition-all hover:scale-105 shadow-xl">Book Commission</a>
                    <a href="#gallery" class="border-2 border-[#1A1A1A] px-10 py-5 font-black uppercase tracking-widest text-xs hover:bg-[#1A1A1A] hover:text-white transition-all hover:scale-105 shadow-lg">View My Works</a>
                </div>
            </div>
        </section>

        <!-- Services Section -->
        <section id="services" class="py-32 px-12 bg-white">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col md:flex-row md:items-end justify-between mb-20">
                    <div class="space-y-4">
                        <h2 class="text-5xl md:text-7xl font-black uppercase tracking-normal">SERVICES</h2>
                        <p class="max-w-md opacity-60">Professional portraiture spanning multiple mediums and styles.</p>
                    </div>
                </div>

                <div id="services-grid-container" class="grid md:grid-cols-3 gap-12">
                    <div class="group border-b border-gray-100 pb-12">
                        <div class="aspect-square bg-[#FDFBF7] overflow-hidden mb-8 relative">
                            <img src="{{ asset('images/portrait_sample.png') }}" class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-all duration-700">
                        </div>
                        <h3 class="text-xl font-bold">Pencil Realism Art</h3>
                    </div>
                </div>
            </div>
        </section>

        <!-- Gallery Section -->
        <section id="gallery" class="py-32 px-12 bg-[#FDFBF7]">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col md:flex-row md:items-end justify-between mb-20">
                    <div class="space-y-4">
                        <h2 class="text-5xl md:text-7xl font-black">PORTFOLIO</h2>
                        <p class="max-w-md opacity-60">A curated collection of my most recent works.</p>
                    </div>
                </div>

                <div class="relative group">
                    <button onclick="scrollGallery(-1)" class="absolute -left-4 md:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 shadow-xl border border-gray-100">
                        <i data-lucide="chevron-left" class="w-5 h-5"></i>
                    </button>
                    <button onclick="scrollGallery(1)" class="absolute -right-4 md:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#1A1A1A] shadow-xl border border-white/10 text-white">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>

                    <div id="gallery-container" class="gallery-grid no-scrollbar">
                        <!-- Supabase Real-time will push updates here -->
                        <div id="gallery-loading" class="col-span-full flex flex-col items-center justify-center py-24 gap-4 opacity-40">
                            <div class="w-10 h-10 border-4 border-[#C16053] border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-[10px] font-black uppercase tracking-widest">Awaiting Live Feed...</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="py-20 px-12 border-t border-gray-100 bg-[#FDFBF7]">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="font-display text-2xl font-black">Pencilation<span class="text-[#C16053]">.</span></div>
            <p class="text-xs font-bold text-gray-400">© 2024 PORTRAIT BOOKING SYSTEM. ALL RIGHTS RESERVED.</p>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="{{ asset('js/config.js?v=3.0') }}"></script>
    <script src="{{ asset('js/main.js?v=4.0') }}"></script>
    <script src="{{ asset('js/gallery.js?v=3.0') }}"></script>
    <script src="{{ asset('js/booking.js?v=3.0') }}"></script>
    <script>
        lucide.createIcons();

        // 🚀 Initialize Supabase Real-time
        if (typeof supabase !== 'undefined') {
            const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            sbClient
                .channel('artworks-realtime')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artworks' }, payload => {
                    console.log('Real-time Art Update:', payload.new);
                    if (typeof loadGallery === 'function') loadGallery(); // Re-fetch or append
                })
                .subscribe();
        }
    </script>
</body>

</html>
