# Trailpack Ledger

Weigh a hiking gear list, check off packed items and track your weight budget in the browser.

## Plan a hike

Use **New hike** for a blank list or **Duplicate** to reuse gear and budget with the packing checklist cleared. Switch between named hikes above the gear list. Use **Edit** beside a gear item to change its weight, category or quantity while keeping its packing state. The load panel shows which categories contribute the most weight. Changes are stored in this browser. Your previous single-pack list appears under **Day hike**.

## Run locally

Use Node.js 22 or newer to run `node scripts/verify.mjs`. To launch a local preview, run `python3 -m http.server 8080 --bind 127.0.0.1 --directory public` and open http://127.0.0.1:8080.

## Deployment

Vercel serves `public/` directly. The application uses browser platform APIs and ships with no package dependencies.

## Git dates

The initial commits use retrospective author dates from October–November 2026. Their committer timestamps record when this repository was assembled.
