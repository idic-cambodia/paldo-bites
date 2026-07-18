<template>
    <section class="track-order" id="track-order">
        <div class="track-inner">
            <div class="track-head">
                <div class="track-label">Order Support</div>
                <h2>Track Your Order</h2>
                <p>Enter your order ID to check status and keep all your recent orders synced in realtime.</p>
            </div>

            <div class="track-form">
                <input
                    v-model="orderLookupId"
                    type="text"
                    class="track-input"
                    placeholder="Example: ORD-2026-0012"
                    @keyup.enter="fetchOrderStatus()"
                />
                <button class="track-btn" :disabled="orderLookupLoading" @click="fetchOrderStatus()">
                    {{ orderLookupLoading ? "Checking..." : "Check Status" }}
                </button>
            </div>

            <div class="track-error" v-if="orderLookupError">{{ orderLookupError }}</div>

            <aside v-if="trackedOrders.length && (shopSettings.paymentLink || shopSettings.paymentQr)" class="payment-card" aria-labelledby="payment-title">
                <div class="payment-copy">
                    <div class="payment-label">Secure Payment</div>
                    <h3 id="payment-title">Pay with ABA</h3>
                    <p>Scan the QR code with your banking app, or open the ABA payment link on this device.</p>
                    <div class="payment-actions">
                        <a
                            v-if="shopSettings.paymentLink"
                            class="payment-link"
                            :href="shopSettings.paymentLink"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open ABA Pay
                            <span aria-hidden="true">↗</span>
                        </a>
                        <a
                            v-if="shopSettings.telegramSupport"
                            class="payment-link payment-link--telegram"
                            :href="`https://t.me/${shopSettings.telegramSupport}`"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Tell Us Paid
                            <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                </div>
                <a
                    v-if="shopSettings.paymentQr"
                    class="payment-qr-link"
                    :href="shopSettings.paymentLink || shopSettings.paymentQr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open ABA payment link"
                >
                    <img class="payment-qr" :src="shopSettings.paymentQr" alt="ABA payment QR code" />
                </a>
            </aside>

            <div class="track-card" v-for="order in trackedOrders" :key="order.orderId">
                <div class="track-row">
                    <span class="k">Order ID</span>
                    <button type="button" class="v track-id-btn" @click="selectTrackedOrderId(order.orderId)">{{ order.orderId }}</button>
                </div>
                <div class="track-row">
                    <span class="k">Status</span>
                    <span class="v status-pill">{{ order.status || "pending" }}</span>
                </div>
                <div class="track-row" v-if="order.pickupTime">
                    <span class="k">Pickup Time</span>
                    <span class="v">{{ order.pickupTime }}</span>
                </div>
                <div class="track-row" v-if="Number.isFinite(Number(order.total))">
                    <span class="k">Total</span>
                    <span class="v">${{ Number(order.total).toFixed(2) }}</span>
                </div>
                <div class="track-row" v-if="order.grabTracking">
                    <span class="k">Grab Tracking</span>
                    <a class="v" :href="order.grabTracking" target="_blank" rel="noopener">🛵 Open Tracking</a>
                </div>
                <div class="track-row" v-if="order.updatedAt">
                    <span class="k">Updated</span>
                    <span class="v">{{ formatDate(order.updatedAt) }}</span>
                </div>
                <div class="track-live" :class="{ online: orderSocketConnected }">
                    <span class="dot"></span>
                    {{ orderSocketConnected ? "Realtime connected" : "Realtime reconnecting..." }}
                </div>
            </div>

            <div class="track-card" v-if="!trackedOrders.length">
                <div class="track-row">
                    <span class="k">No tracked orders yet</span>
                    <span class="v">Use your order ID above.</span>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { useShop } from "@/store/useShop";

const { shopSettings, trackedOrders, orderSocketConnected, orderLookupId, orderLookupLoading, orderLookupError, setOrderLookupId, fetchOrderStatus } = useShop();

function selectTrackedOrderId(orderId) {
    setOrderLookupId(orderId);
}

function formatDate(value) {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString();
}
</script>
