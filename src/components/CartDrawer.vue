<template>
  <div v-if="drawerOpen" class="overlay" @click="drawerOpen = false"></div>
  <aside class="drawer" v-if="drawerOpen">
    <div class="drawer-head">
      <h3>Your basket</h3>
      <button class="close-x" @click="drawerOpen = false" aria-label="Close">×</button>
    </div>

    <div class="drawer-items">
      <div v-if="cart.length === 0" class="empty-cart">Your basket is empty.<br>Add a dish to get started.</div>

      <div class="cart-row" v-for="item in cart" :key="item.id">
        <!-- thumbnail -->
        <div class="cart-thumb">
          <img
            :src="item.img"
            :alt="item.name"
            @error="onThumbError($event, item)"
          />
        </div>
        <!-- info -->
        <div class="cart-info">
          <div class="cn">{{ item.name }}</div>
          <div class="cp">${{ item.price.toFixed(2) }} each</div>
          <div class="cart-min-note" v-if="item.minQty">⚠ Min. {{ item.minQty }} pcs</div>
        </div>
        <!-- qty -->
        <div class="qty-ctrl">
          <button @click="decrement(item)" :class="{ 'at-min': item.qty <= (item.minQty || 1) }" :title="item.qty <= (item.minQty || 1) ? 'Tap to remove' : 'Decrease'">−</button>
          <span>{{ item.qty }}</span>
          <button @click="increment(item)">+</button>
        </div>
      </div>
    </div>

    <div class="drawer-foot">
      <div class="total-row"><span>Total</span><span>${{ cartTotal.toFixed(2) }}</span></div>
      <button class="checkout-btn" :disabled="cart.length === 0" @click="openCheckout">Place order</button>
    </div>
  </aside>
</template>

<script setup>
import { useShop } from '@/store/useShop'

const { cart, drawerOpen, increment, decrement, cartTotal, openCheckout } = useShop()

function onThumbError(e, item) {
  const fb = document.createElement('div')
  fb.className = 'thumb-fallback'
  fb.textContent = item.icon || '🍽️'
  e.target.parentNode.replaceChild(fb, e.target)
}
</script>
