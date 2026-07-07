import { ref, computed, nextTick, watch } from "vue";
import { io } from "socket.io-client";

const CATEGORY_PRIORITY = {
    ulam: 1,
    merienda: 2
};

const BOARD_SLIDES_FALLBACK = [[{ name: "Loading menu...", price: "" }]];

const MENU_API_URL = "/api/user/menu";
const SETTINGS_API_URL = "/api/user/settings";
const ORDER_API_URL = "/api/user/orders";
const SOCKET_API_URL = import.meta.env.VITE_SOCKET_API_URL || import.meta.env.VITE_BASE_URL;
const ORDER_TRACKING_STORAGE_KEY = "paldo:tracked-orders";
const LEGACY_ORDER_TRACKING_STORAGE_KEY = "paldo:tracked-order";
const ORDER_TRACKING_KEEP_AFTER_DONE_MS = 5 * 60 * 60 * 1000;

const SOCKET_EVENTS = {
    ORDER_NEW: "order:new",
    ORDER_STATUS_UPDATE: "order:status_update",
    DASHBOARD_STATS: "dashboard:stats",
    USER_ORDER_UPDATE: "user:order_update",
    JOIN_ORDER_ROOM: "join:order_room",
    JOIN_ADMIN_ROOM: "join:admin_room"
};

const menuByCategory = ref({});
const menuCategories = computed(() =>
    Object.keys(menuByCategory.value).sort((a, b) => {
        const aPriority = CATEGORY_PRIORITY[a.toLowerCase()] ?? Number.MAX_SAFE_INTEGER;
        const bPriority = CATEGORY_PRIORITY[b.toLowerCase()] ?? Number.MAX_SAFE_INTEGER;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.localeCompare(b);
    })
);
const menuItems = computed(() => menuCategories.value.flatMap((category) => menuByCategory.value[category] || []));
const ulam = computed(() => menuByCategory.value.Ulam || []);
const merienda = computed(() => menuByCategory.value.Merienda || []);
const menuLoading = ref(false);
const menuError = ref("");
let hasRequestedMenu = false;

const defaultShopSettings = Object.freeze({
    shopName: "Shawarma Best x Paldo Bites KH",
    location: "Toul Pong Ro, Phnom Penh, Cambodia",
    phone: "",
    email: "",
    facebook: "",
    telegram: "",
    openTime: "11:00",
    maxOrdersPerDay: 50,
    grabEnabled: true,
    pickupEnabled: true,
    isOpen: true
});

const shopSettings = ref({ ...defaultShopSettings });
const settingsLoading = ref(false);
const settingsError = ref("");
let hasRequestedSettings = false;

function normalizeShopSettings(raw) {
    if (!raw || typeof raw !== "object") return { ...defaultShopSettings };

    return {
        ...defaultShopSettings,
        shopName: typeof raw.shopName === "string" && raw.shopName.trim() ? raw.shopName.trim() : defaultShopSettings.shopName,
        location: typeof raw.location === "string" && raw.location.trim() ? raw.location.trim() : defaultShopSettings.location,
        phone: typeof raw.phone === "string" ? raw.phone.trim() : defaultShopSettings.phone,
        email: typeof raw.email === "string" ? raw.email.trim() : defaultShopSettings.email,
        facebook: typeof raw.facebook === "string" ? raw.facebook.trim().replace(/^@+/, "") : defaultShopSettings.facebook,
        telegram: typeof raw.telegram === "string" ? raw.telegram.trim().replace(/^@+/, "") : defaultShopSettings.telegram,
        openTime: typeof raw.openTime === "string" && raw.openTime.trim() ? raw.openTime.trim() : defaultShopSettings.openTime,
        maxOrdersPerDay: Number.isFinite(Number(raw.maxOrdersPerDay)) ? Number(raw.maxOrdersPerDay) : defaultShopSettings.maxOrdersPerDay,
        grabEnabled: typeof raw.grabEnabled === "boolean" ? raw.grabEnabled : defaultShopSettings.grabEnabled,
        pickupEnabled: typeof raw.pickupEnabled === "boolean" ? raw.pickupEnabled : defaultShopSettings.pickupEnabled,
        isOpen: typeof raw.isOpen === "boolean" ? raw.isOpen : defaultShopSettings.isOpen
    };
}

