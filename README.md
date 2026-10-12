# Micah Angela showcase site (sample)

A showcase site for a family linen and hospitality supply business: no cart and no checkout. Visitors build an **inquiry list** and send it by email, Messenger or Viber.

Version 2 (2026-10-11) is a modern, flat redesign: white and mist surfaces, ink text, one cobalt accent, mint for hospitals, no gradients. Type is Bricolage Grotesque (headlines), Geist (text) and Geist Mono (labels and specs). The first version, styled after lifestylebycanadian.com, is saved in `.share/v1-snapshot`.

The site shows the name "Micah Angela" for now. Every product, spec, photo and contact detail is sample content.

## Run it on your computer

```bash
python serve.py
```

Then open http://localhost:8140. Stop it with Ctrl+C.

`serve.py` is a tiny static server that turns caching off, so a refresh always shows your latest edits. It only serves `index.html` and the `assets` folder, so the README, source files and `node_modules` stay private. Opening `index.html` directly also works, but the inquiry list and some browser features behave better over `http://localhost`.

## Send a temporary link (no Vercel)

```bash
powershell -ExecutionPolicy Bypass -File share.ps1
```

This starts a copy of the site on port 8150 plus a free Cloudflare quick tunnel (`cloudflared.exe` from the parent folder), then prints a public `https://....trycloudflare.com` link you can send. The link keeps working while this computer is on, awake and online, even after you close Claude. Each start makes a new link. The current link is saved in `.share/link.txt`.

Stop sharing:

```bash
powershell -ExecutionPolicy Bypass -File share.ps1 -Stop
```

## Edit the styles (Tailwind CSS)

The compiled CSS is already in `assets/css/styles.css`, so the site works without any build step. To change styles:

```bash
npm install
npm run watch
```

Edit `src/input.css` (colors, fonts and components live in the `@theme` and `@layer components` blocks) or the Tailwind classes in `index.html`. `npm run build` makes a minified copy.

## Edit products and categories

Everything in the catalog comes from `assets/js/catalog.js`:

- `LINENS`: the linen products (name, group, photo, one-line spec, description, detail table)
- `CATEGORIES`: the "Beyond linens" categories and the example items inside each
- `FACILITIES`: the three "Who we supply" tiles (`short` is the tile caption)
- `PHOTOS` / `PHOTO_BACKUPS`: one photo per slot. Swap the Unsplash links for your own photos, e.g. `'assets/img/patient-gowns.jpg'`
- `BRAND`: email, phone, Messenger and Viber links used by the inquiry form

## Replace before going live

- [ ] Final business name and logo (search for `Micah Angela` in `index.html` and `assets/js/catalog.js`)
- [ ] Real product names, fabrics, sizes and colors in `catalog.js`
- [ ] Your own product photos (the Unsplash photos are placeholders)
- [ ] Phone, email and address in `index.html` and `BRAND` in `catalog.js`
- [ ] Messenger and Viber links in `BRAND`
- [ ] Facebook and Instagram links in the footer
- [ ] "About" text, in your own words
- [ ] Remove the footer note ("Sample design, not live yet") and "Sample specs" in `assets/js/main.js`

## What's inside

| File | What it does |
| --- | --- |
| `index.html` | The page: header, hero, ribbon, who we supply, linen catalog, hospital bed, beyond linens, how it works, about, inquiry form, footer |
| `assets/js/cloth.js` | The hero linen: a hanging sheet of woven threads with real physics. It drops onto its rod, sways in a breeze, and can be pushed or grabbed and pulled. Holds still for visitors who turn off motion |
| `assets/js/motion.js` | Smooth scrolling (Lenis) and GSAP scroll motion: headline reveals, the speeding ribbon, the pinned hospital bed, the cursor photo on Beyond linens, magnetic buttons |
| `assets/js/main.js` | Catalog rendering, animated filter tabs, detail panels, inquiry list (saved in the visitor's browser), form checks |
| `assets/js/catalog.js` | All catalog content |
| `assets/vendor/` | GSAP 3.13 (ScrollTrigger, SplitText, Flip) and Lenis 1.3.4, copied from npm so the site works offline |
| `src/input.css` | Tailwind v4 source with the design tokens |
| `serve.py` | Local preview server (page and assets only) |
| `share.ps1` | Starts or stops the temporary public link |

## Photo credits

Placeholder photos come from Unsplash under the free Unsplash License, hotlinked from images.unsplash.com: Adhy Savala, Adam Winger, Karaz Pro, Hush Naidoo Jade Photography, Martha Dominguez de Gouveia, Alexander Grey, Nappy, Annie Spratt, Jordan Bigelow, Arseny Togulev, Priscilla Du Preez, Masaaki Komori, Andrew Neel, Slaapwijsheid.nl, engin akyurt, Suzanne Rushton, Ryan Waldman, Hannah Busing, Robert Mathews, fabio guntur, Camille Brodard, Point3D Commercial Imaging Ltd., Saile Ilyas, Lotus Design N Print, Christian Lambert, Ginwestern Photography, benjamin lehman, Matthew, Ethan Bodnar, Michael D Beckwith and Mel Poole. Replace them with your own product photos before launch.

## Putting it online

It's a static site, so Vercel, Netlify, Cloudflare Pages or GitHub Pages can host it as is. Wix doesn't host hand-written HTML sites; to use Wix, rebuild this layout in the Wix editor with this page as the design reference.
