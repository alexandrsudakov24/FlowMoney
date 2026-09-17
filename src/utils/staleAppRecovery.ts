const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

let recovering = false;

export async function clearAppCaches() {
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
    }
}

async function recoverFromStaleApp() {
    if (recovering) return;
    recovering = true;
    try {
        await clearAppCaches();
    } finally {
        window.location.reload();
    }
}

export function installStaleAppRecovery() {
    window.addEventListener('vite:preloadError', () => {
        recoverFromStaleApp();
    });
    window.addEventListener('unhandledrejection', (event) => {
        if (CHUNK_ERROR_PATTERN.test(String(event.reason?.message ?? event.reason))) {
            recoverFromStaleApp();
        }
    });
}
