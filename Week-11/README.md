# Coco Lane Cafe

A complete, responsive cafe website built with **HTML5, CSS3 and vanilla JavaScript**. It runs entirely in the browser and uses **LocalStorage** for the menu, accounts, cart, orders and contact messages. Orders are finalised through **WhatsApp** — there is no backend, database or payment processor.

## Run it

Just open `index.html` in a modern browser, or serve the folder locally (recommended so LocalStorage always has a stable origin):

```bash
# Python 3
python -m http.server 8080

# or with Node installed
npx serve .
```

Then visit `http://localhost:8080`.

No build step, dependencies or installation are required.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home page with hero, categories, featured menu, story, testimonials and contact strip |
| `menu.html` | Full menu with category filters, search, sorting and add-to-cart |
| `product.html` | Product detail page (`product.html?id=espresso`) |
| `about.html` | Cafe story, values and gallery |
| `contact.html` | Contact details, opening hours, form, WhatsApp and map link |
| `login.html` | Customer sign in |
| `register.html` | Customer account creation |
| `cart.html` | Cart with quantities, totals and empty state |
| `checkout.html` | Delivery/pickup checkout and WhatsApp order hand-off |
| `orders.html` | Customer profile and local order history |
| `admin.html` | Cafe dashboard: products, orders, messages and settings |

## Sample accounts

**Customer**
- Email: `demo@cocolanecafe.example`
- Password: `demo1234`

This account is recreated automatically when needed, and appears as “Sample account” on the sign-in page. New accounts can be registered normally.

**Admin**
- URL: `admin.html`
- Email: `admin@cocolanecafe.example`
- Password: `coco1234`

The admin login is a front-end gate only, not real authentication. See the security note below.

## WhatsApp configuration

The order button opens a pre-filled `wa.me` message. The checked-in number is a **placeholder**: `94770000000`.

Change it in either place:

1. **Admin → Settings → WhatsApp order number** (recommended; stored in LocalStorage), or
2. `js/main.js` → `CONFIG.whatsappNumber`.

Use international format without `+`, spaces or dashes, for example `94771234567`. Replace the placeholder before publishing. No real cafe number is invented in this project.

Delivery is LKR 350, free over LKR 5,000. Pickup has no fee. These values live in `CONFIG` in `js/main.js`.

## Data and LocalStorage

All state is saved under keys beginning with `cocoLane`:

- `cocoLaneProducts` — editable menu catalogue
- `cocoLaneCart` — current cart
- `cocoLaneUsers` — customer accounts
- `cocoLaneSession` — signed-in customer
- `cocoLaneOrders` — orders placed in this browser
- `cocoLaneMessages` — contact form messages
- `cocoLaneSettings` — admin WhatsApp/cafe settings
- `cocoLaneAdminSession` — admin session
- `cocoLaneTheme` — light/dark preference

Because this is a frontend-only project:

- Data belongs to one browser and one device. It is not shared between devices or users.
- Clearing site data removes accounts, orders and messages.
- Passwords are hashed with SHA-256 for presentation, but LocalStorage is **not secure**. Do not reuse a real password.
- Admin protection is cosmetic. Anyone with access to the browser can inspect or change the data.
- Contact messages and orders are not automatically emailed to the cafe; orders must be sent through WhatsApp.

Use **Admin → Settings → Demo data tools** to export a JSON copy, restore the sample menu or reset local data.

## Project structure

```
Coco-Lane-Cafe/
├── index.html … orders.html
├── admin.html
├── css/
│   ├── theme.css        colour tokens, light/dark themes
│   ├── style.css        components and page styles
│   └── responsive.css   breakpoints and mobile layout
├── js/
│   ├── theme.js         theme persistence
│   ├── data.js          seed catalogue and testimonials
│   ├── main.js          shared storage, cart, orders and UI helpers
│   ├── home.js          home page rendering
│   ├── menu.js          search, filters and sorting
│   ├── product.js       product detail
│   ├── cart.js          cart page
│   ├── auth.js          login, register, profile and order history
│   ├── checkout.js      checkout validation and WhatsApp order
│   ├── contact.js       contact form and opening hours
│   └── admin.js         admin dashboard
├── images/              23 local Unsplash photographs
├── favicon.svg
└── README.md
```

## Customisation

- **Colours and typography:** `css/theme.css`
- **Cafe name, phone, address, delivery fee and WhatsApp number:** `CONFIG` in `js/main.js`
- **Menu items:** `js/data.js` for the seed menu, or the admin product editor
- **Testimonials:** `COCO_TESTIMONIALS` in `js/data.js`
- **Images:** replace files in `images/` and update the paths in `js/data.js`

## Accessibility and responsiveness

The site includes skip links, labelled form fields, keyboard-friendly controls, focus styles, meaningful image alt text, ARIA live regions for feedback, reduced-motion support and layouts tested from 320 px upwards. All customer pages avoid horizontal scrolling.

## Image credits

Photography is sourced from [Unsplash](https://unsplash.com) and stored locally. Unsplash photos are free to use under the [Unsplash License](https://unsplash.com/license). Photo IDs used:

`photo-1501339847302-ac426a4a7cbb`, `photo-1442512595331-e89e73853f31`, `photo-1554118811-1e0d58224f24`, `photo-1447933601403-0c6688de566e`, `photo-1453614512568-c4024d13c247`, `photo-1510707577719-ae7c14805e3a`, `photo-1572442388796-11668a67e53d`, `photo-1461023058943-07fcbe16d735`, `photo-1517701604599-bb29b565090c`, `photo-1558122104-355edad709f6`, `photo-1572490122747-3968b75cc699`, `photo-1544787219-7f47ccb76574`, `photo-1515823064-d6e0c04616a7`, `photo-1571934811356-5cc061b6821f`, `photo-1606313564200-e75d5e30476c`, `photo-1533134242443-d4fd215305ad`, `photo-1571877227200-a0d98ea607e9`, `photo-1578985545062-69928b1d9587`, `photo-1616541823729-00fe0aacd32c`, `photo-1621303837174-89787a7d4729`, `photo-1555507036-ab1f4038808a`, `photo-1541519227354-08fa5d50c44d`, `photo-1528735602780-2552fd46c7af`.

## Licence

Use and adapt the project freely for personal or commercial cafe sites. Replace placeholder contact details, the WhatsApp number and all sample content before going live.
