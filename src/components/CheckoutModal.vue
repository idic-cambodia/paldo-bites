<template>
    <div class="modal-overlay" v-if="checkoutOpen" @click.self="checkoutOpen = false">
        <div class="modal">
            <button class="modal-close" @click="checkoutOpen = false" aria-label="Close">×</button>
            <div class="modal-handle"></div>
            <h3>Confirm your order</h3>
            <p class="modal-sub">We need a contact number and your pickup location. Opening time: {{ shopOpenTimeLabel }}.</p>

            <div class="modal-body">
                <div class="field-error" v-if="!shopSettings.isOpen">Shop is currently closed. Please try again later.</div>
                <div class="field-error" v-else-if="!shopSettings.pickupEnabled">Pickup ordering is currently unavailable.</div>

                <!-- NAME -->
                <div class="field">
                    <label>Your Name</label>
                    <div class="field-row">
                        <input type="text" placeholder="" v-model="name" />
                    </div>
                </div>

                <!-- PHONE -->
                <div class="field">
                    <label>📱 Telegram Number or Cambodia number</label>
                    <div class="field-row" :class="{ 'has-error': phoneError, 'is-valid': phoneValid }">
                        <span class="field-prefix">🇰🇭 +855</span>
                        <input type="tel" placeholder="XX XXX XXXX" v-model="phoneRaw" @input="validatePhone" maxlength="11" inputmode="numeric" />
                        <span class="field-icon" v-if="phoneValid">✅</span>
                    </div>
                    <div class="field-error" v-if="phoneError">{{ phoneError }}</div>
                </div>

                <!-- LOCATION OPTION -->
                <div class="field">
                    <label>📍 Location option</label>
                    <div class="segmented-switch" role="group" aria-label="Location option">
                        <button type="button" class="seg-btn" :class="{ active: locationInputMode === 'label' }" @click="locationInputMode = 'label'">
                            Grab Landmark
                        </button>
                        <button
                            type="button"
                            class="seg-btn"
                            :class="{ active: locationInputMode === 'shared' }"
                            @click="locationInputMode = 'shared'"
                        >
                            Pin location
                        </button>
                    </div>
                </div>

                <!-- LOCATION LABEL -->
                <div class="field" v-if="locationInputMode === 'label'">
                    <!-- <label>🏷️ Location label</label> -->
                    <div class="field-row" :class="{ 'has-error': locationLabelError, 'is-valid': !!locationLabel.trim() }">
                        <input type="text" placeholder="e.g. Home gate, Office front desk" v-model="locationLabel" />
                        <span class="field-icon" v-if="locationLabel.trim()">✅</span>
                    </div>
                    <div class="field-error" v-if="locationLabelError">{{ locationLabelError }}</div>
                </div>

                <!-- SHARED LOCATION -->
                <div class="field" v-if="locationInputMode === 'shared'">
                    <!-- <label>🗺 Share location</label> -->
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

                <!-- ORDER TYPE -->
                <div class="field">
                    <label>🛵 Order type</label>
                    <div class="segmented-switch" role="group" aria-label="Order type">
                        <button type="button" class="seg-btn" :class="{ active: orderType === 'delivery' }" @click="orderType = 'delivery'">
                            Delivery
                        </button>
                        <button type="button" class="seg-btn" :class="{ active: orderType === 'pickup' }" @click="orderType = 'pickup'">
                            Pick-Up
                        </button>
                    </div>
                </div>

                <!-- DELIVERY TIME -->
                <div class="field" v-if="orderType === 'delivery'">
                    <label>🕐 Delivery time</label>
                    <div class="field-row" :class="{ 'has-error': deliveryError, 'is-valid': deliveryTime }">
                        <span class="field-prefix">🏪</span>
                        <select v-model="deliveryTime" @change="validateDelivery" class="field-select">
                            <option value="" disabled>Select a time (open from {{ shopOpenTimeLabel }})</option>
                            <option v-for="t in deliveryTimes" :key="t" :value="t">{{ t }}</option>
                        </select>
                        <span class="field-icon" v-if="deliveryTime">✅</span>
                    </div>
                    <div class="field-error" v-if="deliveryError">{{ deliveryError }}</div>
                </div>

                <!-- PICKUP TIME -->
                <div class="field" v-if="orderType === 'pickup'">
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
            </div>

            <button
                class="confirm-btn"
                :disabled="
                    !phoneValid ||
                    (locationInputMode === 'shared' ? !locationGranted : !locationLabel.trim()) ||
                    orderSubmitting ||
                    !shopSettings.isOpen ||
                    (orderType === 'pickup' && !shopSettings.pickupEnabled)
                "
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
    locationLabelError,
    locationInputMode,
    locationLabel,
    locationMapUrl,
    openLocationPicker,

    orderType,
    deliveryTime,
    deliveryTimes,
    deliveryError,
    validateDelivery,

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

<style scoped>
.segmented-switch {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.seg-btn {
    border: 1px solid rgba(0, 0, 0, 0.18);
    background: #fff;
    border-radius: 12px;
    padding: 10px 12px;
    font-weight: 700;
    cursor: pointer;
}

.seg-btn.active {
    border-color: #111;
    background: #111;
    color: #fff;
}
</style>
