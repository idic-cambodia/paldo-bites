<template>
    <section class="hero hero--mosaic">
        <div class="hero-mosaic" aria-hidden="true">
            <div
                v-for="(item, index) in heroItems"
                :key="`hero-tile-${item.id || index}`"
                class="hero-mosaic-tile"
                :class="`hero-mosaic-tile--${index + 1}`"
            >
                <img :src="item.img" :alt="item.name" />
            </div>
        </div>
        <div class="hero-shade"></div>

        <div class="hero-inner hero-inner--showcase">
            <div class="hero-copy">
                <div class="eyebrow">{{ shopSettings.shopName }}</div>
                <h1>Best Shawarma &amp;<br />Ilocos Empanada</h1>
                <div class="hero-script">Made fresh daily</div>
                <p>Authentic Ilocos empanada, juicy shawarma wraps, and Filipino merienda — serving Phnom Penh, Cambodia with flavors from home.</p>

                <div class="hero-ctas hero-socials">
                    <a
                        v-if="shopSettings.telegram"
                        :href="telegramUrl"
                        class="hero-social-link"
                        target="_blank"
                        rel="noopener"
                        aria-label="Open Telegram"
                    >
                        <span class="hero-social-icon hero-social-icon--telegram">➤</span>
                        Telegram
                    </a>
                    <a
                        v-if="shopSettings.facebook"
                        :href="facebookUrl"
                        class="hero-social-link"
                        target="_blank"
                        rel="noopener"
                        aria-label="Open Facebook"
                    >
                        <span class="hero-social-icon hero-social-icon--facebook">f</span>
                        Facebook
                    </a>
                </div>
            </div>

            <div v-if="activeHeroItem" class="hero-feature-wrap">
                <div class="hero-menu-label">Today's<br /><strong>Menu</strong></div>
                <article class="hero-feature-card">
                    <div class="hero-feature-image">
                        <img :src="activeHeroItem.img" :alt="activeHeroItem.name" />
                    </div>
                    <div class="hero-feature-details">
                        <div>
                            <h2>{{ activeHeroItem.name }}</h2>
                            <p>{{ activeHeroItem.desc || "Freshly prepared and ready to order." }}</p>
                        </div>
                        <div class="hero-feature-price">${{ Number(activeHeroItem.price).toFixed(2) }}</div>
                    </div>
                    <div class="hero-feature-dots" aria-label="Featured menu items">
                        <button
                            v-for="(_, index) in heroItems"
                            :key="index"
                            :class="{ active: activeHeroIndex === index }"
                            :aria-label="`Show menu item ${index + 1}`"
                            @click="goToHeroSlide(index)"
                        ></button>
                    </div>
                </article>
            </div>

            <a href="#menu" class="hero-menu-button">Menu</a>
        </div>
    </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useShop } from "@/store/useShop";

const { menuByCategory, menuCategories, shopSettings } = useShop();

const telegramUrl = computed(() => `https://t.me/${shopSettings.value.telegram}`);
const facebookUrl = computed(() => `https://facebook.com/${shopSettings.value.facebook}`);

const heroItems = computed(() => {
    const groups = menuCategories.value
        .map((category) => (menuByCategory.value[category] || []).filter((item) => item?.img))
        .filter((items) => items.length);

    const selected = [];
    let row = 0;
    while (selected.length < 8 && groups.some((items) => row < items.length)) {
        groups.forEach((items) => {
            if (selected.length < 8 && items[row]) selected.push(items[row]);
        });
        row += 1;
    }
    return selected;
});

const activeHeroIndex = ref(0);
const activeHeroItem = computed(() => heroItems.value[activeHeroIndex.value] || heroItems.value[0] || null);
let heroTimer = null;

function stopHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
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
    activeHeroIndex.value = index;
    startHeroTimer();
}

watch(
    heroItems,
    (items) => {
        if (activeHeroIndex.value >= items.length) activeHeroIndex.value = 0;
        startHeroTimer();
    },
    { immediate: true }
);

onBeforeUnmount(stopHeroTimer);
</script>
