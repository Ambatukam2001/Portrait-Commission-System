// ============================================================
// PENCILATION — Global Configuration (Supabase frontend)
// ============================================================
const CONFIG = (() => {
    function readMeta(name) {
        const el = document.querySelector(`meta[name="${name}"]`);
        return (el?.getAttribute('content') || '').trim();
    }

    /** Synthetic email domain for Supabase Auth (username → username@domain) */
    const LOGIN_EMAIL_DOMAIN = readMeta('login-email-domain') || 'pencilation.admin';

    return {
        LOGIN_EMAIL_DOMAIN,
        /** Legacy alias — data layer uses Supabase; no PHP API */
        API_URL: '',
        UPLOAD_URL: '',
    };
})();
window.CONFIG = CONFIG;

// Utility to build correct image URL whether served from static host or data URLs
window.buildImgUrl = (path) => {
    if (!path) return 'images/portrait_sample.png';
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    const port = window.location.port;
    const isLiveServer = port === '5500' || port === '5501';
    const isFileProtocol = window.location.protocol === 'file:';
    if (isLiveServer || isFileProtocol) {
        return `http://localhost/Portrait Drawing/public/${path}`.replace(/([^:]\/)\/+/g, '$1');
    }
    return path;
};
