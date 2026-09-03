# SproutVest — Frontend

Next.js frontend for SproutVest (fractional land investment). Talks to a
separate Laravel API for auth, KYC, wallet, marketplace, and land data, and
to a Laravel Reverb server for real-time notifications and admin live chat.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4**
- **axios** for API calls, with a shared instance (`utils/api.js`) that
  auto-attaches the auth token and handles silent token refresh on 401
- **Laravel Echo + Pusher.js**, pointed at a Reverb broadcaster, for
  real-time notifications and the admin live-chat panel
- **Leaflet / react-leaflet** for the interactive land maps
- **Tiptap** for rich-text editing (blog/notes)

CI is configured (see `.github/workflows/ci.yml`), including lint, typecheck,
test, and build jobs. Tests use **Vitest** (`npm test`), currently covering
the auth-guarding middleware (`proxy.ts`) and its supporting pure-logic
helpers (`utils/routes.ts`, `utils/tokenStore.ts`).

## Getting started

```bash
npm install
cp .env.example .env.local   # see below — fill in the real values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build`, `npm run start` (production server), `npm run lint`, `npm run typecheck`, `npm test` (`npm run test:watch` for watch mode).

## Environment variables

All client-exposed vars are prefixed `NEXT_PUBLIC_` (Next.js requirement —
anything without that prefix is server-only and won't reach the browser).
A `.env.example` is committed at the repo root — copy it to `.env.local`
to get started. These are the vars the app actually reads from
`process.env`:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the Laravel API (e.g. `https://api.sproutvest.com` or `http://localhost:8000/api`). Used by `utils/api.js` for all requests, including `/login`, `/me`, `/refresh`, `/logout`. |
| `NEXT_PUBLIC_APP_NAME` | No | Display name used in a few UI strings / metadata. |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of this frontend, used for absolute links (e.g. referral links, sitemap). |
| `NEXT_PUBLIC_JWT_TTL_MINUTES` | No (default `1440`) | How long the `auth_token`/`user_role` cookies are set to live client-side. Should match (or be ≤) the actual JWT expiry issued by the API — see [Auth flow](#auth-flow). |
| `NEXT_PUBLIC_R2_URL` | No | Base URL for R2/CDN-hosted images (land photos, blog covers). Used by `utils/images.js`. |
| `NEXT_PUBLIC_PUSHER_KEY` | Yes, for real-time features | Pusher-protocol key for the Reverb broadcaster (admin live chat, notifications). |
| `NEXT_PUBLIC_REVERB_HOST` | Yes, for real-time features | Reverb server host (scheme is stripped automatically if included). |
| `NEXT_PUBLIC_REVERB_PORT` | Yes, for real-time features | Reverb server port. |
| `NEXT_PUBLIC_REVERB_SCHEME` | Yes, for real-time features | `http` or `https` — determines `forceTLS` for the websocket connection. |

## Auth flow

- On login (`context/AuthContext.jsx`), the API sets `auth_token` and
  `user_role` as **httpOnly** cookies directly via `Set-Cookie` — the
  frontend never sees the JWT itself. It also sets a small non-sensitive
  `is_authed` cookie (readable by JS) so the client can know a session
  exists without touching anything sensitive. `utils/tokenStore.js` has the
  full backend contract this depends on (also required on `/refresh` and
  `/logout`).
- `utils/api.js`'s axios instance uses `withCredentials: true`, so the
  httpOnly cookie is sent automatically on every request — there's no
  `Authorization` header to attach client-side anymore.
- `proxy.js` (Next.js middleware) reads `auth_token`/`user_role` server-side
  via `request.cookies`, which works the same whether or not the cookie is
  httpOnly — middleware isn't subject to the same-JS-context restriction.
  Protected routes redirect to `/login` if there's no token, `/admin/*`
  redirects to `/dashboard` if the role isn't `admin`, and logged-in users
  hitting `/`, `/login`, or `/register` get bounced to `/dashboard`. The
  canonical list of public routes lives in `utils/routes.js`.
- `utils/api.js` has a response interceptor: any `401` triggers a call to
  `/refresh` (cookie auto-attached, no token to read), and the original
  request is retried — the browser attaches the rotated cookie
  automatically. Concurrent requests queue behind a single in-flight
  refresh. A proactive refresh is also scheduled ~5 minutes before the
  session's `expires_at` (returned by the API in the `/login`, `/refresh`,
  and `/me` response bodies, since the JWT itself can no longer be decoded
  client-side) — see `AuthContext`'s `scheduleProactiveRefresh`.
- Real-time features (admin live chat, notifications) authenticate their
  broadcasting channel subscriptions the same way — via a `withCredentials`
  request to `/broadcasting/auth` (see the `authorizer` functions in
  `app/admin/live-chat/page.jsx` and `app/support/LiveChatView.jsx`) rather
  than a manually-attached Bearer header.

## Project structure

```
app/            Route segments (App Router) — one folder per top-level route
app/components/ Shared UI components (Button, cards, widgets, etc.)
context/        React context providers (AuthContext)
services/       API call groupings for specific domains (lands, notifications, support)
utils/          Cross-cutting helpers (api client, auth cookies, routes, image compression, etc.)
proxy.js        Next.js middleware — route protection / redirects
```

Only `services/landService.js`, `notificationService.js`, and
`supportService.js` exist so far; most other domains (wallet, marketplace,
KYC, admin) call the API directly from their page components rather than
through a service layer.