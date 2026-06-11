# Her House Pilates Studio

Static marketing site for **Her House**, a luxury women's wellness club and reformer Pilates studio in Vera, Tbilisi.

Live roadmap & brand spec: [`her-house-website-booking-mvp-roadmap.md`](./her-house-website-booking-mvp-roadmap.md).

## Stack

- Plain HTML / CSS / vanilla JavaScript — no build step required.
- 9 pages, one shared stylesheet, one script.
- WebP images for performance.
- Schema.org `LocalBusiness` + `FAQPage` structured data.
- Mobile-first, accessible, SEO-ready.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Home — hero, brand intro, experience grid, schedule preview, prices, FAQ, contact, final CTA |
| `/schedule/` | Class schedule with live booking modal |
| `/book/` | Same schedule, primary booking entry point |
| `/prices/` | First class, single class, class packs |
| `/new-here/` | FAQ for first-timers |
| `/about/` | Story, feeling, community, studio, founder placeholder |
| `/contact/` | Address, hours, WhatsApp, Instagram, directions |
| `/reformer-pilates-tbilisi/` | SEO landing page |
| `/pilates-vera-tbilisi/` | SEO landing page |
| `/404.html` | Graceful 404 |

## Run locally

```bash
# Any static file server works. Python is built in.
python3 -m http.server 8000
# Open http://localhost:8000
```

## Booking — current state

The booking form works **client-side only**:

- Validates 24h minimum + 7-day maximum booking window
- Tracks capacity per class
- Prevents duplicate bookings per WhatsApp number
- Persists in `sessionStorage` (per-tab, not shared across tabs)
- After submit, opens a pre-filled WhatsApp message to the studio (stopgap until real backend is wired)

The studio does **not** see the booking automatically — they only see it if the client sends the WhatsApp message. A real backend is the next milestone; see roadmap Step 4-6.

## Placeholders to replace

These are intentional until the owner confirms the real values:

| What | Placeholder | Where |
| --- | --- | --- |
| WhatsApp | `+995 555 12 34 56` | `script.js`, all `wa.me` links, footer |
| Address | `9 Zakaria Paliashvili St., Vera, Tbilisi` | Schema, contact page, footer |
| Hours | Mon-Fri 07:00-21:00, Sat 09:00-18:00 | Schema, contact page |
| Prices | "Intro Offer" / "Message Us" | Home, prices page |
| Class schedule | 5 hardcoded classes | `script.js` |
| Cancellation policy | "Final policy will be confirmed" | New-here page |
| Domain | `https://example.com` | sitemap, robots, canonical, schema, OG |

## Deployment

No build step. Drop the folder onto any static host: Vercel, Cloudflare Pages, Netlify, GitHub Pages, Hostinger, etc.

**Pre-launch checklist (roadmap Step 10):**

- [ ] Replace `example.com` everywhere with the real domain
- [ ] Replace placeholder WhatsApp / address / hours / schedule / prices
- [ ] Add real studio photos (4 WebP placeholders ship in `assets/webp/`)
- [ ] Add legal pages (privacy, terms, cancellation, health disclaimer)
- [ ] Wire analytics (Meta Pixel, Google Analytics/Search Console)
- [ ] Submit sitemap to Google Search Console
- [ ] Set up Google Business Profile and link to the site
- [ ] Test the Instagram ad landing page flow

## Design system

Colors, typography, spacing, button styles — all defined as CSS custom properties at the top of `styles.css`. To re-theme, edit the `:root` block.

## Performance

- WebP images (~80-125 KB each, down from 1.8-2.2 MB PNGs)
- `loading="lazy"` on below-fold images, `loading="eager" fetchpriority="high"` on hero
- `width`/`height` set on every `<img>` to prevent layout shift
- No third-party JS, no tracking scripts (until owner adds them)
- Self-hosted fonts via Google Fonts with `preconnect`
