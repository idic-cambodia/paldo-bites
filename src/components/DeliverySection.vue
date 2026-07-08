<template>
    <section class="grab-section" id="delivery">
        <div class="grab-inner">
            <div class="grab-text">
                <h2>Pick-up or delivery — your choice</h2>
                <p>Order ahead for pick-up at our store, or have it delivered straight to your door via Grab. Fresh, packed right, on the way.</p>
            </div>
            <div>
                <div class="grab-options">
                    <a href="https://www.google.com/maps?q=11.509584,104.858734" target="_blank">
                        <div class="grab-option" v-if="shopSettings.pickupEnabled">
                            <span class="icon">📍</span>
                            <div>
                                <div class="label">Check our location to</div>
                                <div class="val">Pick-up</div>
                            </div>
                        </div>
                    </a>
                    <div class="grab-option" v-if="shopSettings.grabEnabled">
                        <span class="icon">🛵</span>
                        <div>
                            <div class="label">Delivered to your door</div>
                            <div class="val">Grab Delivery</div>
                        </div>
                    </div>
                </div>
                <!-- <button class="btn-grab-lg" v-if="shopSettings.grabEnabled">🛵 &nbsp;Open in Grab</button> -->
            </div>
        </div>
    </section>
</template>

<script setup>
import { useShop } from "@/store/useShop";

const { shopSettings } = useShop();
</script>
