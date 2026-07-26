<template>
    <footer id="contact" class="contact-footer">
        <div class="contact-title">Contact Us</div>

        <div class="contact-grid">
            <div class="contact-links">
                <a v-if="shopSettings.email" :href="`mailto:${shopSettings.email}`">
                    <span class="contact-icon">✉</span>
                    <span>Email <b>:</b> {{ shopSettings.email }}</span>
                </a>
                <a v-if="shopSettings.phone" :href="`tel:${shopSettings.phone}`">
                    <span class="contact-icon">☎</span>
                    <span>Number <b>:</b> {{ shopSettings.phone }}</span>
                </a>
            </div>

            <div class="contact-links">
                <a v-if="shopSettings.facebook" :href="`https://facebook.com/${shopSettings.facebook}`" target="_blank" rel="noopener">
                    <span class="contact-icon contact-icon--facebook">f</span>
                    <span>Facebook <b>:</b> {{ shopSettings.facebook }}</span>
                </a>
                <a v-if="shopSettings.telegram" :href="`https://t.me/${shopSettings.telegram}`" target="_blank" rel="noopener">
                    <span class="contact-icon">➤</span>
                    <span>Telegram <b>:</b> {{ shopSettings.telegram }}</span>
                </a>
            </div>
        </div>

        <div class="footer-details">
            <div>
                <h4>Location</h4>
                <p>{{ shopSettings.location }}</p>
            </div>
            <div>
                <h4>Opening Hours</h4>
                <p>From {{ shopOpenTimeLabel }} onwards</p>
            </div>
            <div>
                <h4>Deliver Via</h4>
                <p>{{ shopSettings.grabEnabled ? "Grab Delivery" : "Currently unavailable" }}</p>
            </div>
        </div>

        <div class="foot-bottom">© 2026 {{ shopSettings.shopName }}. Masarap, walang kupas.</div>
    </footer>
</template>

<script setup>
import { useShop } from "@/store/useShop";

const { shopSettings, shopOpenTimeLabel } = useShop();
</script>