async function loadSettings({ force = false } = {}) {
    if (settingsLoading.value) return;
    if (hasRequestedSettings && !force) return;

    settingsLoading.value = true;
    settingsError.value = "";

    try {
        const res = await fetch(SETTINGS_API_URL, {
            headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const body = await res.json();
        if (body && body.success === false) {
            throw new Error(body.message || "Failed to load settings.");
        }

        const source = body?.data && typeof body.data === "object" ? body.data : body;
        shopSettings.value = normalizeShopSettings(source);
        hasRequestedSettings = true;
    } catch (err) {
        settingsError.value = err instanceof Error ? err.message : "Failed to load settings.";
    } finally {
        settingsLoading.value = false;
    }
}

const shopOpenTimeLabel = computed(() => {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(shopSettings.value.openTime || ""));
    if (!match) return shopSettings.value.openTime || defaultShopSettings.openTime;

    const hour24 = Number(match[1]);
    const minute = match[2];
    const hour12 = hour24 % 12 || 12;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minute} ${ampm}`;
});

// ── USER ORDER TRACKING (socket.io) ──
const trackedOrders = ref([]);
const trackedOrderId = computed(() => trackedOrders.value[0]?.orderId || "");
const trackedOrderStatus = computed(() => trackedOrders.value[0]?.status || "");
const trackedOrderData = computed(() => trackedOrders.value[0] || null);
const orderSocketConnected = ref(false);
const orderLookupId = ref("");
const orderLookupLoading = ref(false);
const orderLookupError = ref("");
let orderSocket = null;
let orderUpdateBound = false;
let orderTrackingCleanupTimer = null;

function trackingStorage() {
    if (typeof window === "undefined") return null;
    return window.localStorage;
}

function isTerminalOrderStatus(status) {
    const value = String(status || "")
        .trim()
        .toLowerCase();
    return value === "completed" || value === "cancelled" || value === "canceled";
}

function nextUpdatedAt(candidate) {
    if (candidate && !Number.isNaN(new Date(candidate).getTime())) return candidate;
    return new Date().toISOString();
}

function normalizeTrackedOrder(input, previous = null) {
    const orderId = normalizeOrderId(input?.orderId ?? input?.id ?? previous?.orderId);
    if (!orderId) return null;

    const status = String(input?.status ?? previous?.status ?? "pending");
    const updatedAt = nextUpdatedAt(input?.updatedAt ?? previous?.updatedAt);
    const terminalAt = isTerminalOrderStatus(status) ? input?.terminalAt || previous?.terminalAt || updatedAt : null;

    return {
        ...(previous || {}),
        ...(input || {}),
        orderId,
        status,
        updatedAt,
        ...(terminalAt ? { terminalAt } : {})
    };
}

function joinOrderRoom(orderId) {
    if (!orderSocket || !orderSocket.connected) return;
    if (!orderId) return;
    orderSocket.emit(SOCKET_EVENTS.JOIN_ORDER_ROOM, { orderId });
    orderSocket.emit(SOCKET_EVENTS.JOIN_ORDER_ROOM, orderId);
}

function upsertTrackedOrder(input, { moveToTop = true } = {}) {
    const orderId = normalizeOrderId(input?.orderId ?? input?.id);
    if (!orderId) return null;

    const list = [...trackedOrders.value];
    const idx = list.findIndex((item) => item.orderId === orderId);
    const previous = idx >= 0 ? list[idx] : null;
    const merged = normalizeTrackedOrder(input, previous);
    if (!merged) return null;

    if (idx >= 0) list.splice(idx, 1);
    if (moveToTop) list.unshift(merged);
    else list.push(merged);

    trackedOrders.value = list;
    orderLookupId.value = trackedOrders.value[0]?.orderId || orderLookupId.value;
    return merged;
}

function removeTrackedOrder(orderId) {
    const id = normalizeOrderId(orderId);
    if (!id) return;
    trackedOrders.value = trackedOrders.value.filter((item) => item.orderId !== id);
}

function pruneExpiredTrackedOrders() {
    const now = Date.now();
    trackedOrders.value = trackedOrders.value.filter((item) => {
        if (!isTerminalOrderStatus(item.status)) return true;
        const terminalAt = new Date(item.terminalAt || item.updatedAt || 0).getTime();
        if (!Number.isFinite(terminalAt)) return false;
        return now - terminalAt < ORDER_TRACKING_KEEP_AFTER_DONE_MS;
    });
}

function clearOrderTrackingTimer() {
    if (!orderTrackingCleanupTimer) return;
    clearTimeout(orderTrackingCleanupTimer);
    orderTrackingCleanupTimer = null;
}

function clearTrackedOrderRecord() {
    trackedOrders.value = [];
    orderLookupId.value = "";
    orderLookupError.value = "";

    const storage = trackingStorage();
    if (storage) {
        storage.removeItem(ORDER_TRACKING_STORAGE_KEY);
        storage.removeItem(LEGACY_ORDER_TRACKING_STORAGE_KEY);
    }

    clearOrderTrackingTimer();
    if (orderSocket) {
        orderSocket.disconnect();
        orderSocketConnected.value = false;
    }
}

function scheduleTrackedOrderCleanup(record) {
    clearOrderTrackingTimer();
    pruneExpiredTrackedOrders();
    if (!trackedOrders.value.length) {
        clearTrackedOrderRecord();
        return;
    }

    const now = Date.now();
    const expiries = trackedOrders.value
        .filter((item) => isTerminalOrderStatus(item.status))
        .map((item) => new Date(item.terminalAt || item.updatedAt || now).getTime() + ORDER_TRACKING_KEEP_AFTER_DONE_MS)
        .filter((at) => Number.isFinite(at) && at > now)
        .sort((a, b) => a - b);

    if (!expiries.length) return;

    orderTrackingCleanupTimer = setTimeout(
        () => {
            scheduleTrackedOrderCleanup();
            persistTrackedOrder();
        },
        Math.max(1000, expiries[0] - now)
    );
}

function persistTrackedOrder() {
    const storage = trackingStorage();
    if (!storage) return;

    pruneExpiredTrackedOrders();
    if (!trackedOrders.value.length) {
        storage.removeItem(ORDER_TRACKING_STORAGE_KEY);
        storage.removeItem(LEGACY_ORDER_TRACKING_STORAGE_KEY);
        clearOrderTrackingTimer();
        return;
    }

    const payload = trackedOrders.value.map((item) => normalizeTrackedOrder(item)).filter(Boolean);
    storage.setItem(ORDER_TRACKING_STORAGE_KEY, JSON.stringify(payload));
    storage.removeItem(LEGACY_ORDER_TRACKING_STORAGE_KEY);
    scheduleTrackedOrderCleanup();
}

function restoreTrackedOrderFromLocal() {
    const storage = trackingStorage();
    if (!storage) return;

    const raw = storage.getItem(ORDER_TRACKING_STORAGE_KEY) || storage.getItem(LEGACY_ORDER_TRACKING_STORAGE_KEY);
    if (!raw) return;

    let parsed = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        storage.removeItem(ORDER_TRACKING_STORAGE_KEY);
        storage.removeItem(LEGACY_ORDER_TRACKING_STORAGE_KEY);
        return;
    }

    const list = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    const restored = list
        .map((item) => {
            const source = item?.data && typeof item.data === "object" ? { ...item.data, ...item } : item;
            return normalizeTrackedOrder(source);
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    trackedOrders.value = restored;
    pruneExpiredTrackedOrders();
    if (!trackedOrders.value.length) {
        storage.removeItem(ORDER_TRACKING_STORAGE_KEY);
        storage.removeItem(LEGACY_ORDER_TRACKING_STORAGE_KEY);
        return;
    }

    orderLookupId.value = trackedOrders.value[0].orderId;
    persistTrackedOrder();

    const activeOrderIds = trackedOrders.value.filter((item) => !isTerminalOrderStatus(item.status)).map((item) => item.orderId);
    if (activeOrderIds.length) {
        const socket = ensureOrderSocket();
        bindOrderUpdateListener();
        socket.connect();
        activeOrderIds.forEach((id) => joinOrderRoom(id));
    }
}

function normalizeOrderId(value) {
    if (value === null || value === undefined) return "";
    const id = String(value).trim();
    return id;
}

function extractOrderId(payload) {
    if (!payload || typeof payload !== "object") return "";
    return normalizeOrderId(
        payload.orderId ??
            payload.id ??
            payload?.data?.orderId ??
            payload?.data?.id ??
            payload?.data?.order?.orderId ??
            payload?.data?.order?.id ??
            payload?.order?.orderId ??
            payload?.order?.id
    );
}

function extractOrderStatus(payload) {
    if (!payload || typeof payload !== "object") return "";
    const status = payload.status ?? payload?.data?.status ?? payload?.order?.status ?? payload?.data?.order?.status;
    return typeof status === "string" ? status : "";
}

function extractOrderData(payload) {
    if (!payload || typeof payload !== "object") return null;
    const source = payload?.data?.order ?? payload?.data ?? payload?.order ?? payload;
    if (!source || typeof source !== "object") return null;
    return source;
}

function ensureOrderSocket() {
    if (orderSocket) return orderSocket;

    orderSocket = io(SOCKET_API_URL, {
        transports: ["websocket", "polling"],
        autoConnect: false
    });

    orderSocket.on("connect", () => {
        orderSocketConnected.value = true;
        trackedOrders.value.filter((item) => !isTerminalOrderStatus(item.status)).forEach((item) => joinOrderRoom(item.orderId));
    });

    orderSocket.on("disconnect", () => {
        orderSocketConnected.value = false;
    });

    return orderSocket;
}

function bindOrderUpdateListener() {
    const socket = ensureOrderSocket();
    if (orderUpdateBound) return;

    socket.on(SOCKET_EVENTS.USER_ORDER_UPDATE, (payload) => {
        const incomingOrderId = extractOrderId(payload);
        if (!incomingOrderId) return;

        const existing = trackedOrders.value.find((item) => item.orderId === incomingOrderId);
        if (!existing) return;

        const incomingStatus = extractOrderStatus(payload);
        if (!incomingStatus) return;

        const wasSameStatus = incomingStatus === existing.status;

        upsertTrackedOrder({
            ...existing,
            ...(extractOrderData(payload) || {}),
            orderId: incomingOrderId,
            status: incomingStatus,
            updatedAt: new Date().toISOString(),
            ...(isTerminalOrderStatus(incomingStatus) ? { terminalAt: existing.terminalAt || new Date().toISOString() } : { terminalAt: null })
        });

        persistTrackedOrder();
        if (wasSameStatus) return;
        showToast(`Order ${incomingOrderId}: ${incomingStatus}`);
    });

    orderUpdateBound = true;
}

function startOrderTracking(orderId, initialStatus = "pending", extraData = {}) {
    const normalizedId = normalizeOrderId(orderId);
    if (!normalizedId) return;

    const nowIso = new Date().toISOString();
    upsertTrackedOrder({
        ...extraData,
        orderId: normalizedId,
        status: initialStatus,
        updatedAt: extraData.updatedAt || nowIso,
        ...(isTerminalOrderStatus(initialStatus) ? { terminalAt: extraData.terminalAt || nowIso } : { terminalAt: null })
    });

    orderLookupId.value = normalizedId;
    persistTrackedOrder();

    const socket = ensureOrderSocket();
    bindOrderUpdateListener();

    socket.connect();
    joinOrderRoom(normalizedId);
}

async function fetchOrderStatus(orderIdInput = orderLookupId.value) {
    const orderId = normalizeOrderId(orderIdInput);
    orderLookupError.value = "";

    if (!orderId) {
        orderLookupError.value = "Please enter your order ID.";
        return null;
    }

    orderLookupLoading.value = true;
    try {
        const res = await fetch(`${ORDER_API_URL}/${encodeURIComponent(orderId)}`, {
            headers: { Accept: "application/json" }
        });

        let body = null;
        try {
            body = await res.json();
        } catch {
            // Ignore non-JSON body.
        }

        if (!res.ok || (body && body.success === false)) {
            const message = body?.message || `Order not found (${res.status})`;
            throw new Error(message);
        }

        const source = extractOrderData(body);
        const fetchedOrderId = extractOrderId(source || body) || orderId;
        const fetchedStatus = extractOrderStatus(source || body) || "pending";

        startOrderTracking(fetchedOrderId, fetchedStatus, source || {});
        showToast(`Tracking order ${fetchedOrderId}`);
        return trackedOrders.value.find((item) => item.orderId === fetchedOrderId) || null;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load order status.";
        orderLookupError.value = message;
        return null;
    } finally {
        orderLookupLoading.value = false;
    }
}

function normalizeImageUrl(img) {
    if (typeof img !== "string") return undefined;
    const value = img.trim();
    if (!value) return undefined;
    if (value.startsWith("/")) return value;

    try {
        const parsed = new URL(value);
        // In local dev, proxy backend assets through Vite so image requests stay same-origin.
        if (parsed.port === "4000" && ["127.0.0.1", "localhost"].includes(parsed.hostname)) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
    } catch {
        return value;
    }

    return value;
}

function menuImage(raw, name) {
    const img = raw.img || raw.image || raw.photo || raw.image_url || raw.thumbnail;
    const normalized = normalizeImageUrl(img);
    if (normalized) return normalized;
    return undefined;
}

function normalizeCategory(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase();
    if (!raw) return "Ulam";
    if (raw.includes("merienda") || raw.includes("snack")) return "Merienda";
    if (raw.includes("ulam") || raw.includes("main")) return "Ulam";
    return raw
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function toDish(raw, fallbackId) {
    if (!raw || typeof raw !== "object") return null;

    const name = raw.name || raw.title || raw.item_name;
    const price = Number(raw.price ?? raw.amount ?? raw.item_price);
    if (!name || Number.isNaN(price)) return null;

    const minQty = Number(raw.minQty ?? raw.min_qty ?? raw.minimum_qty ?? 1);
    const menuItemId = raw._id ?? raw.id ?? raw.menu_id ?? raw.menuItemId ?? fallbackId;
    const category = normalizeCategory(raw.category || raw.type || raw.group);
    return {
        id: menuItemId,
        menuItemId,
        name,
        price,
        category,
        icon: raw.icon || "🍽️",
        desc: raw.desc || raw.description || "",
        img: menuImage(raw, name),
        ...(minQty > 1 ? { minQty } : {})
    };
}

function splitMenu(payload) {
    if (payload && typeof payload === "object" && payload.success === false) {
        return {};
    }

    if (payload && typeof payload === "object") {
        const source = payload.data && typeof payload.data === "object" ? payload.data : payload;
        const sourceUlam = Array.isArray(source.ulam) ? source.ulam : [];
        const sourceMerienda = Array.isArray(source.merienda) ? source.merienda : [];
        if (sourceUlam.length || sourceMerienda.length) {
            return {
                Ulam: sourceUlam,
                Merienda: sourceMerienda
            };
        }
    }

    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.menu) ? payload.menu : [];

    const grouped = {};
    for (const row of rows) {
        if (row?.available === false) continue;
        const category = normalizeCategory(row?.category || row?.type || row?.group);
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(row);
    }
    return grouped;
}

const boardSlides = computed(() => {
    const all = menuItems.value;
    if (!all.length) return BOARD_SLIDES_FALLBACK;

    const lines = all.map((item) => ({
        name: item.name,
        price: `$${Number(item.price).toFixed(2)}`
    }));

    const slides = [];
    for (let i = 0; i < lines.length; i += 5) {
        slides.push(lines.slice(i, i + 5));
    }
    return slides.length ? slides : BOARD_SLIDES_FALLBACK;
});

async function loadMenu({ force = false } = {}) {
    if (menuLoading.value) return;
    if (hasRequestedMenu && !force) return;

    menuLoading.value = true;
    menuError.value = "";

    try {
        const res = await fetch(MENU_API_URL, {
            headers: { Accept: "application/json" }
        });

        if (!res.ok) {
            throw new Error(`Request failed (${res.status})`);
        }

        const data = await res.json();
        const split = splitMenu(data);
        const normalizedByCategory = {};

        Object.entries(split).forEach(([category, items]) => {
            const normalizedItems = (Array.isArray(items) ? items : [])
                .map((row, idx) => toDish(row, `${category.toLowerCase()}-${idx + 1}`))
                .filter(Boolean);
            if (normalizedItems.length) {
                normalizedByCategory[normalizeCategory(category)] = normalizedItems;
            }
        });

        if (!Object.keys(normalizedByCategory).length) {
            throw new Error("Menu response is empty or has an unexpected format.");
        }

        menuByCategory.value = normalizedByCategory;
        hasRequestedMenu = true;
    } catch (err) {
        menuError.value = err instanceof Error ? err.message : "Failed to load menu.";
    } finally {
        menuLoading.value = false;
    }
}

// ── HERO BOARD SLIDES ──
const boardSlide = ref(0);
let slideTimer = null;

function goToSlide(i) {
    const max = boardSlides.value.length;
    if (!max) return;
    boardSlide.value = Math.max(0, Math.min(i, max - 1));
    resetSlideTimer();
}
function nextSlide() {
    const total = boardSlides.value.length;
    if (!total) return;
    boardSlide.value = (boardSlide.value + 1) % total;
}
function resetSlideTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 3500);
}
resetSlideTimer();

watch(boardSlides, (slides) => {
    const max = slides.length;
    if (!max) {
        boardSlide.value = 0;
        return;
    }
    if (boardSlide.value > max - 1) {
        boardSlide.value = 0;
    }
});

// ── TOAST ──
const toastMsg = ref("");
let toastTimer = null;

function showToast(msg) {
    toastMsg.value = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastMsg.value = ""), 1800);
}

// ── CART ──
const cart = ref([]);
const drawerOpen = ref(false);

function qtyInCart(id) {
    const item = cart.value.find((i) => i.id === id);
    return item ? item.qty : 0;
}

function addToCart(dish) {
    if (!shopSettings.value.isOpen) {
        showToast("Shop is currently closed.");
        return;
    }

    const min = dish.minQty || 1;
    const existing = cart.value.find((i) => i.id === dish.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.value.push({ ...dish, qty: min });
        if (min > 1) showToast(`Minimum order for ${dish.name} is ${min} pcs — added ${min}!`);
        else showToast(dish.name + " added to basket!");
        return;
    }
    showToast(dish.name + " added to basket!");
}

function increment(item) {
    item.qty++;
}
function decrement(item) {
    const min = item.minQty || 1;
    if (item.qty <= min) {
        cart.value = cart.value.filter((i) => i.id !== item.id);
        showToast(item.name + " removed from basket.");
    } else {
        item.qty--;
    }
}

const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0));
const cartTotal = computed(() => cart.value.reduce((s, i) => s + i.qty * i.price, 0));

// ── CHECKOUT MODAL ──
const checkoutOpen = ref(false);
const orderSubmitting = ref(false);

// phone
const phoneRaw = ref("");
const phoneError = ref("");
const phoneValid = ref(false);

function validatePhone() {
    const digits = phoneRaw.value.replace(/\D/g, "");
    phoneError.value = "";
    phoneValid.value = false;
    if (!digits) {
        phoneError.value = "Phone number is required.";
        return;
    }
    // Cambodia mobile: 8–9 digits after +855 (drop leading 0 if present)
    const n = digits.startsWith("0") ? digits.slice(1) : digits;
    const validPrefixes = [
        "10",
        "11",
        "12",
        "15",
        "16",
        "17",
        "18",
        "60",
        "61",
        "66",
        "67",
        "68",
        "69",
        "70",
        "71",
        "76",
        "77",
        "78",
        "79",
        "85",
        "86",
        "87",
        "88",
        "89",
        "90",
        "92",
        "93",
        "95",
        "96",
        "97",
        "98",
        "99"
    ];
    if (n.length < 8 || n.length > 9) {
        phoneError.value = "Must be 8–9 digits after +855.";
        return;
    }
    if (!validPrefixes.some((p) => n.startsWith(p))) {
        phoneError.value = "Not a recognised Cambodia mobile prefix.";
        return;
    }
    phoneValid.value = true;
}

// ── LOCATION (pickup point) ──
const locationGranted = ref(false);
const locationLoading = ref(false);
const locationError = ref("");
const locationLabel = ref("");
const locationMapUrl = ref("");
let locationCoords = null;

// ── LOCATION PICKER (map + pin) ──
export const PHNOM_PENH_CENTER = { lat: 11.5564, lng: 104.9282 };
const locationPickerOpen = ref(false);
const pickerLocating = ref(false);
const pickerDragging = ref(false);
const pickerAddressLabel = ref("Move the map to drop the pin…");
const pickerCoords = ref(null);

// The Leaflet map instance itself lives inside LocationPickerModal.vue.
// These hooks let that component report state back into the shared store.
let mapController = null;

function registerMapController(controller) {
    mapController = controller;
}

function openLocationPicker() {
    locationError.value = "";
    locationPickerOpen.value = true;

    nextTick(() => {
        const startAt = locationCoords ? { lat: parseFloat(locationCoords.lat), lng: parseFloat(locationCoords.lng) } : PHNOM_PENH_CENTER;

        mapController?.mount(startAt);
        onPickerMapMoved(mapController?.getCenter());

        if (!locationCoords) {
            recenterToCurrentLocation();
        }
    });
}

function closeLocationPicker() {
    locationPickerOpen.value = false;
}

function onPickerMapMoved(center) {
    pickerDragging.value = false;
    if (!center) return;
    pickerCoords.value = { lat: center.lat.toFixed(6), lng: center.lng.toFixed(6) };
    reverseGeocode(center.lat, center.lng);
}

function onPickerMapMoveStart() {
    pickerDragging.value = true;
}

let geocodeDebounce = null;
let geocodeToken = 0;

function reverseGeocode(lat, lng) {
    clearTimeout(geocodeDebounce);
    const myToken = ++geocodeToken;
    pickerAddressLabel.value = "Looking up address…";
    geocodeDebounce = setTimeout(async () => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
            const data = await res.json();
            if (myToken !== geocodeToken) return; // stale
            pickerAddressLabel.value = data && data.display_name ? data.display_name : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch (e) {
            if (myToken !== geocodeToken) return;
            pickerAddressLabel.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }, 500);
}

function recenterToCurrentLocation() {
    if (!navigator.geolocation) {
        locationError.value = "Geolocation is not supported by your browser.";
        return;
    }
    pickerLocating.value = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            pickerLocating.value = false;
            mapController?.setView(pos.coords.latitude, pos.coords.longitude, 17);
        },
        (err) => {
            pickerLocating.value = false;
            if (err.code === 1) locationError.value = "Location access was denied. You can still drop the pin manually.";
            else if (err.code === 2) locationError.value = "Location unavailable. You can still drop the pin manually.";
            else locationError.value = "Could not get your location. You can still drop the pin manually.";
        },
        { timeout: 10000 }
    );
}

function confirmPickedLocation() {
    if (!pickerCoords.value) return;
    const { lat, lng } = pickerCoords.value;
    locationCoords = { lat, lng };
    locationGranted.value = true;
    locationLabel.value = pickerAddressLabel.value || `${lat}, ${lng}`;
    locationMapUrl.value = `https://www.google.com/maps?q=${lat},${lng}`;
    locationError.value = "";
    locationPickerOpen.value = false;
}

function openCheckout() {
    if (!shopSettings.value.isOpen) {
        showToast("Shop is currently closed.");
        return;
    }
    if (!shopSettings.value.pickupEnabled) {
        showToast("Pickup ordering is currently unavailable.");
        return;
    }

    phoneRaw.value = "";
    phoneError.value = "";
    phoneValid.value = false;

    locationGranted.value = false;
    locationError.value = "";
    locationLabel.value = "";
    locationMapUrl.value = "";
    locationCoords = null;

    pickupTime.value = "";
    pickupError.value = "";
    remark.value = "";
    name.value = "";

    checkoutOpen.value = true;
    drawerOpen.value = false;
}

// ── PICKUP TIME ──
const pickupTime = ref("");
const pickupError = ref("");

const pickupTimes = computed(() => {
    const times = [];
    const openTime = String(shopSettings.value.openTime || "11:00");
    const parsedOpenHour = Number(openTime.split(":")[0]);
    const startHour = Number.isFinite(parsedOpenHour) ? Math.max(0, Math.min(23, parsedOpenHour)) : 11;
    const endHour = 21; // 9 PM

    for (let h = startHour; h <= endHour; h++) {
        for (const m of [0, 30]) {
            // Don't create 21:30
            if (h === endHour && m > 0) continue;

            const hour12 = h > 12 ? h - 12 : h;
            const ampm = h >= 12 ? "PM" : "AM";
            const minute = m === 0 ? "00" : "30";

            times.push(`${hour12}:${minute} ${ampm}`);
        }
    }

    return times;
});

function validatePickup() {
    pickupError.value = "";

    if (!shopSettings.value.isOpen) {
        pickupError.value = "Shop is currently closed.";
        return false;
    }
    if (!shopSettings.value.pickupEnabled) {
        pickupError.value = "Pickup ordering is currently unavailable.";
        return false;
    }

    if (!pickupTime.value) {
        pickupError.value = "Please select a pickup time.";
        return false;
    }

    return true;
}

// ── REMARK ──
const remark = ref("");

// ── NAME ──
const name = ref("");

function formattedPhone() {
    return phoneRaw.value.replace(/\D/g, "");
}

async function confirmOrder() {
    if (orderSubmitting.value) return;

    validatePhone();
    validatePickup();

    if (!phoneValid.value || !locationGranted.value || pickupError.value) {
        return;
    }

    const payload = {
        name: name.value,
        phone: formattedPhone(),
        location: locationCoords ? `${locationCoords.lat}, ${locationCoords.lng}` : "",
        mapUrl: locationMapUrl.value,
        pickupTime: pickupTime.value,
        remark: remark.value,
        items: cart.value.map((item) => ({
            menuItemId: String(item.menuItemId || item.id),
            qty: item.qty
        }))
    };

    orderSubmitting.value = true;
    try {
        const res = await fetch(ORDER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            let message = `Failed to place order (${res.status})`;
            try {
                const errorBody = await res.json();
                if (errorBody?.message) message = errorBody.message;
            } catch {
                // Ignore non-JSON error body.
            }
            throw new Error(message);
        }

        let body = null;
        try {
            body = await res.json();
        } catch {
            // Some APIs return 201/204 without JSON.
        }

        const createdOrderId = extractOrderId(body);
        const createdOrderStatus = extractOrderStatus(body) || "pending";
        if (createdOrderId) {
            startOrderTracking(createdOrderId, createdOrderStatus, extractOrderData(body) || {});
        }

        checkoutOpen.value = false;
        showToast("Order placed — salamat! 🙏");
        cart.value = [];
    } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not place order. Please try again.");
    } finally {
        orderSubmitting.value = false;
    }
}

