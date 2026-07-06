<template>
    <div id="app">
        <AppHeader />
        <HeroSection />
        <OrderTrackingSection />
        <MenuSection />
        <DeliverySection />
        <AboutSection />
        <AppFooter />

        <CartDrawer />
        <CheckoutModal />
        <LocationPickerModal />
        <ToastMessage />
    </div>
</template>

<script setup>
import { onMounted } from "vue";
import AppHeader from "./components/AppHeader.vue";
import HeroSection from "./components/HeroSection.vue";
import OrderTrackingSection from "./components/OrderTrackingSection.vue";
import MenuSection from "./components/MenuSection.vue";
import DeliverySection from "./components/DeliverySection.vue";
import AboutSection from "./components/AboutSection.vue";
import AppFooter from "./components/AppFooter.vue";
import CartDrawer from "./components/CartDrawer.vue";
import CheckoutModal from "./components/CheckoutModal.vue";
import LocationPickerModal from "./components/LocationPickerModal.vue";
import ToastMessage from "./components/ToastMessage.vue";
import { useShop } from "@/store/useShop";

const { loadMenu, loadSettings } = useShop();

onMounted(() => {
    loadSettings();
    loadMenu();
});
</script>
