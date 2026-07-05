<template>
    <div class="map-modal-overlay" v-if="locationPickerOpen" @click.self="closeLocationPicker">
        <div class="map-modal">
            <button class="modal-close" @click="closeLocationPicker" aria-label="Close">×</button>
            <div class="modal-handle"></div>
            <h3>📍 Set pickup location</h3>
            <p class="modal-sub">Drag the map so the pin sits on your pickup spot, anywhere in Phnom Penh.</p>

            <div class="map-picker">
                <div ref="mapEl" style="width: 100%; height: 100%"></div>
                <div class="map-center-pin" :class="{ dropping: pickerLocating, dragging: pickerDragging }">
                    <span class="pin-icon">📍</span>
                    <span class="pin-dot"></span>
                </div>
                <div class="map-locating-badge" v-if="pickerLocating">⏳ Finding your location…</div>
                <button class="map-recenter-btn" @click="recenterToCurrentLocation" title="Use my current location">🎯</button>
            </div>

            <div class="map-address-box">
                <span>🗺</span>
                <span>{{ pickerAddressLabel }}</span>
            </div>

            <div class="map-modal-actions">
                <button class="map-btn-secondary" @click="closeLocationPicker">Cancel</button>
                <button class="map-btn-primary" :disabled="!pickerCoords" @click="confirmPickedLocation">✅ Use this location</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useShop } from "@/store/useShop";

const {
    locationPickerOpen,
    pickerLocating,
    pickerDragging,
    pickerAddressLabel,
    pickerCoords,
    closeLocationPicker,
    recenterToCurrentLocation,
    confirmPickedLocation,
    registerMapController,
    onPickerMapMoved,
    onPickerMapMoveStart
} = useShop();

const mapEl = ref(null);
let map = null;

function mount(startAt) {
    if (map) {
        map.invalidateSize();
        map.setView([startAt.lat, startAt.lng], 16);
        return;
    }
    map = L.map(mapEl.value, { zoomControl: false, attributionControl: false }).setView([startAt.lat, startAt.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    map.on("movestart", onPickerMapMoveStart);
    map.on("moveend", () => onPickerMapMoved(map.getCenter()));
}

function setView(lat, lng, zoom) {
    map?.setView([lat, lng], zoom);
}

function getCenter() {
    return map ? map.getCenter() : null;
}

onMounted(() => {
    registerMapController({ mount, setView, getCenter });
});

onBeforeUnmount(() => {
    if (map) {
        map.remove();
        map = null;
    }
});
</script>
