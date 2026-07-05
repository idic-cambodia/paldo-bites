const IMG = (kw) => `https://loremflickr.com/480/340/${encodeURIComponent(kw)}/all`

export const ulam = [
  { id: 1, name: 'Shawarma', price: 3.00, icon: '🌯', desc: 'Classic wrap with garlic sauce and pickled veggies.', img: IMG('shawarma wrap') },
  { id: 2, name: 'Shawarma Fries', price: 3.50, icon: '🍟', desc: 'Shawarma filling loaded over crispy golden fries.', img: IMG('shawarma fries') },
  { id: 3, name: 'Shawarma Nachos', price: 3.50, icon: '🧀', desc: 'Shawarma over crunchy tortilla chips with creamy sauce.', img: IMG('nachos chips') },
  { id: 4, name: 'Ilocos Empanada Regular', price: 2.00, icon: '🥟', desc: 'Hand-folded, fried golden with longganisa & egg.', img: IMG('empanada fried') },
  { id: 5, name: 'Ilocos Empanada Special', price: 2.50, icon: '🥟', desc: 'Regular with extra longganisa filling.', img: IMG('empanada pastry') },
  { id: 6, name: 'Ilocos Empanada Paldo', price: 3.50, icon: '🥟', desc: 'Premium Paldo-style with all the fixings.', img: IMG('crispy empanada') },
]

export const merienda = [
  { id: 7, name: 'Extra Rice', price: 0.25, icon: '🍚', desc: 'A side of freshly steamed white rice.', img: IMG('steamed rice bowl') },
  { id: 8, name: 'Chicken Inasal (no rice)', price: 4.00, icon: '🍗', desc: 'Citrus-marinated charcoal-grilled chicken.', img: IMG('grilled chicken inasal') },
  { id: 9, name: 'Chicken Inasal with Rice', price: 4.50, icon: '🍗', desc: 'Charcoal-grilled chicken served with steamed rice.', img: IMG('grilled chicken rice') },
  { id: 10, name: 'Lumpiang Shanghai (8 pcs)', price: 3.00, icon: '🥢', desc: 'Eight crispy pork spring rolls with sweet chili dip.', img: IMG('spring rolls fried') },
  { id: 11, name: 'Lumpiang Shanghai (per pc)', price: 0.35, icon: '🥢', desc: 'Crispy pork spring roll. Minimum order 5 pcs.', img: IMG('lumpia spring roll'), minQty: 5 },
  { id: 12, name: 'BBQ Set with Rice', price: 3.00, icon: '🍖', desc: 'Pork BBQ skewers served with steamed rice.', img: IMG('bbq pork skewer rice') },
  { id: 13, name: 'BBQ per pc', price: 0.875, icon: '🍖', desc: 'Juicy pork BBQ skewer. Minimum order 5 pcs.', img: IMG('pork bbq skewer'), minQty: 5 },
  { id: 14, name: 'BBQ per pc (value)', price: 0.75, icon: '🍖', desc: 'Value pork BBQ skewer. Minimum order 5 pcs.', img: IMG('barbecue skewer'), minQty: 5 },
]

export const boardSlides = [
  [
    { name: 'Shawarma', price: '$3.00' },
    { name: 'Shawarma Fries', price: '$3.50' },
    { name: 'Shawarma Nachos', price: '$3.50' },
    { name: 'Ilocos Empanada Regular', price: '$2.00' },
    { name: 'Ilocos Empanada Special', price: '$2.50' },
  ],
  [
    { name: 'Ilocos Empanada Paldo', price: '$3.50' },
    { name: 'Chicken Inasal (no rice)', price: '$4.00' },
    { name: 'Chicken Inasal w/ rice', price: '$4.50' },
    { name: 'BBQ Set with Rice', price: '$3.00' },
    { name: 'Lumpiang Shanghai 8pcs', price: '$3.00' },
  ],
]
