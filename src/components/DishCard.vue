<template>
  <div class="dish">
    <div class="dish-img">
      <img :src="dish.img" :alt="dish.name" loading="lazy" @error="onImgError" />
      <div class="card-badge" v-if="qtyInCart(dish.id) > 0">{{ qtyInCart(dish.id) }} in basket</div>
      <div class="min-tag" v-if="dish.minQty">Min. {{ dish.minQty }} pcs</div>
    </div>
    <div class="dish-body">
      <div class="dish-name">{{ dish.name }}</div>
      <div class="dish-desc" v-if="dish.desc">{{ dish.desc }}</div>
      <div class="dish-foot">
        <span class="dish-price">${{ dish.price.toFixed(2) }}</span>
        <button class="add-btn" @click="addToCart(dish)" :aria-label="'Add ' + dish.name">+</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useShop } from '@/store/useShop'

const props = defineProps({
  dish: { type: Object, required: true },
})

const { qtyInCart, addToCart } = useShop()

function onImgError(e) {
  const el = e.target
  const parent = el.parentNode
  el.style.display = 'none'
  const fb = document.createElement('div')
  fb.className = 'img-fallback'
  fb.textContent = props.dish.icon || '🍽️'
  parent.insertBefore(fb, el)
}
</script>
