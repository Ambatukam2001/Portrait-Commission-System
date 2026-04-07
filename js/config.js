// ============================================================
// PENCILATION — Global Configuration
// ============================================================
const CONFIG = (() => {
    const port = window.location.port;
    // VS Code Live Server runs on 5500/5501 — redirect API calls to XAMPP
    const isLiveServer = port === '5500' || port === '5501';
    const base = isLiveServer
        ? 'http://localhost/Portrait Drawing'
        : (window.location.pathname.includes('/') ? window.location.pathname.split('/').slice(0, -1).join('/') || '' : '');

    return {
        // JSON API router (GET/POST/PUT/DELETE)
        API_URL:    (isLiveServer ? 'http://localhost/Portrait Drawing' : '') + '/api',
        // Direct upload endpoint — bypasses router (multipart/form-data)
        UPLOAD_URL: (isLiveServer ? 'http://localhost/Portrait Drawing' : '') + '/api/upload.php',
    };
})();
window.CONFIG = CONFIG;

