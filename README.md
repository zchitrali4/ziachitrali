# Zia Chitrali

Islamic educational content and discovery platform. The API lives in `server` and the public site lives in `client`.

## Run locally

1. Copy `server/.env.example` to `server/.env`. Database access is off while `DB_ENABLED=false`, so the interface can be reviewed before MongoDB is connected.
2. When you are ready for live data, start MongoDB (`docker compose up -d`) and set `DB_ENABLED=true`.
3. Install and seed:

```bash
npm install --prefix server
npm run seed
npm install --prefix client
```

4. Start the API and the site in two terminals:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

The site is at http://localhost:5173 and the API is at http://localhost:5000.

The seed creates roles, navigation, site settings, and one admin account. It does not create articles, products, or donations. Empty sections stay empty until records are published in the admin area.

## Deploy on Render

`render.yaml` builds the site and the API into one web service. The browser uses the same address for pages and `/api`, so the sign-in cookie stays on that host.

1. In Atlas, allow network access from anywhere (`0.0.0.0/0`). Render does not have a fixed IP.
2. In Render, create a Blueprint from this repository, or a Web Service with the build and start commands in `render.yaml`.
3. Set `MONGODB_URI`, `ADMIN_EMAIL`, and a long `ADMIN_PASSWORD`. Render generates `JWT_ACCESS_SECRET`. Leave `PUBLIC_SITE_URL` empty unless the site lives on another domain; Render fills it from the service URL.
4. After the first successful deploy, open the Render shell and run `npm run seed --prefix server` once. That creates the member role the signup form needs, plus the admin account.
5. For password reset and email verification, set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`. Without those, new accounts can still sign in. The verification email is simply not sent.
6. If the public site is hosted somewhere else, set `PUBLIC_SITE_URL`, `PUBLIC_API_URL`, and `CORS_ORIGIN` to those exact `https` origins, and set `VITE_API_URL` to `https://your-api.onrender.com/api` before the client build.

Uploaded images are stored on the service disk and disappear when Render restarts or redeploys. Orders and gifts stay `pending_payment` until PayFast credentials are set and a signed callback confirms them.

Default admin, unless you change `.env`:

- Email: `admin@ieds.local`
- Password: `ChangeMe123!`

## Payments and media

Orders and donations are saved as `pending_payment`. No payment provider is connected, and the interface does not mark them paid. Product prices on checkout come from the database. Media records store a URL and description; file upload storage is not included yet.
