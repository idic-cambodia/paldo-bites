<template>
  <!-- GRAB BANNER -->
  <div class="grab-banner">
    🛵 Now available for pick-up or delivery via Grab &nbsp;·&nbsp;
    <a href="#">Order on Grab →</a>
  </div>

  <!-- NAV -->
  <header>
    <div class="nav">
      <div class="logo">
        <img src="/logo.jpg" class="logo-img" alt="Shawarma Best x Paldo Bites KH" />
        <div class="logo-name">Shawarma Best<span>x Paldo Bites KH</span></div>
      </div>
      <nav class="nav-links">
        <a href="#menu">Menu</a>
        <a href="#delivery">Delivery</a>
        <a href="#about">About</a>
        <a href="#contact">Visit</a>
      </nav>
      <div class="nav-right">
        <a href="#" class="grab-pill">🛵 Grab</a>
        <button class="cart-btn" @click="drawerOpen = true">
          🛒 Basket <span class="cart-count">{{ cartCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useShop } from '@/store/useShop'

const { drawerOpen, cartCount } = useShop()
</script>
