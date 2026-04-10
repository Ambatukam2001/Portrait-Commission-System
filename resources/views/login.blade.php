<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Portrait Drawing System</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <style>
        body, html {
            height: 100dvh;
            overflow: hidden !important;
            background-color: #FDFBF7;
            position: fixed;
            width: 100%;
        }

        .auth-card {
            box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.25);
            height: 100dvh;
            width: 100%;
        }

        @media (min-width: 768px) {
            .auth-card {
                height: auto;
                max-height: 90vh;
                border-radius: 24px;
            }
        }

        .form-transition {
            transition: all 0.5s ease;
        }

        .scroll-container {
            overflow-y: auto;
            scrollbar-width: none;
        }
        .scroll-container::-webkit-scrollbar { display: none; }
    </style>
</head>

<body class="flex items-center justify-center">

    <div class="max-w-6xl w-full bg-white flex flex-col md:flex-row overflow-hidden auth-card">
        <!-- Left Side -->
        <div class="md:w-1/2 bg-[#1A1A1A] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden h-[350px] md:h-auto">
            <div class="absolute -right-20 -top-20 opacity-10 transform rotate-12">
                <i data-lucide="pencil" class="w-64 h-64 md:w-96 md:h-96"></i>
            </div>

            <div class="relative z-10">
                <a href="{{ route('landing') }}" class="flex items-center space-x-2 text-xl md:text-2xl font-display font-black tracking-widest hover:text-[#C16053] transition-colors">
                    <span class="text-[#C16053]">●</span>
                    <span>Pencilation</span>
                </a>
            </div>

            <div class="relative z-10 space-y-6 flex-1 flex flex-col justify-center mt-12 md:mt-0">
                <h2 class="text-4xl md:text-6xl font-black uppercase leading-tight md:leading-none">Capture Your<br>Essence.</h2>
                <p class="text-white/60 text-sm md:text-lg max-w-sm">Join our community of art lovers and bespoke portrait collectors.</p>
            </div>

            <div class="relative z-10 text-[10px] uppercase font-bold tracking-[0.4em] text-white/40">
                © 2024 Pencilation PORTRAIT SYSTEM
            </div>
        </div>

        <!-- Right Side -->
        <div class="md:w-1/2 p-12 md:p-20 flex flex-col justify-center bg-white relative scroll-container">
            <div class="absolute top-10 left-12">
                <a href="{{ route('landing') }}" class="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#C16053] transition-all group">
                    <i data-lucide="arrow-left" class="w-3 h-3 transform group-hover:-translate-x-1 transition-transform"></i>
                    <span>Back to Home</span>
                </a>
            </div>

            <div id="login-container" class="form-transition">
                <div class="mb-12">
                    <h3 class="text-4xl font-black mb-2 font-display">ADMIN PORTAL</h3>
                    <p class="text-gray-400 font-medium">Authorized artist access only.</p>
                </div>

                <form id="login-form" class="space-y-10">
                    @csrf
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase tracking-widest font-black text-gray-400 font-bold italic">Admin Username</label>
                        <div class="relative group">
                            <i data-lucide="user" class="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#C16053] transition-colors"></i>
                            <input type="text" id="login-username" name="username" required class="w-full bg-transparent border-b border-gray-100 py-4 pl-10 focus:border-[#C16053] outline-none transition-all font-bold text-sm tracking-widest" placeholder="Admin Name">
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase tracking-widest font-black text-gray-400 font-bold italic">Password</label>
                        <div class="relative group">
                            <i data-lucide="lock" class="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#C16053] transition-colors"></i>
                            <input type="password" id="login-password" name="password" required class="w-full bg-transparent border-b border-gray-100 py-4 pl-10 focus:border-[#C16053] outline-none transition-all font-bold text-sm tracking-widest" placeholder="••••••••">
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-[#1A1A1A] text-white py-6 font-black uppercase tracking-[0.4em] text-xs hover:bg-[#C16053] transition-all transform hover:-translate-y-1 shadow-2xl">
                        Authorize Entry
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="{{ asset('js/config.js?v=4.0') }}"></script>
    <script src="{{ asset('js/auth.js?v=4.0') }}"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>
