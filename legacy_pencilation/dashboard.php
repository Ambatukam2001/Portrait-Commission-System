<?php
include 'database.php';

// ── Fetch bookings directly from DB ─────────────────────────
$bookings      = [];
$total_req     = 0;
$total_pending = 0;
$total_done    = 0;

if ($pdo) {
    try {
        $stmt     = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
        $bookings = $stmt->fetchAll();

        $total_req     = count($bookings);
        $total_pending = count(array_filter($bookings, fn($b) => in_array($b['status'], ['pending', 'accepted'])));
        $total_done    = count(array_filter($bookings, fn($b) => in_array($b['status'], ['completed', 'rejected'])));

        // Gallery artwork from DB
        $art_stmt     = $pdo->query("SELECT * FROM artworks ORDER BY created_at DESC");
        $artworks     = $art_stmt->fetchAll();
        $artwork_count = count($artworks);
    } catch (PDOException $e) {
        $db_error = $e->getMessage();
    }
}

// ── Confirmed earnings calc ──────────────────────────────────
$confirmed_count = count(array_filter($bookings, fn($b) => in_array($b['status'], ['accepted', 'completed'])));
$revenue_raw     = $confirmed_count * 1500;
$revenue_display = $revenue_raw >= 1000 ? '₱' . number_format($revenue_raw / 1000, 1) . 'k' : '₱' . $revenue_raw;

// ── Pass bookings to JS as a JSON blob ──────────────────────
$bookings_json = json_encode($bookings, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
?>
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
    <link rel="stylesheet" href="css/style.css">
    <!-- Leaflet Map -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body, html {
            height: 100%;
            height: 100dvh;
            overflow: hidden !important;
            position: fixed;
            width: 100%;
        }

        .active-tab {
            background-color: rgba(255, 255, 255, 0.1);
            color: #C16053 !important;
        }

        .tab-btn:hover {
            background-color: rgba(255, 255, 255, 0.05);
        }

        /* Hide scrollbar for sidebar nav */
        aside nav,
        aside {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        aside nav::-webkit-scrollbar,
        aside::-webkit-scrollbar {
            display: none;
        }

        /* Aesthetic: Modern Rounded Workspace */
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

        main .bg-white,
        main button:not(.rounded-full),
        main .card,
        main .container {
            border-radius: 12px !important;
        }

        /* Keep Sidebar Square and Flush */
        #sidebar {
            border-radius: 0 !important;
            height: 100dvh;
        }

        #sidebar * {
            border-radius: 0 !important;
        }

        /* DB error banner */
        .db-error-banner {
            background: #C16053;
            color: white;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            padding: 10px 24px;
            text-align: center;
        }
    </style>
</head>

