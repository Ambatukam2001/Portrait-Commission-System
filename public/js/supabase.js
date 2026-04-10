/**
 * Pencilation — Supabase client (ES module, CDN import).
 * Loads @supabase/supabase-js via esm.sh (no npm). Exposes window.supabaseClient.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function readMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return (el?.getAttribute('content') || '').trim();
}

// Read project credentials from meta tags (set in each HTML page).
const url = readMeta('supabase-url');
const key = readMeta('supabase-anon-key');

if (url && key) {
    window.supabaseClient = createClient(url, key);
} else {
    console.warn(
        '[Pencilation] Set <meta name="supabase-url"> and <meta name="supabase-anon-key"> with your Supabase project credentials.'
    );
}
