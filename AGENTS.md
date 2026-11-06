# Trailpack Ledger

The static site lives in `public/`. Keep domain calculations in `public/model.js` and browser interaction in `public/app.js`. Node.js 22+ runs the tests under `test/`.

Run `node scripts/verify.mjs` from the project root for unit tests, JavaScript syntax, local asset links, secret scanning and the 600-line limit. Keep dependencies local and preserve keyboard and small-screen behavior. For a local browser preview run `python3 -m http.server 8080 --bind 127.0.0.1 --directory public`. Vercel publishes `public/` without an installation or build step.