<body class="bg-[#1A1A1A] flex h-screen overflow-hidden font-display">

    <?php if (!$pdo): ?>
    <!-- DB Connection Error Banner -->
    <div class="db-error-banner fixed top-0 left-0 right-0 z-[999]">
        ⚠ Database connection failed: <?= htmlspecialchars($db_error ?? 'Unknown error') ?> — Check XAMPP MySQL.
    </div>
    <?php endif; ?>

    <!-- Mobile Sidebar Toggle -->
    <button id="sidebar-toggle"
        class="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-[#1A1A1A] text-white flex items-center justify-center shadow-2xl lg:hidden active:scale-95 transition-all">
        <i data-lucide="menu" class="w-6 h-6"></i>
    </button>

    <!-- Fixed Sidebar Navigation -->
    <aside id="sidebar"
        class="fixed lg:relative w-[280px] lg:w-80 bg-[#1A1A1A] h-screen flex flex-col items-start py-12 transition-all duration-500 z-50 shadow-2xl -translate-x-full lg:translate-x-0">
        <!-- Logo Branding -->
        <a href="index.php"
            class="px-8 mb-20 flex items-center space-x-4 group hover:opacity-80 transition-all no-underline">
            <div
                class="w-10 h-10 bg-[#C16053] flex items-center justify-center transition-transform group-hover:rotate-12">
                <i data-lucide="pencil" class="text-white w-5 h-5"></i>
            </div>
            <span
                class="text-lg md:text-xl lg:text-2xl font-black tracking-[0.2em] text-white uppercase">Pencilation</span>
        </a>

        <!-- Navigation Groups -->
        <nav class="w-full flex-1 space-y-2 px-6 overflow-y-auto">
            <p class="hidden lg:block text-[9px] font-black uppercase text-white/20 tracking-[0.3em] mb-6 px-4">
                Management</p>

            <button onclick="switchTab('booking-tab')"
                class="tab-btn active-tab w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group text-white/50">
                <i data-lucide="layout-grid" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Dashboard</span>
            </button>

            <button onclick="switchTab('request-tab')"
                class="tab-btn w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group text-white/50">
                <i data-lucide="inbox" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Requests</span>
            </button>

            <button onclick="switchTab('gallery-tab')"
                class="tab-btn w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group text-white/50">
                <i data-lucide="image" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Gallery Manager</span>
            </button>

            <button onclick="switchTab('services-tab')"
                class="tab-btn w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group text-white/50">
                <i data-lucide="layers" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Services Manager</span>
            </button>

            <button onclick="switchTab('rates-tab')"
                class="tab-btn w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group text-white/50">
                <i data-lucide="tag" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Rates Manager</span>
            </button>

            <div class="h-px bg-white/5 my-8 mx-4"></div>
            <p class="hidden lg:block text-[9px] font-black uppercase text-white/20 tracking-[0.3em] mb-6 px-4">Insights
            </p>

            <button onclick="switchTab('history-tab')"
                class="tab-btn w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group focus:outline-none text-white/50">
                <i data-lucide="archive" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Archive</span>
            </button>

            <div class="h-px bg-white/5 my-8 mx-4"></div>
            <p class="hidden lg:block text-[9px] font-black uppercase text-white/20 tracking-[0.3em] mb-6 px-4">Security
            </p>

            <button onclick="switchTab('password-tab')"
                class="tab-btn w-full flex items-center justify-center lg:justify-start space-x-5 p-5 rounded-[2rem] transition-all duration-300 group focus:outline-none text-white/50">
                <i data-lucide="lock" class="w-5 h-5 transition-colors"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Change Password</span>
            </button>
        </nav>

        <!-- Sidebar Footer -->
        <div class="px-6 w-full pt-10 border-t border-white/5">
            <button onclick="logout()"
                class="w-full flex items-center justify-center lg:justify-start space-x-5 p-5 text-red-400/60 hover:text-red-400 hover:bg-red-400/5 rounded-[2rem] transition-all duration-300 bg-transparent border-none">
                <i data-lucide="log-out" class="w-5 h-5"></i>
                <span class="hidden lg:block font-black text-[10px] uppercase tracking-[0.2em]">Logout</span>
            </button>
        </div>
    </aside>

    <!-- Content Engine -->
    <main class="flex-1 h-full overflow-hidden relative flex flex-col">

        <!-- Sticky Contextual Header -->
        <header
            class="sticky top-0 z-40 bg-white/60 backdrop-blur-3xl px-8 lg:px-16 py-6 lg:py-10 border-b border-gray-100/50 flex flex-col md:flex-row justify-between items-center w-full gap-4 md:gap-0">
            <div class="flex items-center space-x-4">
                <i data-lucide="layout-dashboard" class="w-5 h-5 text-[#C16053]"></i>
                <h1 id="tab-title"
                    class="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-widest md:tracking-[0.5em] text-[#1A1A1A]">
                    OVERVIEW</h1>
            </div>

            <div
                class="w-full md:w-auto text-center md:text-right flex flex-row md:flex-col items-center md:items-end justify-center md:justify-end border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 space-x-4 md:space-x-0">
                <p id="dashboard-user-name"
                    class="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-[#C16053]">ADEL</p>
                <p id="dashboard-user-role"
                    class="text-[8px] md:text-[9px] text-[#1A1A1A] font-bold uppercase tracking-[0.4em] opacity-40">
                    SUPER ADMIN</p>
            </div>
        </header>

        <!-- Main Workspace -->
        <div class="flex-1 p-6 md:p-12 lg:p-20 w-full overflow-y-auto">

            <!-- Dashboard/Stats Tab -->
            <section id="booking-tab" class="content-tab space-y-12">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div
                        class="bg-white p-8 md:p-10 shadow-sm border border-gray-50 flex items-center justify-between transition-all hover:shadow-lg">
                        <div>
                            <p
                                class="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest mb-2 font-display">
                                Total Requests</p>
                            <h4 id="total-requests-stat" class="text-4xl md:text-5xl font-black tracking-tighter">
                                <?= $total_req ?>
                            </h4>
                        </div>
                        <div class="w-14 h-14 bg-gray-50 flex items-center justify-center text-[#1A1A1A]">
                            <i data-lucide="folder" class="w-7 h-7"></i>
                        </div>
                    </div>
                    <div
                        class="bg-white p-8 md:p-10 border border-gray-50 flex items-center justify-between transition-all hover:shadow-lg">
                        <div>
                            <p
                                class="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest mb-2 font-display">
                                Gallery Artworks</p>
                            <h4 id="gallery-count-stat"
                                class="text-4xl md:text-5xl font-black text-[#C16053] tracking-tighter"><?= str_pad($artwork_count ?? 0, 2, '0', STR_PAD_LEFT) ?></h4>
                        </div>
                        <div class="w-14 h-14 bg-[#C16053]/5 flex items-center justify-center text-[#C16053]">
                            <i data-lucide="image" class="w-7 h-7"></i>
                        </div>
                    </div>
                    <div
                        class="bg-white p-8 md:p-10 shadow-sm border border-gray-50 flex items-center justify-between transition-all hover:shadow-lg">
                        <div>
                            <p
                                class="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest mb-2 font-display">
                                Total Collection</p>
                            <h4 id="revenue-stat" class="text-4xl md:text-5xl font-black tracking-tighter">
                                <?= $revenue_display ?>
                            </h4>
                        </div>
                        <div class="w-14 h-14 bg-green-50 flex items-center justify-center text-green-600">
                            <i data-lucide="credit-card" class="w-7 h-7"></i>
                        </div>
                    </div>
                </div>

                <!-- Statistics Charts -->
                <div class="grid md:grid-cols-2 gap-8 mt-12">
                    <div class="bg-white p-10 border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                        <div class="flex justify-between items-center mb-8">
                            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">Completed
                                Commissions</h3>
                            <i data-lucide="check-circle" class="w-4 h-4 text-green-500"></i>
                        </div>
                        <div class="h-[300px]">
                            <canvas id="volumeChart"></canvas>
                        </div>
                    </div>

                    <div class="bg-white p-10 border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                        <div class="flex justify-between items-center mb-8">
                            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 italic">Pending
                                Workload</h3>
                            <i data-lucide="inbox" class="w-4 h-4 text-blue-500"></i>
                        </div>
                        <div class="h-[300px]">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Booking Request Management Tab (ADMIN) -->
            <section id="request-tab" class="content-tab hidden space-y-8 w-full">
                <div
                    class="bg-white p-6 md:p-12 lg:p-20 shadow-2xl shadow-gray-100/50 border border-gray-50/50 w-full animate-fade-in-up">
                    <div
                        class="flex flex-col lg:flex-row justify-between items-center mb-10 md:mb-16 gap-12 px-0 md:px-4">
                        <div class="space-y-4 text-center lg:text-left">
                            <h2 class="text-xs font-bold uppercase tracking-[0.5em] text-[#C16053] mb-2">Current
                                Requests</h2>
                            <h3 class="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[#1A1A1A]">
                                Reviewing Queue</h3>
                        </div>
                        <div class="flex flex-col md:flex-row items-center gap-4">
                            <button onclick="cleanDuplicates()"
                                class="w-full md:w-auto text-[10px] font-black uppercase tracking-[0.3em] px-8 py-4 bg-[#1A1A1A] text-white hover:bg-[#C16053] transition-all flex items-center justify-center space-x-3 shadow-xl">
                                <i data-lucide="shield-alert" class="w-3 h-3 text-[#C16053]"></i>
                                <span>Clean Duplicates</span>
                            </button>
                            <button id="live-session-btn" onclick="toggleLiveSession()"
                                class="w-full md:w-auto text-[10px] font-black uppercase tracking-[0.3em] px-8 py-4 bg-yellow-50 text-yellow-600 border border-yellow-100 shadow-sm text-center flex items-center justify-center space-x-3 hover:bg-yellow-100 transition-all">
                                <i data-lucide="radar" class="w-3 h-3"></i>
                                <span>Live Session</span>
                            </button>
                            <button onclick="syncDashboardData()"
                                class="w-full md:w-auto text-[10px] font-black uppercase tracking-[0.3em] px-8 py-4 bg-[#C16053]/10 text-[#C16053] border border-[#C16053]/20 shadow-sm text-center flex items-center justify-center space-x-3 hover:bg-[#C16053] hover:text-white transition-all">
                                <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    <!-- DB Status indicator -->
                    <?php if (!$pdo): ?>
                    <div class="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest">
                        ⚠ No DB connection — showing cached data only
                    </div>
                    <?php else: ?>
                    <div class="mb-4 flex items-center space-x-2 text-green-600">
                        <span class="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span class="text-[9px] font-black uppercase tracking-widest">Live — <?= $total_req ?> booking<?= $total_req != 1 ? 's' : '' ?> loaded from MySQL</span>
                    </div>
                    <?php endif; ?>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead
                                class="border-b-2 border-gray-50 text-[11px] uppercase font-black tracking-[0.3em] text-gray-300">
                                <tr>
                                    <th class="py-6 px-4">Client Contact</th>
                                    <th class="py-6 px-4">Meet-up</th>
                                    <th class="py-6 px-4">Medium</th>
                                    <th class="py-6 px-4">Reference</th>
                                    <th class="py-6 px-4">Investment</th>
                                    <th class="py-6 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="request-tbody" class="text-xs">
                                <!-- PHP pre-renders pending/accepted rows -->
                                <?php
                                $current = array_filter($bookings, fn($b) => in_array($b['status'], ['pending', 'accepted']));
                                if (empty($current)):
                                ?>
                                <tr>
                                    <td colspan="6" class="py-20 text-center font-bold opacity-30 uppercase tracking-widest text-xs">
                                        No active requests
                                    </td>
                                </tr>
                                <?php else: foreach ($current as $book): 
                                    $price = ($book['medium'] === 'digital') ? '₱2,200' : '₱1,500';
                                    $hasReceipt = !empty($book['receipt_url']) && $book['receipt_url'] !== 'null';
                                    $payBtnClass = $hasReceipt ? 'bg-green-600' : 'bg-[#1A1A1A]';
                                    $id = (int)$book['id'];
                                ?>
                                <tr class="border-b border-gray-50 group hover:bg-gray-50/80 transition-all duration-300" data-booking-id="<?= $id ?>">
                                    <td class="py-10 px-4">
                                        <div class="flex flex-col">
                                            <span class="font-bold text-sm text-[#1A1A1A] uppercase tracking-widest"><?= htmlspecialchars($book['client_name']) ?></span>
                                            <span class="text-[9px] font-bold text-gray-400"><?= htmlspecialchars($book['client_email']) ?> | <?= htmlspecialchars($book['client_phone'] ?: 'No Phone') ?></span>
                                            <span class="text-[9px] font-black text-[#C16053] uppercase"><?= htmlspecialchars($book['client_social'] ?: 'No Social') ?></span>
                                        </div>
                                    </td>
                                    <td class="py-10 px-4">
                                        <div class="flex flex-col items-center justify-center space-y-2">
                                            <button onclick="viewAddress(<?= $id ?>)" class="w-10 h-10 bg-[#C16053]/5 text-[#C16053] rounded-full flex items-center justify-center hover:bg-[#C16053] hover:text-white transition-all shadow-sm">
                                                <i data-lucide="home" class="w-4 h-4"></i>
                                            </button>
                                            <span class="text-[8px] font-black uppercase text-gray-300 tracking-tighter truncate max-w-[60px]"><?= htmlspecialchars(substr($book['address'] ?: 'N/A', 0, 10)) ?></span>
                                        </div>
                                    </td>
                                    <td class="py-10 px-4">
                                        <div class="flex flex-col">
                                            <span class="font-black italic text-[#C16053] capitalize"><?= htmlspecialchars($book['medium']) ?></span>
                                            <span class="text-[9px] font-black uppercase text-gray-300 tracking-widest"><?= htmlspecialchars($book['size'] ?: 'Standard') ?></span>
                                        </div>
                                    </td>
                                    <td class="py-10 px-4">
                                        <button onclick="viewReferencePhoto(<?= $id ?>)" class="text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#C16053] transition-all shadow-lg">
                                            Open Photo
                                        </button>
                                    </td>
                                    <td class="py-10 px-4">
                                        <div class="flex flex-col space-y-2">
                                            <span class="font-bold text-sm"><?= $price ?></span>
                                            <button onclick="viewPayment(<?= $id ?>)" class="text-[9px] uppercase font-black tracking-widest py-1 px-3 <?= $payBtnClass ?> text-white rounded-md hover:bg-[#C16053] transition-colors w-fit tracking-[0.2em]">
                                                <?= htmlspecialchars($book['payment_method']) ?>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="py-10 px-4 text-right">
                                        <div class="flex justify-end space-x-3">
                                            <?php if ($book['status'] === 'pending'): ?>
                                            <button onclick="updateBookingStatus(<?= $id ?>, 'accepted')" class="p-4 bg-[#1A1A1A] text-white rounded-2xl hover:bg-green-600 transition-all group/btn">
                                                <i data-lucide="check" class="w-5 h-5"></i>
                                            </button>
                                            <button onclick="updateBookingStatus(<?= $id ?>, 'rejected')" class="p-4 border-2 border-gray-100 text-gray-300 rounded-2xl hover:border-red-500 hover:text-red-500 transition-all">
                                                <i data-lucide="x" class="w-5 h-5"></i>
                                            </button>
                                            <?php elseif ($book['status'] === 'accepted'): ?>
                                            <button onclick="updateBookingStatus(<?= $id ?>, 'completed')" class="text-[9px] uppercase font-black tracking-widest py-3 px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg italic">Complete</button>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- Gallery View Tab -->
            <section id="gallery-tab" class="content-tab hidden space-y-12 w-full max-w-7xl mx-auto">
                <div
                    class="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 gap-8">
                    <div class="flex items-center space-x-6">
                        <div
                            class="w-16 h-16 bg-[#C16053]/5 rounded-3xl flex items-center justify-center text-[#C16053]">
                            <i data-lucide="image" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h2 class="text-4xl font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Curations</h2>
                            <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053] italic">Manage
                                your public portfolio assets</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button onclick="addArtworkModal()"
                            class="bg-[#1A1A1A] text-white px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center space-x-4 hover:bg-[#C16053] transition-all shadow-xl hover:-translate-y-1">
                            <i data-lucide="plus-circle" class="w-5 h-5"></i>
                            <span>Upload New Piece</span>
                        </button>
                    </div>
                </div>

                <div id="admin-gallery-container"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12 gallery-grid-wrapped">
                    <?php if (empty($artworks)): ?>
                        <div class="col-span-full py-32 text-center border-4 border-dashed border-gray-100">
                            <i data-lucide="image-off" class="w-16 h-16 text-gray-200 mx-auto mb-4"></i>
                            <p class="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">No artworks yet — upload your first piece!</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($artworks as $art): 
                            $image_src = $art['image_url'];
                        ?>
                            <div class="portrait-card group w-full relative overflow-hidden"
                                 data-id="<?= htmlspecialchars($art['id']) ?>"
                                 data-title="<?= htmlspecialchars($art['title'] ?? '') ?>"
                                 data-category="<?= htmlspecialchars($art['category'] ?? '') ?>"
                                 data-size="<?= htmlspecialchars($art['size'] ?? '') ?>"
                                 data-img="<?= htmlspecialchars($art['image_url'] ?? '') ?>">
                                <img src="<?= $image_src ?>"
                                     alt="<?= htmlspecialchars($art['title'] ?? '') ?>"
                                     onerror="this.src='images/portrait_sample.png'"
                                     class="w-full h-80 object-cover rounded-[3rem] shadow-sm group-hover:scale-105 transition-transform duration-700">

                                <!-- Admin Controls -->
                                <div class="absolute top-6 right-6 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-10 group-hover:translate-x-0 z-30">
                                    <button onclick="editImage(this)" class="w-12 h-12 bg-white/90 backdrop-blur-md text-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all shadow-xl">
                                        <i data-lucide="edit-3" class="w-5 h-5"></i>
                                    </button>
                                    <button onclick="deleteImage(this)" class="w-12 h-12 bg-white/90 backdrop-blur-md text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl">
                                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                                    </button>
                                </div>

                                <div class="absolute inset-x-4 bottom-4 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl border border-white">
                                    <p class="text-[9px] uppercase tracking-widest mb-1 italic text-[#C16053] font-black"><?= htmlspecialchars($art['category'] ?? '') ?></p>
                                    <h4 class="text-xl font-black uppercase tracking-tighter mb-4 text-[#1A1A1A]"><?= htmlspecialchars($art['title'] ?? '') ?></h4>
                                    
                                    <div class="flex items-center justify-between border-t border-gray-100 pt-4">
                                        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Size: <span class="text-[#1A1A1A]"><?= htmlspecialchars($art['size'] ?? '') ?></span></span>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </section>

            <!-- Services Management Tab -->
            <section id="services-tab" class="content-tab hidden space-y-12 w-full max-w-7xl mx-auto">
                <div
                    class="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 gap-8">
                    <div class="flex items-center space-x-6">
                        <div
                            class="w-16 h-16 bg-[#C16053]/5 rounded-3xl flex items-center justify-center text-[#C16053]">
                            <i data-lucide="layers" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h2 class="text-4xl font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Services</h2>
                            <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053] italic">Customize
                                your offerings on the landing page</p>
                        </div>
                    </div>
                    <button onclick="renderServicesEditor()"
                        class="bg-[#1A1A1A] text-white px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#C16053] transition-all shadow-xl">
                        Refresh List
                    </button>
                </div>

                <div id="services-manager-grid" class="grid md:grid-cols-3 gap-8 text-[#1A1A1A]">
                    <div class="col-span-full py-20 text-center border-4 border-dashed border-gray-50 rounded-[3rem]">
                        <div
                            class="inline-block w-8 h-8 border-4 border-[#C16053] border-t-transparent rounded-full animate-spin">
                        </div>
                    </div>
                </div>
            </section>

            <!-- Rates Management Tab -->
            <section id="rates-tab" class="content-tab hidden space-y-12 w-full max-w-7xl mx-auto">
                <div
                    class="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50 gap-8">
                    <div class="flex items-center space-x-6">
                        <div
                            class="w-16 h-16 bg-[#C16053]/5 rounded-3xl flex items-center justify-center text-[#C16053]">
                            <i data-lucide="tag" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h2 class="text-4xl font-black uppercase tracking-[0.2em] text-[#1A1A1A]">Rates</h2>
                            <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053] italic">Manage
                                your pricing tiers and sizes</p>
                        </div>
                    </div>
                    <button onclick="saveRates()"
                        class="bg-[#1A1A1A] text-white px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#C16053] transition-all shadow-xl">
                        Save All Rates
                    </button>
                </div>

                <div id="rates-manager-grid" class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-[#1A1A1A]">
                    <!-- Rate 1 Editor -->
                    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053]">Size 1</p>
                        <div class="space-y-4">
                            <input type="text" id="rate-1-size" placeholder="Size"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                            <input type="text" id="rate-1-label" placeholder="Label"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-[9px]">
                            <input type="text" id="rate-1-price" placeholder="Price"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                        </div>
                    </div>
                    <!-- Rate 2 Editor -->
                    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053]">Size 2</p>
                        <div class="space-y-4">
                            <input type="text" id="rate-2-size" placeholder="Size"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                            <input type="text" id="rate-2-label" placeholder="Label"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-[9px]">
                            <input type="text" id="rate-2-price" placeholder="Price"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                        </div>
                    </div>
                    <!-- Rate 3 Editor -->
                    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053]">Size 3</p>
                        <div class="space-y-4">
                            <input type="text" id="rate-3-size" placeholder="Size"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                            <input type="text" id="rate-3-label" placeholder="Label"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-[9px]">
                            <input type="text" id="rate-3-price" placeholder="Price"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                        </div>
                    </div>
                    <!-- Rate 4 Editor -->
                    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 space-y-4">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[#C16053]">Size 4</p>
                        <div class="space-y-4">
                            <input type="text" id="rate-4-size" placeholder="Size"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                            <input type="text" id="rate-4-label" placeholder="Label"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-[9px]">
                            <input type="text" id="rate-4-price" placeholder="Price"
                                class="w-full bg-gray-50 p-3 rounded-xl outline-none focus:ring-2 font-bold text-xs">
                        </div>
                    </div>
                </div>
            </section>

            <!-- History Tab -->
            <section id="history-tab" class="content-tab hidden space-y-8 w-full font-display">
                <div
                    class="bg-white p-10 lg:p-16 rounded-[4rem] shadow-2xl shadow-gray-100/50 border border-gray-50/50 w-full">
                    <div class="flex justify-between items-center mb-16 px-4">
                        <div class="space-y-1">
                            <h2 class="text-2xl font-black uppercase tracking-[0.4em]">Request History</h2>
                        </div>
                        <button onclick="clearArchive()"
                            class="text-[10px] font-black uppercase tracking-[0.3em] px-8 py-3 bg-[#1A1A1A] text-white rounded-full border border-gray-100 shadow-sm hover:bg-red-600 transition-all">Clear
                            All History</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse font-display">
                            <thead
                                class="border-b-2 border-gray-50 text-[11px] uppercase font-black tracking-[0.3em] text-gray-300">
                                <tr>
                                    <th class="py-6 px-4">Client</th>
                                    <th class="py-6 px-4">Medium</th>
                                    <th class="py-6 px-4">Date</th>
                                    <th class="py-6 px-4">Status</th>
                                    <th class="py-6 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="history-list-body" class="text-xs">
                                <!-- PHP pre-renders history rows -->
                                <?php
                                $history = array_filter($bookings, fn($b) => in_array($b['status'], ['rejected', 'completed']));
                                $history = array_reverse(array_values($history));
                                if (empty($history)):
                                ?>
                                <tr>
                                    <td colspan="5" class="py-12 text-center font-bold opacity-30 uppercase text-[10px] tracking-widest">Archive empty</td>
                                </tr>
                                <?php else: foreach ($history as $book):
                                    $statusColors = [
                                        'completed' => 'bg-green-50 text-green-600 border border-green-100',
                                        'rejected'  => 'bg-red-50 text-red-600 border border-red-100',
                                        'pending'   => 'bg-yellow-50 text-yellow-600 border border-yellow-100',
                                        'accepted'  => 'bg-green-50 text-green-600 border border-green-100',
                                    ];
                                    $sc = $statusColors[$book['status']] ?? 'bg-gray-50 text-gray-400';
                                    $id = (int)$book['id'];
                                ?>
                                <tr class="border-b border-gray-50 opacity-60 hover:opacity-100 transition-opacity" data-history-id="<?= $id ?>">
                                    <td class="py-8 px-4 font-bold uppercase tracking-widest text-[#1A1A1A]"><?= htmlspecialchars($book['client_name']) ?></td>
                                    <td class="py-8 px-4 capitalize italic"><?= htmlspecialchars($book['medium']) ?></td>
                                    <td class="py-8 px-4 text-gray-400 font-bold uppercase tracking-tighter"><?= date('M d, Y', strtotime($book['created_at'])) ?></td>
                                    <td class="py-8 px-4">
                                        <span class="px-4 py-1 <?= $sc ?> rounded-md text-[8px] font-black uppercase tracking-widest"><?= $book['status'] ?></span>
                                    </td>
                                    <td class="py-8 px-4 text-right">
                                        <button onclick="deleteHistoryEntry(<?= $id ?>)" class="p-2 text-red-500/30 hover:text-red-500 transition-colors">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </td>
                                </tr>
                                <?php endforeach; endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!-- Password Management Tab -->
            <section id="password-tab" class="content-tab hidden space-y-12 w-full max-w-4xl mx-auto">
                <div class="bg-white p-12 lg:p-20 rounded-[4rem] shadow-2xl border border-gray-50/50">
                    <div class="text-center space-y-4 mb-20">
                        <div
                            class="w-24 h-24 bg-[#C16053]/5 rounded-[3rem] flex items-center justify-center mx-auto text-[#C16053] mb-8">
                            <i data-lucide="shield-check" class="w-10 h-10"></i>
                        </div>
                        <h2 class="text-5xl font-black uppercase tracking-tighter text-[#1A1A1A]">Security Settings</h2>
                        <p class="text-gray-400 font-medium max-w-md mx-auto">Maintain the artistic sanctuary of your
                            dashboard by updating your credentials regularly.</p>
                    </div>

                    <form onsubmit="handlePasswordUpdate(event)" class="space-y-10 max-w-xl mx-auto">
                        <div class="space-y-3">
                            <label
                                class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-6 italic">Current
                                Passkey</label>
                            <input type="password" id="current-pass" required
                                class="w-full bg-gray-50 border-none p-6 rounded-[2rem] outline-none focus:ring-4 ring-[#C16053]/10 font-bold text-sm tracking-widest placeholder:opacity-30"
                                placeholder="••••••••">
                        </div>

                        <div class="grid md:grid-cols-2 gap-8">
                            <div class="space-y-3">
                                <label
                                    class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-6 italic">New
                                    Password</label>
                                <input type="password" id="new-pass" required
                                    class="w-full bg-gray-50 border-none p-6 rounded-[2rem] outline-none focus:ring-4 ring-[#C16053]/10 font-bold text-sm tracking-widest placeholder:opacity-30"
                                    placeholder="••••••••">
                            </div>
                            <div class="space-y-3">
                                <label
                                    class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 px-6 italic">Confirm
                                    Password</label>
                                <input type="password" id="confirm-pass" required
                                    class="w-full bg-gray-50 border-none p-6 rounded-[2rem] outline-none focus:ring-4 ring-[#C16053]/10 font-bold text-sm tracking-widest placeholder:opacity-30"
                                    placeholder="••••••••">
                            </div>
                        </div>

                        <button type="submit"
                            class="w-full bg-[#1A1A1A] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-xs hover:bg-[#C16053] transition-all transform hover:-translate-y-1 shadow-2xl shadow-[#C16053]/20 flex items-center justify-center space-x-4">
                            <span>Update Passkey</span>
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </button>
                    </form>
                </div>
            </section>
        </div>
    </main>

    <!-- ── PHP-injected booking data for JS layer ─────────────────── -->
    <script>
        // Bookings seeded from PHP/MySQL — used by viewAddress, viewPayment, viewReferencePhoto
        window._currentBookings = <?= $bookings_json ?>;
    </script>

    <!-- Main Script Suite -->
    <script src="js/config.js?v=7.0"></script>
    <script src="js/dashboard-logic.js?v=7.0"></script>
</body>

</html>
