/**
 * Pencilation — Supabase client (ES module, CDN import).
 * Loads @supabase/supabase-js via esm.sh (no npm). Exposes window.supabaseClient.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function readMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return (el?.getAttribute('content') || '').trim();
}

const url = readMeta('https://kghxzdzhpjqmrxyjoepq.supabase.co');
const key = readMeta('sb_publishable_ql0R1sAmizZ2I7mbcRoxJw_By9OhiJ5');

if (url && key) {
    window.supabaseClient = createClient(url, key);
} else {
    console.warn(
        '[Pencilation] Set <meta name="supabase-url"> and <meta name="supabase-anon-key"> with your Supabase project credentials.'
    );
}
