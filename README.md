<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Portrait Drawing (Pencilation) — Supabase Backend (No npm)

This system runs as **static HTML + Tailwind CSS + JavaScript** in `public/` and uses **Supabase** as the backend (no PHP/MySQL API).

### Supabase URL + anon key

Edit these files:

- `public/index.html`
- `public/portfolio.html`
- `public/login.html`
- `public/dashboard.html`

Fill these meta tags:

```html
<meta name="supabase-url" content="https://YOUR_PROJECT_ID.supabase.co">
<meta name="supabase-anon-key" content="YOUR_ANON_PUBLIC_KEY">
```

They are read by `public/js/supabase.js` to initialize `window.supabaseClient`.

### Admin user (Login + Change Password)

#### Create the admin account

This project **does not auto-create** an admin user in SQL.

1. Go to **Supabase Dashboard → Authentication → Users → Add user**
2. Create a user:
   - **Email**: `<username>@<login-email-domain>`
   - **Password**: your admin password

Default domain (set in page meta tags):

```html
<meta name="login-email-domain" content="pencilation.admin">
```

Example:

- Username typed in login form: `adel`
- Supabase Auth email to create: `adel@pencilation.admin`

#### How login works

The login form still uses **username + password**, but the code converts username → email and signs in with Supabase Auth:

- `public/js/pencilation-db.js` → `adminEmailFromUsername()` and `login()`
- `supabase.auth.signInWithPassword({ email, password })`

#### Change Password (Dashboard → Security tab)

The “Change Password” UI calls:

- `public/js/dashboard-logic.js` → `handlePasswordUpdate()`
- which calls `PencilationDB.updateAdminPassword(currentPassword, newPassword)`

What it does:

- **Re-authenticates** using the current password (with your session email)
- Updates password via `supabase.auth.updateUser({ password })`

### Database schema

Run `supabase/schema.sql` in Supabase SQL Editor.

Notes:

- `bookings.status` defaults to **`pending`**
- Row Level Security is **disabled** in the SQL for quick setup (as requested)
