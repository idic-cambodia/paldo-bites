const IMAGE_CACHE = "paldo-menu-images-v1";
const MENU_CACHE = "paldo-menu-api-v1";
const MENU_ENDPOINT = "/api/user/menu";
const MAX_IMAGE_ENTRIES = 80;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith("paldo-menu-") && ![IMAGE_CACHE, MENU_CACHE].includes(key))
                        .map((key) => caches.delete(key))
                )
            )
        ])
    );
});

async function trimImageCache() {
    const cache = await caches.open(IMAGE_CACHE);
    const requests = await cache.keys();
    if (requests.length <= MAX_IMAGE_ENTRIES) return;
    await Promise.all(requests.slice(0, requests.length - MAX_IMAGE_ENTRIES).map((request) => cache.delete(request)));
}

async function staleWhileRevalidateImage(request, event) {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);

    const refresh = fetch(request)
        .then(async (response) => {
            if (response && (response.ok || response.type === "opaque")) {
                await cache.put(request, response.clone());
                await trimImageCache();
            }
            return response;
        })
        .catch(() => null);

    if (cached) {
        event.waitUntil(refresh);
        return cached;
    }

    const response = await refresh;
    if (response) return response;
    return new Response("", { status: 504, statusText: "Image unavailable" });
}

async function networkFirstMenu(request) {
    const cache = await caches.open(MENU_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
}

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    if (url.pathname === MENU_ENDPOINT) {
        event.respondWith(networkFirstMenu(event.request));
        return;
    }

    if (event.request.destination === "image" || url.pathname.startsWith("/uploads/menu/")) {
        event.respondWith(staleWhileRevalidateImage(event.request, event));
    }
});
