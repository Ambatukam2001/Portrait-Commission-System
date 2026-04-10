<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard | Pencilation Portrait System</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        display: ['Outfit', 'sans-serif'],
                    },
                    animation: {
                        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                    },
                    keyframes: {
                        fadeInUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        }
                    }
                }
            }
        }
    </script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;700;900&display=swap" rel="stylesheet">
    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <!-- Leaflet Map -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body, html {
            height: 100dvh;
            overflow: hidden !important;
            position: fixed;
            width: 100%;
            background-color: #1A1A1A;
        }

        .active-tab {
            background-color: rgba(255, 255, 255, 0.1);
            color: #C16053 !important;
        }

        .tab-btn:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }

        aside nav, aside {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        aside nav::-webkit-scrollbar, aside::-webkit-scrollbar {
            display: none;
        }

        main {
            border-radius: 0;
            overflow: hidden;
            background: white;
            height: 100dvh;
        }

        @media (min-width: 1024px) {
            main {
                border-radius: 24px;
                margin: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            }
        }

        #sidebar {
            border-radius: 0 !important;
            height: 100dvh;
        }
    </style>
</head>

<body class="bg-[#1A1A1A] flex h-screen overflow-hidden font-display">

    <!-- Mobile Sidebar Toggle -->
    <button id="sidebar-toggle"
        class="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-[#1A1A1A] text-white flex items-center justify-center shadow-2xl lg:hidden">
        <i data-lucide="menu" class="w-6 h-6"></i>
    </button>

    <!-- Fixed Sidebar Navigation -->
    <aside id="sidebar"
        class="fixed lg:relative w-[280px] lg:w-80 bg-[#1A1A1A] h-screen flex flex-col items-start py-12 transition-all duration-500 z-50 -translate-x-full lg:translate-x-0">
        <!-- Logo Branding -->
        <a href="/" class="px-8 mb-20 flex items-center space-x-4">
            <div class="w-10 h-10 bg-[#C16053] flex items-center justify-center">
                <i data-lucide="pencil" class="text-white w-5 h-5"></i>
            </div>
            <span class="text-lg md:text-xl lg:text-2xl font-black tracking-[0.2em] text-white uppercase">Pencilation</span>
        </a>

        <!-- Navigation Groups -->
        <nav class="w-full flex-1 space-y-2 px-6 overflow-y-auto">
            <p class="hidden lg:block text-[9px] font-black uppercase text-white/20 tracking-[0.3em] mb-6 px-4">Management</p>

            <button onclick="switchTab('booking-tab')" class="tab-btn active-tab w-full flex items-center justify-start space-x-5 p-5 rounded-[2rem] transition-all text-white/50">
                <i data-lucide="layout-grid" class="w-5 h-5"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Dashboard</span>
            </button>

            <button onclick="switchTab('request-tab')" class="tab-btn w-full flex items-center justify-start space-x-5 p-5 rounded-[2rem] transition-all text-white/50">
                <i data-lucide="inbox" class="w-5 h-5"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Requests</span>
            </button>

            <button onclick="switchTab('gallery-tab')" class="tab-btn w-full flex items-center justify-start space-x-5 p-5 rounded-[2rem] transition-all text-white/50">
                <i data-lucide="image" class="w-5 h-5"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Gallery Manager</span>
            </button>
        </nav>

        <div class="px-6 w-full pt-10 border-t border-white/5">
            <form action="{{ route('logout') }}" method="POST">
                @csrf
                <button type="submit" class="w-full flex items-center justify-start space-x-5 p-5 text-red-400/60 hover:text-red-400 rounded-[2rem] transition-all">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                    <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Logout</span>
                </button>
            </form>
        </div>
    </aside>

    <!-- Content Engine -->
    <main class="flex-1 h-full overflow-hidden relative flex flex-col">
        <header class="sticky top-0 z-40 bg-white/60 backdrop-blur-3xl px-8 lg:px-16 py-6 lg:py-10 border-b border-gray-100 flex justify-between items-center w-full">
            <div class="flex items-center space-x-4">
                <i data-lucide="layout-dashboard" class="w-5 h-5 text-[#C16053]"></i>
                <h1 id="tab-title" class="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-widest text-[#1A1A1A]">OVERVIEW</h1>
            </div>

            <div class="text-right flex flex-col items-end">
                <p class="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#C16053]">ADEL</p>
                <p class="text-[8px] md:text-[9px] text-[#1A1A1A] font-bold uppercase tracking-[0.4em] opacity-40">SUPER ADMIN</p>
            </div>
        </header>

        <div class="flex-1 p-6 md:p-12 lg:p-20 w-full overflow-y-auto">
            <!-- Stats Tab -->
            <section id="booking-tab" class="content-tab space-y-12">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="bg-white p-8 md:p-10 shadow-sm border border-gray-50 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest mb-2">Total Requests</p>
                            <h4 id="total-requests-stat" class="text-4xl md:text-5xl font-black tracking-tighter">{{ $total_req ?? 0 }}</h4>
                        </div>
                        <div class="w-14 h-14 bg-gray-50 flex items-center justify-center text-[#1A1A1A]">
                            <i data-lucide="folder" class="w-7 h-7"></i>
                        </div>
                    </div>
                    <div class="bg-white p-8 md:p-10 border border-gray-50 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest mb-2">Gallery Pieces</p>
                            <h4 id="gallery-count-stat" class="text-4xl md:text-5xl font-black text-[#C16053] tracking-tighter">{{ $artwork_count ?? 0 }}</h4>
                        </div>
                        <div class="w-14 h-14 bg-[#C16053]/5 flex items-center justify-center text-[#C16053]">
                            <i data-lucide="image" class="w-7 h-7"></i>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <script src="{{ asset('js/config.js?v=7.0') }}"></script>
    <script src="{{ asset('js/dashboard-logic.js?v=7.0') }}"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>
