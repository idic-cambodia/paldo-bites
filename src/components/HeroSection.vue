<template>
    <section class="hero">
        <div class="hero-inner">
            <div>
                <div class="eyebrow">{{ shopSettings.shopName }}</div>
                <h1>Best shawarma & Ilocos empanada, <em>made fresh daily.</em></h1>
                <p>Authentic Ilocos empanada, juicy shawarma wraps, and Filipino merienda — serving Phnom Penh, Cambodia with flavors from home.</p>
                <div class="hero-delivery">
                    <span class="dot"></span>
                    {{ deliveryLine }}
                </div>
                <div class="hero-ctas">
                    <a href="#menu" class="btn-primary">See the menu</a>
                    <a
                        v-if="shopSettings.telegram"
                        :href="telegramUrl"
                        class="btn-grab"
                        target="_blank"
                        rel="noopener"
                        aria-label="Open Telegram"
                        title="Telegram"
                    >
                        <div class="social-icon-btn social-telegram">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fill="currentColor"
                                    d="M9.04 15.52 8.66 20.9c.54 0 .77-.23 1.05-.52l2.52-2.4 5.23 3.83c.96.53 1.64.25 1.9-.89l3.45-16.16h.01c.31-1.45-.52-2.02-1.45-1.68L1.1 10.86c-1.38.53-1.36 1.3-.24 1.65l5.19 1.62L18.1 6.6c.57-.35 1.1-.16.67.2z"
                                />
                            </svg>
                        </div>
                        Chat US
                    </a>
                </div>
            </div>
            <div class="board">
                <span class="board-slide-label">{{ boardSlide + 1 }} / {{ boardSlides.length }}</span>
                <div style="position: relative; min-height: 220px">
                    <transition name="slide-fade" mode="out-in">
                        <div :key="boardSlide">
                            <div class="board-row" v-for="item in boardSlides[boardSlide] || []" :key="item.name">
                                <span class="name">{{ item.name }}</span>
                                <span class="price">{{ item.price }}</span>
                            </div>
                        </div>
                    </transition>
                </div>
                <div class="board-dots">
                    <button
                        v-for="(_, i) in boardSlides"
                        :key="i"
                        class="board-dot"
                        :class="{ active: boardSlide === i }"
                        @click="goToSlide(i)"
                        :aria-label="'Slide ' + (i + 1)"
                    ></button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { computed } from "vue";
import { useShop } from "@/store/useShop";

const { boardSlides, boardSlide, goToSlide, shopSettings } = useShop();

const telegramUrl = computed(() => `https://t.me/${shopSettings.value.telegram}`);
const deliveryLine = computed(() => {
    if (!shopSettings.value.isOpen) return "Currently closed";
    if (shopSettings.value.pickupEnabled && shopSettings.value.grabEnabled) return "Pick-up & Grab delivery available now";
    if (shopSettings.value.pickupEnabled) return "Pick-up available now";
    if (shopSettings.value.grabEnabled) return "Grab delivery available now";
    return "Ordering currently unavailable";
});
</script>
