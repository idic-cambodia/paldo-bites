<template>
    <div class="menu-page" id="menu">
        <div class="menu-state" v-if="menuLoading && !hasMenuItems">Loading menu...</div>
        <div class="menu-state menu-error" v-if="menuError">
            Could not refresh menu from API. ({{ menuError }})
            <button class="menu-retry" @click="loadMenu({ force: true })">Retry</button>
        </div>

        <div class="section" v-for="category in menuCategories" :key="category">
            <div class="section-head">
                <div class="section-label">{{ categoryLabel(category) }}</div>
                <h2>{{ category }}</h2>
            </div>
            <div class="section-subtitle">{{ categorySubtitle(category) }}</div>
            <div class="divider"></div>
            <div class="grid">
                <DishCard v-for="dish in menuByCategory[category] || []" :key="dish.id" :dish="dish" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import DishCard from "./DishCard.vue";
import { useShop } from "@/store/useShop";

const { menuByCategory, menuCategories, menuLoading, menuError, loadMenu } = useShop();

const hasMenuItems = computed(() => menuCategories.value.some((category) => (menuByCategory.value[category] || []).length > 0));

function categoryLabel(category) {
    console.log("categoryLabel", category);
    const key = String(category || "").toLowerCase();
    if (key === "ulam") return "Main";
    if (key === "merienda") return "Snacks & Sides";
    if (key === "dessert") return "Sweet Treats";
    if (key === "add-ons") return "Extras";
    return "Menu";
}

function categorySubtitle(category) {
    const key = String(category || "").toLowerCase();
    if (key === "ulam") return "Our signature mains, made to order";
    if (key === "merienda") return "Ilocos empanada & afternoon favorites";
    if (key === "dessert") return "Freshly made sweets to finish your meal";
    if (key === "add-ons") return "Additional items to customize your order";
    return `Discover our ${category} picks`;
}
</script>
