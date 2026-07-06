<template>
    <footer id="contact">
        <div class="footer-inner">
            <div class="footer-logo"><img src="/logo.jpg" class="logo-img-footer" alt="Shawarma Best x Paldo Bites KH" /></div>
            <div class="foot-cols">
                <div>
                    <h4>Visit</h4>
                    <p>{{ shopSettings.location }}</p>
                </div>
                <div>
                    <h4>Hours</h4>
                    <p>{{ shopSettings.isOpen ? "Open" : "Closed" }} from {{ shopOpenTimeLabel }}</p>
                    <p>Max {{ shopSettings.maxOrdersPerDay }} orders / day</p>
                </div>
                <div>
                    <h4>Order</h4>
                    <a href="#" v-if="shopSettings.grabEnabled">Grab Delivery</a>
                    <a :href="`tel:${shopSettings.phone}`" v-if="shopSettings.phone">{{ shopSettings.phone }}</a>
                    <a :href="`mailto:${shopSettings.email}`" v-if="shopSettings.email">{{ shopSettings.email }}</a>
                    <a :href="`https://facebook.com/${shopSettings.facebook}`" target="_blank" rel="noopener" v-if="shopSettings.facebook"
                        >Facebook: {{ shopSettings.facebook }}</a
                    >
                    <a :href="`https://t.me/${shopSettings.telegram}`" target="_blank" rel="noopener" v-if="shopSettings.telegram"
                        >Telegram: {{ shopSettings.telegram }}</a
                    >
                </div>
            </div>
        </div>
        <div class="foot-bottom wrap">© 2026 {{ shopSettings.shopName }}. Masarap, walang kupas.</div>
    </footer>
</template>

<script setup>
import { useShop } from "@/store/useShop";

const { shopSettings, shopOpenTimeLabel } = useShop();
</script>
