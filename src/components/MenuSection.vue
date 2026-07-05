<template>
  <div class="menu-page" id="menu">

    <!-- ULAM -->
    <div class="section">
      <div class="section-head">
        <div class="section-label">Main</div>
        <h2>Ulam</h2>
      </div>
      <div class="section-subtitle">Our signature mains, made to order</div>
      <div class="divider"></div>
      <div class="grid">
        <DishCard v-for="dish in ulam" :key="dish.id" :dish="dish" />
      </div>
    </div>

    <!-- MERIENDA -->
    <div class="section">
      <div class="section-head">
        <div class="section-label">Snacks & Sides</div>
        <h2>Merienda</h2>
      </div>
      <div class="section-subtitle">Ilocos empanada &amp; afternoon favorites</div>
      <div class="divider"></div>
      <div class="grid">
        <DishCard v-for="dish in merienda" :key="dish.id" :dish="dish" />
      </div>
    </div>

  </div>
</template>

<script setup>
import DishCard from './DishCard.vue'
import { ulam, merienda } from '@/data/menu'
</script>
