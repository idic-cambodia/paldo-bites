import { ref, computed, nextTick } from "vue";
import { boardSlides } from "@/data/menu";

// ── HERO BOARD SLIDES ──
const boardSlide = ref(0);
let slideTimer = null;

function goToSlide(i) {
    boardSlide.value = i;
    resetSlideTimer();
}
function nextSlide() {
    boardSlide.value = (boardSlide.value + 1) % boardSlides.length;
}
function resetSlideTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 3500);
}
resetSlideTimer();

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

    checkoutOpen.value = true;
    drawerOpen.value = false;
}

// ── PICKUP TIME ──
const pickupTime = ref("");
const pickupError = ref("");

const pickupTimes = computed(() => {
    const times = [];
    const startHour = 11;
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

    if (!pickupTime.value) {
        pickupError.value = "Please select a pickup time.";
        return false;
    }

    return true;
}

// ── REMARK ──
const remark = ref("");

function confirmOrder() {
    validatePickup();

    if (!phoneValid.value || !locationGranted.value || pickupError.value) {
        return;
    }

    checkoutOpen.value = false;
    showToast("Order placed — salamat! 🙏");

    console.log({
        phone: phoneRaw.value,
        pickupTime: pickupTime.value,
        remark: remark.value,
        location: locationLabel.value,
        coordinates: locationCoords
    });

    cart.value = [];
}

export function useShop() {
    return {
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

        // remark
        remark
    };
}
