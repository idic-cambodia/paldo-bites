<template>
  <section class="hero">
    <div class="hero-inner">
      <div>
        <div class="eyebrow">Shawarma Best x Paldo Bites KH</div>
        <h1>Best shawarma & Ilocos empanada, <em>made fresh daily.</em></h1>
        <p>Authentic Ilocos empanada, juicy shawarma wraps, and Filipino merienda — serving Phnom Penh, Cambodia with flavors from home.</p>
        <div class="hero-delivery">
          <span class="dot"></span>
          Pick-up &amp; Grab delivery available now
        </div>
        <div class="hero-ctas">
          <a href="#menu" class="btn-primary">See the menu</a>
          <a href="#" class="btn-grab">🛵 Order on Grab</a>
        </div>
      </div>
      <div class="board">
        <span class="board-slide-label">{{ boardSlide + 1 }} / {{ boardSlides.length }}</span>
        <div style="position:relative;min-height:220px;">
          <transition name="slide-fade" mode="out-in">
            <div :key="boardSlide">
              <div class="board-row" v-for="item in boardSlides[boardSlide]" :key="item.name">
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
import { useShop } from '@/store/useShop'

const { boardSlides, boardSlide, goToSlide } = useShop()
</script>
