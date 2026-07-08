<template>
    <!-- GRAB BANNER -->
    <div class="grab-banner" v-if="shopSettings.grabEnabled">🛵 Now available for pick-up or delivery via Grab &nbsp;·&nbsp;</div>

    <!-- NAV -->
    <header>
        <div class="nav">
            <div class="logo">
                <img src="/logo.jpg" class="logo-img" alt="Shawarma Best x Paldo Bites KH" />
                <div class="logo-name">
                    {{ shopSettings.shopName }}<span>{{ shopSettings.location }}</span>
                </div>
            </div>
            <nav class="nav-links">
                <a href="#track-order">Track</a>
                <a href="#menu">Menu</a>
                <a href="#delivery">Delivery</a>
                <a href="#about">About</a>
                <a href="#contact">Visit</a>
            </nav>
            <div class="nav-right">
                <button class="cart-btn" @click="drawerOpen = true">
                    🛒 Basket <span class="cart-count">{{ cartCount }}</span>
                </button>
                <!-- <a
                    v-if="shopSettings.telegram"
                    :href="telegramUrl"
                    class="social-icon-btn social-telegram"
                    target="_blank"
                    rel="noopener"
                    aria-label="Open Telegram"
                    title="Telegram"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            fill="currentColor"
                            d="M9.04 15.52 8.66 20.9c.54 0 .77-.23 1.05-.52l2.52-2.4 5.23 3.83c.96.53 1.64.25 1.9-.89l3.45-16.16h.01c.31-1.45-.52-2.02-1.45-1.68L1.1 10.86c-1.38.53-1.36 1.3-.24 1.65l5.19 1.62L18.1 6.6c.57-.35 1.1-.16.67.2z"
                        />
                    </svg>
                </a>
                <a
                    v-if="shopSettings.facebook"
                    :href="facebookUrl"
                    class="social-icon-btn social-facebook"
                    target="_blank"
                    rel="noopener"
                    aria-label="Open Facebook"
                    title="Facebook"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            fill="currentColor"
                            d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.78-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.24 0-1.62.76-1.62 1.55V12h2.76l-.44 2.89h-2.32v6.99A10 10 0 0 0 22 12"
                        />
                    </svg>
                </a> -->
            </div>
        </div>
    </header>
</template>

<script setup>
import { computed } from "vue";
import { useShop } from "@/store/useShop";

const { drawerOpen, cartCount, shopSettings } = useShop();
const telegramUrl = computed(() => `https://t.me/${shopSettings.value.telegram}`);
const facebookUrl = computed(() => `https://facebook.com/${shopSettings.value.facebook}`);
</script>
