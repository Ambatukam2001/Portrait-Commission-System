/**
 * Pencilation — Supabase client (ES module, CDN import).
 * Loads @supabase/supabase-js via esm.sh (no npm). Exposes window.supabaseClient.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function readMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return (el?.getAttribute('content') || '').trim();
}

/** Wrong-but-common pattern: URL stored in meta `name` instead of supabase-url. */
function readLegacySupabaseUrl() {
    const direct = readMeta('supabase-url');
    if (direct) return direct;
    const metas = document.querySelectorAll('meta[name]');
    for (const m of metas) {
        const n = (m.getAttribute('name') || '').trim();
        if (/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(n)) return n;
        const c = (m.getAttribute('content') || '').trim();
        if (/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(c)) return c;
    }
    return '';
}

/**
 * Wrong pattern: anon key only in `name`, or publishable-style key in `name`, empty `content`.
 */
function readLegacySupabaseAnonKey() {
    const direct = readMeta('supabase-anon-key');
    if (direct) return direct;
    const metas = document.querySelectorAll('meta[name]');
    for (const m of metas) {
        const n = (m.getAttribute('name') || '').trim();
        const c = (m.getAttribute('content') || '').trim();
        if (c) continue;
        if (n.startsWith('eyJ') && n.length > 80) return n;
        if (n.startsWith('sb_publishable_') && n.length > 20) return n;
    }
    return '';
}

// Read project credentials from meta tags (set in each HTML page).
const url = readLegacySupabaseUrl();
const key = readLegacySupabaseAnonKey();

if (url && key) {
    window.supabaseClient = createClient(url, key);
} else {
    console.warn(
        '[Pencilation] Set <meta name="supabase-url" content="https://YOUR_PROJECT.supabase.co"> and <meta name="supabase-anon-key" content="YOUR_ANON_KEY"> (Dashboard → Project Settings → API). The anon key must be in the content attribute.'
    );
}
