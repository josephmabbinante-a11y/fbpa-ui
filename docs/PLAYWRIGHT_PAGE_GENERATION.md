# Playwright Page Generation

This repository can be visually smoke-tested by generating page captures with Playwright while the Vite dev server is running.

## Routes captured in the latest run

- `/login` → submit valid credentials (mocked API) and verify redirect to `/dashboard`
- `/loads`
- `/carriers`
- `/invoices`
- `/rate-logic-tool`

## Browser state used

After successful login, the app stores:

- `accessToken` in `localStorage`/`sessionStorage`
- legacy `token` in `localStorage` for compatibility

This enables authenticated route access for visual checks.
