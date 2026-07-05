# Shawarma Best x Paldo Bites KH

A Vue 3 + Vite rebuild of the single-file ordering page: menu, basket drawer,
checkout modal, and a map-based pickup-location picker (Leaflet + OpenStreetMap).

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## Project structure

```
index.html                 Vite entry HTML (loads /src/main.js)
src/
  main.js                  App bootstrap
  App.vue                  Top-level layout, composes all sections/modals
  style.css                Global CSS (design tokens, layout, components)
  data/
    menu.js                Dish lists (Ulam, Merienda) + hero board slides
  store/
    useShop.js              Shared app state (cart, checkout, location picker)
                             as a small singleton composable
  components/
    AppHeader.vue           Grab banner + sticky nav + basket button
    HeroSection.vue         Hero copy + rotating "today's menu" board
    MenuSection.vue         Renders the Ulam / Merienda dish grids
    DishCard.vue            Single dish card (image, price, add button)
    DeliverySection.vue     Pick-up vs Grab delivery section
    AboutSection.vue        Three-column "about us" band
    AppFooter.vue           Footer with hours/contact
    CartDrawer.vue          Slide-out basket drawer
    CheckoutModal.vue       Phone number + pickup location fields
    LocationPickerModal.vue Map + draggable center pin (Leaflet) to choose
                             a pickup spot anywhere in Phnom Penh
    ToastMessage.vue        Small bottom toast notification
public/
  logo.jpg                  Restaurant logo (used in header + footer)
```

## How state is shared

`src/store/useShop.js` exports a `useShop()` composable that returns the same
underlying refs/functions everywhere it's imported (module-level singleton
state) — a lightweight alternative to Pinia/Vuex for an app this size. Any
component can `import { useShop } from '@/store/useShop'` and pull out only
what it needs.

## Notes

- The location picker uses the `leaflet` npm package and OpenStreetMap tiles,
  plus the free Nominatim reverse-geocoding API to show a human-readable
  address as the user drags the pin.
- Geolocation and reverse geocoding both require the app to run over
  `http://localhost` or `https://` — browsers block `navigator.geolocation`
  on plain `file://` pages.
