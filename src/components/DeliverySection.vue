<template>
    <section class="grab-section delivery-showcase" id="delivery">
        <div class="grab-inner delivery-showcase-inner">
            <div class="grab-text delivery-showcase-copy">
                <h2>Pick-up or Delivery — your choice</h2>
                <p>Order ahead for pick-up at our store, or have it delivered straight to your door via Grab. Fresh, packed right, on the way.</p>
            </div>

            <div class="delivery-location-cards">
                <a
                    v-if="shopSettings.pickupEnabled"
                    class="delivery-location-card delivery-location-card--pickup"
                    href="https://www.google.com/maps?q=11.509584,104.858734"
                    target="_blank"
                    rel="noopener"
                >
                    <span class="delivery-pin">●</span>
                    <span>
                        <small>Location for</small>
                        <strong>Pick-up</strong>
                    </span>
                    <span class="delivery-route">⌖—⌖</span>
                </a>

                <div v-if="shopSettings.grabEnabled" class="delivery-location-card delivery-location-card--grab">
                    <span class="delivery-pin">●</span>
                    <span>
                        <small>Location for</small>
                        <strong>Grab Delivery</strong>
                    </span>
                    <span class="delivery-route">🛵</span>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { useShop } from "@/store/useShop";

const { shopSettings } = useShop();
</script>