restoreTrackedOrderFromLocal();

export function useShop() {
    return {
        // settings
        shopSettings,
        settingsLoading,
        settingsError,
        loadSettings,
        shopOpenTimeLabel,
        // menu
        menuByCategory,
        menuCategories,
        ulam,
        merienda,
        menuLoading,
        menuError,
        loadMenu,
        // board
        boardSlides,
        boardSlide,
        goToSlide,
        // toast
        toastMsg,
        showToast,
        // cart
        cart,
        drawerOpen,
        qtyInCart,
        addToCart,
        increment,
        decrement,
        cartCount,
        cartTotal,
        // checkout
        checkoutOpen,
        orderSubmitting,
        openCheckout,
        confirmOrder,
        phoneRaw,
        phoneError,
        phoneValid,
        validatePhone,
        // location
        locationGranted,
        locationLoading,
        locationError,
        locationLabel,
        locationMapUrl,
        // location picker
        locationPickerOpen,
        pickerLocating,
        pickerDragging,
        pickerAddressLabel,
        pickerCoords,
        openLocationPicker,
        closeLocationPicker,
        recenterToCurrentLocation,
        confirmPickedLocation,
        registerMapController,
        onPickerMapMoved,
        onPickerMapMoveStart,
        // pickup
        pickupTime,
        pickupTimes,
        pickupError,
        validatePickup,

        // realtime order tracking
        trackedOrders,
        trackedOrderId,
        trackedOrderStatus,
        orderSocketConnected,
        trackedOrderData,
        orderLookupId,
        orderLookupLoading,
        orderLookupError,
        fetchOrderStatus,

        // remark
        remark,

        // name
        name
    };
}
