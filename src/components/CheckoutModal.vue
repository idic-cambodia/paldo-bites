<template>
    <div class="modal-overlay" v-if="checkoutOpen" @click.self="checkoutOpen = false">
        <div class="modal">
            <button class="modal-close" @click="checkoutOpen = false" aria-label="Close">×</button>
            <div class="modal-handle"></div>
            <h3>Confirm your order</h3>
            <p class="modal-sub">We need a contact number and your pickup location. Opening time: {{ shopOpenTimeLabel }}.</p>

            <div class="field-error" v-if="!shopSettings.isOpen">Shop is currently closed. Please try again later.</div>
            <div class="field-error" v-else-if="!shopSettings.pickupEnabled">Pickup ordering is currently unavailable.</div>

            <!-- NAME -->
            <div class="field">
                <label>Your Name</label>
                <div class="field-row">
                    <input type="text" placeholder="" v-model="name" @input="validateName" />
                </div>
            </div>

            <!-- PHONE -->
            <div class="field">
                <label>📱 Cambodia phone number</label>
                <div class="field-row" :class="{ 'has-error': phoneError, 'is-valid': phoneValid }">
                    <span class="field-prefix">🇰🇭 +855</span>
                    <input type="tel" placeholder="XX XXX XXXX" v-model="phoneRaw" @input="validatePhone" maxlength="11" inputmode="numeric" />
                    <span class="field-icon" v-if="phoneValid">✅</span>
                </div>
                <div class="field-error" v-if="phoneError">{{ phoneError }}</div>
            </div>

            <!-- LOCATION -->
            <div class="field">
                <label>📍 Pickup location</label>
                <button
                    class="loc-btn"
                    :class="{ 'loc-granted': locationGranted, 'loc-loading': locationLoading }"
                    @click="openLocationPicker"
                    :disabled="locationLoading"
                >
                    <span v-if="locationLoading">⏳ Getting location…</span>
                    <span v-else-if="locationGranted">✅ Location shared — tap to change</span>
                    <span v-else>📍 Share my pickup location</span>
                </button>
                <div class="loc-preview" v-if="locationGranted">
                    <span>🗺</span>
                    <div>
                        {{ locationLabel }}<br />
                        <a :href="locationMapUrl" target="_blank" rel="noopener">View on Google Maps →</a>
                    </div>
                </div>
                <div class="field-error" v-if="locationError">{{ locationError }}</div>
            </div>

            <!-- PICKUP TIME -->
            <div class="field">
                <label>🕐 Pickup time</label>
                <div class="field-row" :class="{ 'has-error': pickupError, 'is-valid': pickupTime }">
                    <span class="field-prefix">🏪</span>
                    <select v-model="pickupTime" @change="validatePickup" class="field-select">
                        <option value="" disabled>Select a time (open from {{ shopOpenTimeLabel }})</option>
                        <option v-for="t in pickupTimes" :key="t" :value="t">{{ t }}</option>
                    </select>
                    <span class="field-icon" v-if="pickupTime">✅</span>
                </div>
                <div class="field-error" v-if="pickupError">{{ pickupError }}</div>
            </div>

            <!-- REMARK -->
            <div class="field">
                <label>📝 Remark <span class="optional">(optional)</span></label>
                <textarea
                    v-model="remark"
                    class="field-textarea"
                    placeholder="e.g. extra garlic sauce, no onion, special instructions…"
                    rows="3"
                    maxlength="300"
                ></textarea>
                <div class="char-count">{{ remark.length }} / 300</div>
            </div>

            <!-- NOTED -->
            <div class="field">
                <label>NOTE: </label>
                <span class="modal-sub">We will contact you to confirm your order.</span>
                <p class="modal-sub modal-warning">NO CONFIRMATION, NO ORDER.</p>
            </div>

            <button
                class="confirm-btn"
                :disabled="!phoneValid || !locationGranted || orderSubmitting || !shopSettings.isOpen || !shopSettings.pickupEnabled"
                @click="confirmOrder"
            >
                {{ orderSubmitting ? "Placing order..." : "🛵 Place order" }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { useShop } from "@/store/useShop";

const {
    checkoutOpen,
    orderSubmitting,
    confirmOrder,
    phoneRaw,
    phoneError,
    phoneValid,
    validatePhone,
    locationGranted,
    locationLoading,
    locationError,
    locationLabel,
    locationMapUrl,
    openLocationPicker,

    pickupTime,
    pickupTimes,
    pickupError,
    validatePickup,

    shopSettings,
    shopOpenTimeLabel,

    remark,

    name
} = useShop();
</script>
