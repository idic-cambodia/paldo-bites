<template>
  <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
</template>

<script setup>
import { useShop } from '@/store/useShop'

const { toastMsg } = useShop()
</script>
