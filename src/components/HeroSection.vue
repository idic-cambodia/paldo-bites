<template>
    <section class="hero" :style="heroStyle">
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
                        Telegram
                    </a>
                    <a
                        v-if="shopSettings.facebook"
                        :href="facebookUrl"
                        target="_blank"
                        rel="noopener"
                        aria-label="Open Facebook"
                        title="Facebook"
                        class="btn-grab"
                    >
                        <div class="social-icon-btn social-telegram">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    fill="currentColor"
                                    d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.78-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.24 0-1.62.76-1.62 1.55V12h2.76l-.44 2.89h-2.32v6.99A10 10 0 0 0 22 12"
                                />
                            </svg>
                        </div>
                        Facebook
                    </a>
                </div>
            </div>
            <div v-if="hasHeroImages" class="board hero-board hero-board--images">
                <span class="board-slide-label">{{ activeHeroIndex + 1 }} / {{ heroItems.length }}</span>
                <transition name="hero-slide" mode="out-in">
                    <div :key="activeHeroItem?.id || activeHeroIndex" class="hero-image-panel">
                        <div class="hero-image-frame">
                            <img :src="activeHeroItem.img" :alt="activeHeroItem.name" loading="eager" />
                        </div>
                        <div class="hero-image-copy">
                            <div>
                                <div class="hero-image-name">{{ activeHeroItem.name }}</div>
                                <div class="hero-image-desc">{{ activeHeroItem.desc || "Freshly prepared and ready to order." }}</div>
                            </div>
                            <div class="hero-image-price">${{ activeHeroItem.price.toFixed(2) }}</div>
                        </div>
                    </div>
                </transition>
                <div class="board-dots hero-dots">
                    <button
                        v-for="(_, i) in heroItems"
                        :key="i"
                        class="board-dot"
                        :class="{ active: activeHeroIndex === i }"
                        @click="goToHeroSlide(i)"
                        :aria-label="'Hero image ' + (i + 1)"
                    ></button>
                </div>
            </div>
            <div v-else class="board">
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
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useShop } from "@/store/useShop";

const { boardSlides, boardSlide, goToSlide, menuByCategory, menuCategories, shopSettings } = useShop();

const telegramUrl = computed(() => `https://t.me/${shopSettings.value.telegram}`);
const facebookUrl = computed(() => `https://facebook.com/${shopSettings.value.facebook}`);
const deliveryLine = computed(() => {
    if (!shopSettings.value.isOpen) return "Currently closed";
    if (shopSettings.value.pickupEnabled && shopSettings.value.grabEnabled) return "Pick-up & Grab delivery available now";
    if (shopSettings.value.pickupEnabled) return "Pick-up available now";
    if (shopSettings.value.grabEnabled) return "Grab delivery available now";
    return "Ordering currently unavailable";
});

const heroItems = computed(() => menuCategories.value.flatMap((category) => menuByCategory.value[category] || []).filter((item) => item && item.img));
const hasHeroImages = computed(() => heroItems.value.length > 0);
const activeHeroIndex = ref(0);
const heroPalette = ref({
    base: "#2e2014",
    accent: "#4e2c1c",
    orb: "rgba(200, 71, 42, 0.22)",
    orbAlt: "rgba(227, 165, 61, 0.18)"
});
let heroTimer = null;
let paletteToken = 0;

const activeHeroItem = computed(() => heroItems.value[activeHeroIndex.value] || heroItems.value[0] || null);

const heroStyle = computed(() => ({
    "--hero-base": heroPalette.value.base,
    "--hero-accent": heroPalette.value.accent,
    "--hero-orb-1": heroPalette.value.orb,
    "--hero-orb-2": heroPalette.value.orbAlt
}));

function clampHex(hex) {
    return hex.replace("#", "").slice(0, 6).padEnd(6, "0");
}

function hexToRgb(hex) {
    const value = clampHex(hex);
    return {
        r: Number.parseInt(value.slice(0, 2), 16),
        g: Number.parseInt(value.slice(2, 4), 16),
        b: Number.parseInt(value.slice(4, 6), 16)
    };
}

function rgbToHex({ r, g, b }) {
    return `#${[r, g, b]
        .map((value) => {
            const bounded = Math.max(0, Math.min(255, Math.round(value)));
            return bounded.toString(16).padStart(2, "0");
        })
        .join("")}`;
}

function mixHex(a, b, weight = 0.5) {
    const left = hexToRgb(a);
    const right = hexToRgb(b);
    const mix = (first, second) => first * (1 - weight) + second * weight;
    return rgbToHex({
        r: mix(left.r, right.r),
        g: mix(left.g, right.g),
        b: mix(left.b, right.b)
    });
}

async function extractPalette(src) {
    if (typeof window === "undefined" || !src) return null;

    return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const size = 24;
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext("2d", { willReadFrequently: true });
                if (!context) {
                    resolve(null);
                    return;
                }

                context.drawImage(image, 0, 0, size, size);
                const data = context.getImageData(0, 0, size, size).data;
                let totalR = 0;
                let totalG = 0;
                let totalB = 0;
                let count = 0;

                for (let index = 0; index < data.length; index += 4) {
                    const alpha = data[index + 3];
                    if (alpha < 16) continue;
                    totalR += data[index];
                    totalG += data[index + 1];
                    totalB += data[index + 2];
                    count++;
                }

                if (!count) {
                    resolve(null);
                    return;
                }

                const base = rgbToHex({
                    r: totalR / count,
                    g: totalG / count,
                    b: totalB / count
                });
                const warmAccent = mixHex(base, "#f6f0df", 0.42);
                const warmAccentRgb = hexToRgb(warmAccent);

                resolve({
                    base,
                    accent: mixHex(base, "#000000", 0.22),
                    orb: `rgba(${hexToRgb(base).r}, ${hexToRgb(base).g}, ${hexToRgb(base).b}, 0.28)`,
                    orbAlt: `rgba(${warmAccentRgb.r}, ${warmAccentRgb.g}, ${warmAccentRgb.b}, 0.18)`
                });
            } catch {
                resolve(null);
            }
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

function stopHeroTimer() {
    if (!heroTimer) return;
    clearInterval(heroTimer);
    heroTimer = null;
}

function startHeroTimer() {
    stopHeroTimer();
    if (heroItems.value.length < 2) return;
    heroTimer = setInterval(() => {
        activeHeroIndex.value = (activeHeroIndex.value + 1) % heroItems.value.length;
    }, 5500);
}

function goToHeroSlide(index) {
    const max = heroItems.value.length;
    if (!max) return;
    activeHeroIndex.value = Math.max(0, Math.min(index, max - 1));
    startHeroTimer();
}

watch(
    heroItems,
    (items) => {
        if (!items.length) {
            activeHeroIndex.value = 0;
            stopHeroTimer();
            heroPalette.value = {
                base: "#2e2014",
                accent: "#4e2c1c",
                orb: "rgba(200, 71, 42, 0.22)",
                orbAlt: "rgba(227, 165, 61, 0.18)"
            };
            return;
        }

        if (activeHeroIndex.value > items.length - 1) {
            activeHeroIndex.value = 0;
        }

        startHeroTimer();
    },
    { immediate: true }
);

watch(
    activeHeroItem,
    async (item) => {
        if (!item?.img) return;
        const token = ++paletteToken;
        const palette = await extractPalette(item.img);
        if (token !== paletteToken || !palette) return;
        heroPalette.value = palette;
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    stopHeroTimer();
});
</script>
