// ============================================================
// PENCILATION — Global Configuration
// ============================================================
const CONFIG = (() => {
    const port = window.location.port;
    // VS Code Live Server runs on 5500/5501 — redirect API to XAMPP
    const isLiveServer = port === '5500' || port === '5501';
    const API_URL = isLiveServer
        ? 'http://localhost/Portrait Drawing/api'
        : 'api';
    return { API_URL };
})();
window.CONFIG = CONFIG;
