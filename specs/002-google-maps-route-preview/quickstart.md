# Quickstart Validation

1. Copy `.env.example` to `.env.local` and set a Maps Embed API-only browser key.
2. Restart `npm run dev` after changing the environment file.
3. Add one place to a day and confirm a `place` preview appears.
4. Add a second place and confirm the preview becomes a directions route in Markdown order.
5. Confirm the external Google Maps route link remains available.
6. Remove the key, restart Vite, and confirm only the setup hint and route link appear.
