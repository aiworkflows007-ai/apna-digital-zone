# Apna Digital Zone — Project Files

Client: **Apna Digital Zone**, Mahadev Market, Vishnu Nagar, Arrah, Bihar 802302
Contact: +91 93864 15795 · apanadigitalzone@gmail.com

---

## What's in this folder

| File / folder | What it is |
|---|---|
| `Apna-Digital-Zone-Proposal.pptx` | 10-slide pitch deck — site audit, competitor benchmark, mockups, roadmap, ROI |
| `website/index.html` | The new website. Double-click to open |
| `app/index.html` | The customer booking app (PWA). Double-click to open |
| `app/manifest.json`, `app/sw.js`, `app/icon-*.png` | Support files that make the app installable on phones |

---

## For the pitch meeting

1. Open `Apna-Digital-Zone-Proposal.pptx` — walk through the audit and the plan.
2. Open `website/index.html` — show the live animated site next to their current one.
3. Open `app/index.html` — resize the browser narrow, or open it on a phone, and run a full booking.

Keep both browser tabs open before the meeting starts so images are already cached.

**Note:** photos load from the client's live server, so an internet connection is needed. On the real build these get copied onto the new hosting.

---

## To put the app on phones (installable)

Upload the **entire `app/` folder** to any web host over HTTPS — for example `apnadigitalzone.com/app/`.

Once it's live:

- **Android (Chrome):** open the link → menu → *Add to Home screen* → *Install*
- **iPhone (Safari):** open the link → Share → *Add to Home Screen*

It then opens full-screen with its own icon, exactly like a Play Store app, and works offline.

All five files must sit in the same folder. Opening `app/index.html` by double-click works fine as a demo, but install only becomes available once it's hosted on `https://`.

---

## Website — what changed from the old site

- Animated cinematic hero: 5-photo slideshow, film grain, text reveal, count-up stats, parallax
- All 12 services with their real photos and rewritten, human copy (old site's text was unedited AI output with typos)
- Real team section — all 10 members from their about page
- 3 wedding packages with clear pricing (Silver / Gold / Platinum)
- YouTube showreel, testimonials, portfolio gallery
- Booking form that sends a formatted enquiry straight to their WhatsApp
- Fully responsive, Google Maps embed, floating WhatsApp button

## App — what it does

Home · Services (12) · Packages · Live availability calendar · Details · Review with GST + 25% advance · Payment methods · Confirmation · My Bookings · 6-stage order tracker · Our Team · Account

Bookings are saved on the device, so they persist between visits.

---

## Pricing shown in the demo

Silver ₹34,999 · Gold ₹74,999 · Diamond ₹99,999 · Platinum ₹1,74,999 · other shoots from ₹8,999
GST 18%, advance 25%.

**These are placeholder figures.** Confirm the client's real rates before the meeting and they can be changed in minutes.

---

## Still to build

- Admin / ads dashboard (orders, leads, calendar, campaigns, staff assignment)
- Real payment gateway (Razorpay or PhonePe)
- Backend so bookings reach the studio instead of only the device
- Migrating their actual photos and albums onto the new site
