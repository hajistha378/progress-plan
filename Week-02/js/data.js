/* ============================================================
   COCO LANE CAFE — Shared product catalogue (seed data)
   This data is copied into LocalStorage on first visit so the
   admin dashboard can edit it without a backend.
   ============================================================ */

const COCO_CATEGORIES = [
  { id: 'hot-coffee', label: 'Hot Coffee', icon: 'cup' },
  { id: 'cold-coffee', label: 'Cold Coffee', icon: 'iced' },
  { id: 'tea', label: 'Tea', icon: 'leaf' },
  { id: 'desserts', label: 'Desserts', icon: 'cake' },
  { id: 'cakes', label: 'Cakes', icon: 'cake' },
  { id: 'snacks', label: 'Snacks', icon: 'croissant' }
];

const COCO_PRODUCTS = [
  {
    id: 'espresso',
    name: 'Double Espresso',
    category: 'hot-coffee',
    price: 520,
    image: 'images/espresso.jpg',
    short: 'A bold, velvety shot pulled from our house blend.',
    description:
      'Two generous shots of our signature Coco Lane blend, pulled slow for a thick golden crema. Notes of dark chocolate, roasted hazelnut and a whisper of caramel — short, strong and beautifully simple.',
    ingredients: '100% Arabica coffee (Colombia & Ethiopia), filtered water.',
    allergens: 'No known allergens.',
    calories: 5,
    badge: 'House Favourite',
    featured: true,
    rating: 4.9,
    reviews: 142
  },
  {
    id: 'cappuccino',
    name: 'Classic Cappuccino',
    category: 'hot-coffee',
    price: 780,
    image: 'images/cappuccino.jpg',
    short: 'Silky microfoam, a double shot and a dusting of cocoa.',
    description:
      'Our most-loved morning ritual. A rich double espresso topped with steamed milk folded into a cloud of microfoam, finished with a light dusting of single-origin cocoa. Balanced, warm and comforting.',
    ingredients: 'House espresso blend, fresh full-cream milk, cocoa powder.',
    allergens: 'Contains milk.',
    calories: 145,
    badge: 'Bestseller',
    featured: true,
    rating: 4.9,
    reviews: 208
  },
  {
    id: 'latte',
    name: 'Caffè Latte',
    category: 'hot-coffee',
    price: 820,
    image: 'images/latte.jpg',
    short: 'Smooth espresso and steamed milk with delicate latte art.',
    description:
      'A gentle, milk-forward coffee for slow mornings. Two shots of espresso and velvety steamed milk, poured into a cup and finished by hand with delicate latte art. Add a hint of vanilla or caramel if you like.',
    ingredients: 'House espresso blend, fresh full-cream milk.',
    allergens: 'Contains milk.',
    calories: 190,
    badge: '',
    featured: false,
    rating: 4.8,
    reviews: 176
  },
  {
    id: 'iced-latte',
    name: 'Iced Vanilla Latte',
    category: 'cold-coffee',
    price: 880,
    image: 'images/iced-latte.jpg',
    short: 'Chilled espresso, cold milk and a swirl of vanilla.',
    description:
      'Bright espresso poured over ice and cold milk, sweetened with our house-made vanilla syrup. Refreshing, smooth and just sweet enough for a warm afternoon in the city.',
    ingredients: 'House espresso blend, milk, vanilla syrup, ice.',
    allergens: 'Contains milk.',
    calories: 165,
    badge: 'Cool Down',
    featured: true,
    rating: 4.8,
    reviews: 154
  },
  {
    id: 'cold-brew',
    name: 'Slow Cold Brew',
    category: 'cold-coffee',
    price: 920,
    image: 'images/cold-brew.jpg',
    short: 'Steeped for 18 hours for a smooth, chocolatey finish.',
    description:
      'Our house blend steeped cold for eighteen hours, producing a naturally sweet, low-acid coffee with deep cocoa notes. Served over a single large ice cube — no milk needed.',
    ingredients: 'Coarse-ground Arabica coffee, filtered water, ice.',
    allergens: 'No known allergens.',
    calories: 15,
    badge: 'Small Batch',
    featured: false,
    rating: 4.7,
    reviews: 98
  },
  {
    id: 'caramel-frappe',
    name: 'Caramel Frappé',
    category: 'cold-coffee',
    price: 1050,
    image: 'images/frappe.jpg',
    short: 'Blended coffee, caramel and cream — a sweet indulgence.',
    description:
      'Espresso blended with milk, ice and buttery caramel, crowned with whipped cream and a ribbon of caramel sauce. Somewhere between a coffee and a dessert — we are not complaining.',
    ingredients: 'Espresso, milk, caramel sauce, whipped cream, ice.',
    allergens: 'Contains milk. May contain traces of nuts.',
    calories: 320,
    badge: '',
    featured: false,
    rating: 4.8,
    reviews: 121
  },
  {
    id: 'ceylon-tea',
    name: 'Ceylon Black Tea',
    category: 'tea',
    price: 450,
    image: 'images/black-tea.jpg',
    short: 'Single-estate Ceylon leaves, brewed to a golden amber.',
    description:
      'A proper cup of Ceylon tea from a single high-grown estate. Bright, brisk and aromatic, served in a clear glass so you can watch the amber colour bloom. Milk and sugar on the side.',
    ingredients: 'Ceylon black tea leaves, filtered water. Milk and sugar served separately.',
    allergens: 'No known allergens.',
    calories: 2,
    badge: 'Sri Lankan',
    featured: false,
    rating: 4.9,
    reviews: 88
  },
  {
    id: 'matcha-latte',
    name: 'Ceremonial Matcha Latte',
    category: 'tea',
    price: 980,
    image: 'images/matcha.jpg',
    short: 'Stone-ground matcha whisked with steamed milk.',
    description:
      'Vibrant ceremonial-grade matcha, whisked to a smooth jade foam and combined with gently steamed milk. Earthy, creamy and naturally energising. Lovely hot or iced.',
    ingredients: 'Ceremonial-grade matcha, fresh milk.',
    allergens: 'Contains milk.',
    calories: 135,
    badge: 'Vegan Option',
    featured: true,
    rating: 4.8,
    reviews: 132
  },
  {
    id: 'spiced-chai',
    name: 'Cinnamon Spiced Chai',
    category: 'tea',
    price: 680,
    image: 'images/chai.jpg',
    short: 'Black tea simmered with cinnamon, cardamom and ginger.',
    description:
      'A comforting house chai, slowly simmered with cinnamon, green cardamom, ginger and a little black pepper, then finished with hot milk and honey. Spiced, warming and made for rainy afternoons.',
    ingredients: 'Black tea, milk, cinnamon, cardamom, ginger, black pepper, honey.',
    allergens: 'Contains milk. Contains honey.',
    calories: 155,
    badge: '',
    featured: false,
    rating: 4.7,
    reviews: 76
  },
  {
    id: 'brownie',
    name: 'Dark Chocolate Brownie',
    category: 'desserts',
    price: 650,
    image: 'images/brownie.jpg',
    short: 'Fudgy centre, crackled top, 70% dark chocolate.',
    description:
      'Baked in-house every morning with 70% dark chocolate and a generous pinch of sea salt. Dense, fudgy and unapologetically rich — best enjoyed warm with a flat white alongside.',
    ingredients: 'Dark chocolate, butter, eggs, sugar, wheat flour, cocoa, sea salt.',
    allergens: 'Contains wheat, eggs, milk. May contain traces of nuts.',
    calories: 310,
    badge: 'Baked Today',
    featured: true,
    rating: 4.9,
    reviews: 214
  },
  {
    id: 'cheesecake',
    name: 'Vanilla Bean Cheesecake',
    category: 'desserts',
    price: 980,
    image: 'images/cheesecake.jpg',
    short: 'Creamy vanilla bean filling on a buttery biscuit base.',
    description:
      'A slow-baked New York-style cheesecake with real vanilla bean, a tangy cream cheese filling and a golden buttery biscuit base. Finished with a spoon of berry compote.',
    ingredients: 'Cream cheese, eggs, sugar, vanilla bean, cream, biscuit base, butter, berry compote.',
    allergens: 'Contains wheat, eggs, milk. May contain traces of nuts.',
    calories: 385,
    badge: '',
    featured: false,
    rating: 4.8,
    reviews: 167
  },
  {
    id: 'tiramisu',
    name: 'Espresso Tiramisu',
    category: 'desserts',
    price: 1050,
    image: 'images/tiramisu.jpg',
    short: 'Mascarpone layers soaked in our house espresso.',
    description:
      'Ladyfingers brushed with fresh espresso, layered with airy mascarpone cream and finished with a dusting of cocoa. Made in small trays each morning and served chilled.',
    ingredients: 'Mascarpone, cream, eggs, sugar, ladyfingers, espresso, cocoa.',
    allergens: 'Contains wheat, eggs, milk.',
    calories: 365,
    badge: 'Chef\'s Pick',
    featured: false,
    rating: 4.9,
    reviews: 143
  },
  {
    id: 'chocolate-cake',
    name: 'Chocolate Fudge Cake',
    category: 'cakes',
    price: 890,
    image: 'images/chocolate-cake.jpg',
    short: 'Three layers of moist cocoa sponge and silky fudge.',
    description:
      'Three layers of dark cocoa sponge sandwiched with silky chocolate fudge and finished with a glossy ganache. A proper celebration slice, baked fresh in our kitchen.',
    ingredients: 'Wheat flour, cocoa, sugar, eggs, butter, cream, dark chocolate.',
    allergens: 'Contains wheat, eggs, milk.',
    calories: 420,
    badge: 'Bestseller',
    featured: true,
    rating: 4.9,
    reviews: 231
  },
  {
    id: 'red-velvet',
    name: 'Red Velvet Slice',
    category: 'cakes',
    price: 920,
    image: 'images/red-velvet.jpg',
    short: 'Velvety cocoa sponge with cream cheese frosting.',
    description:
      'A tender red velvet sponge with a hint of cocoa, layered generously with tangy cream cheese frosting. Striking on the plate and even better with a cup of black tea.',
    ingredients: 'Wheat flour, cocoa, buttermilk, eggs, sugar, cream cheese, butter.',
    allergens: 'Contains wheat, eggs, milk.',
    calories: 405,
    badge: '',
    featured: false,
    rating: 4.8,
    reviews: 156
  },
  {
    id: 'carrot-cake',
    name: 'Walnut Carrot Cake',
    category: 'cakes',
    price: 850,
    image: 'images/carrot-cake.jpg',
    short: 'Spiced carrot sponge, walnuts and cream cheese icing.',
    description:
      'A warmly spiced carrot sponge with toasted walnuts, sultanas and a generous layer of cream cheese icing. Rustic, moist and quietly our staff favourite.',
    ingredients: 'Wheat flour, carrot, walnuts, sultanas, eggs, cinnamon, cream cheese, sugar.',
    allergens: 'Contains wheat, eggs, milk, walnuts.',
    calories: 390,
    badge: '',
    featured: false,
    rating: 4.7,
    reviews: 94
  },
  {
    id: 'croissant',
    name: 'Butter Croissant',
    category: 'snacks',
    price: 550,
    image: 'images/croissant.jpg',
    short: 'Flaky, golden layers made with French butter.',
    description:
      'Laminated by hand over three days with French cultured butter, then baked until shatteringly crisp. Pull one apart while it is still warm — that is the whole point.',
    ingredients: 'Wheat flour, French butter, milk, sugar, yeast, salt.',
    allergens: 'Contains wheat, milk. May contain traces of nuts.',
    calories: 270,
    badge: 'Freshly Baked',
    featured: true,
    rating: 4.8,
    reviews: 189
  },
  {
    id: 'avocado-toast',
    name: 'Smashed Avocado Toast',
    category: 'snacks',
    price: 1150,
    image: 'images/avocado-toast.jpg',
    short: 'Sourdough, smashed avocado, chilli and lime.',
    description:
      'Toasted sourdough piled with smashed avocado, chilli flakes, lime, radish and a scatter of toasted seeds. A bright, generous brunch plate that goes beautifully with a cold brew.',
    ingredients: 'Sourdough, avocado, lime, chilli, radish, mixed seeds, olive oil, sea salt.',
    allergens: 'Contains wheat. May contain traces of sesame.',
    calories: 340,
    badge: 'Brunch',
    featured: false,
    rating: 4.7,
    reviews: 112
  },
  {
    id: 'chicken-sandwich',
    name: 'Chicken & Pesto Sandwich',
    category: 'snacks',
    price: 1350,
    image: 'images/sandwich.jpg',
    short: 'Roast chicken, basil pesto and greens on sourdough.',
    description:
      'Roast chicken breast layered with basil pesto, vine tomato, rocket and a little lemon mayo on toasted sourdough. Pressed hot, wrapped and ready to take away.',
    ingredients: 'Sourdough, chicken breast, basil pesto, tomato, rocket, lemon mayo.',
    allergens: 'Contains wheat, eggs, milk. Pesto contains nuts.',
    calories: 470,
    badge: '',
    featured: false,
    rating: 4.8,
    reviews: 103
  }
];

const COCO_TESTIMONIALS = [
  {
    name: 'Nethmi Perera',
    role: 'Regular since 2023',
    initials: 'NP',
    quote:
      'The cappuccino is easily the best in the city, and the little window seat by the plants has become my favourite place to work on a Sunday.',
    rating: 5
  },
  {
    name: 'Dinuka Fernando',
    role: 'Coffee enthusiast',
    initials: 'DF',
    quote:
      'You can tell they care about the beans here. The cold brew is smooth, never bitter, and the brownies are dangerously good.',
    rating: 5
  },
  {
    name: 'Sarah Jayasinghe',
    role: 'Neighbour & cake lover',
    initials: 'SJ',
    quote:
      'We ordered the chocolate fudge cake for my mother\'s birthday and it disappeared in minutes. Warm service, beautiful space, zero fuss.',
    rating: 5
  }
];

/* Classic scripts do not attach top-level consts to window, so the
   catalogue is exposed explicitly for main.js and the page scripts. */
window.COCO_CATEGORIES = COCO_CATEGORIES;
window.COCO_PRODUCTS = COCO_PRODUCTS;
window.COCO_TESTIMONIALS = COCO_TESTIMONIALS;
