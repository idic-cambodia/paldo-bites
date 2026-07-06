<template>
    <div class="dish">
        <div class="dish-img">
            <img v-if="dish.img && !imgFailed" :src="dish.img" :alt="dish.name" loading="lazy" @error="onImgError" />
            <div v-else class="img-fallback">{{ dish.icon || "🍽️" }}</div>
            <div class="card-badge" v-if="qtyInCart(dish.id) > 0">{{ qtyInCart(dish.id) }} in basket</div>
            <div class="min-tag" v-if="dish.minQty">Min. {{ dish.minQty }} pcs</div>
        </div>
        <div class="dish-body">
            <div class="dish-name">{{ dish.name }}</div>
            <div class="dish-desc" v-if="dish.desc">{{ dish.desc }}</div>
            <div class="dish-foot">
                <span class="dish-price">${{ dish.price.toFixed(2) }}</span>
                <button class="add-btn" @click="addToCart(dish)" :aria-label="'Add ' + dish.name" :disabled="!shopSettings.isOpen">+</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useShop } from "@/store/useShop";

const props = defineProps({
    dish: { type: Object, required: true }
});

const { qtyInCart, addToCart, shopSettings } = useShop();
const imgFailed = ref(false);

watch(
    () => props.dish?.img,
    () => {
        imgFailed.value = false;
    },
    { immediate: true }
);

function onImgError(e) {
    imgFailed.value = true;
}
</script>
