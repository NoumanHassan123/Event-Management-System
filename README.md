<p align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="Gather ticket logo" />
</p>

<h1 align="center">Gather</h1>

<p align="center"><strong>Discover experiences. Make plans. Collect memories.</strong></p>

<p align="center">
  <a href="#features">Features</a> &nbsp; / &nbsp;
  <a href="#quick-start">Quick start</a> &nbsp; / &nbsp;
  <a href="#architecture">Architecture</a> &nbsp; / &nbsp;
  <a href="#testing">Testing</a>
</p>

Gather is an event discovery and registration application built with React and Redux Toolkit. Explore live Ticketmaster listings, filter experiences by your interests and location, and keep your personal event lineup in one place.

The interface pairs warm ivory backgrounds with navy and coral accents, ticket-inspired artwork, responsive cards, and subtle motion. Icons and illustrations are built with local SVG and CSS; no external fonts or animation libraries are needed.

## Features

| Area | What you can do |
| --- | --- |
| **Discover** | Browse upcoming events with images, dates, categories, venues, and locations. |
| **Search and filter** | Combine keywords, category, city, and two-letter country codes. Clear filters to start over. |
| **Explore details** | Open a dedicated event page with its schedule, venue, category, status, description, and provider notes when available. |
| **Browse more** | Move through 20 results per page with Previous/Next controls while keeping your filters. |
| **Manage accounts** | Create an account, log in, log out, and restore your session after refreshing. |
| **Build your lineup** | Register for events, prevent duplicate registrations, and cancel eligible registrations. |
| **Stay organized** | View your own upcoming, completed, and date-to-be-announced events in My Registrations. |
| **Enjoy the details** | Reveal/hide passwords, use keyboard navigation, and pause decorative hero animations. Reduced-motion preferences are respected. |

Gather includes loading, empty, retry, missing-event, and validation states. New search results take precedence over older responses, and retries retain the selected filters and page.

## Tech stack

| Layer | Technology |
| --- | --- |
| Interface | React 19, JavaScript, CSS, inline SVG |
| Shared state | Redux Toolkit 2, React Redux 9 |
| Navigation | React Router 7 |
| Event data | Ticketmaster Discovery API v2 |
| Local persistence | Browser Local Storage |
| Password hashing | Web Crypto: salted PBKDF2 with SHA-256 |
| Development and build | Vite 8 |
| Code checks | Oxlint |
| Automated tests | Node.js built-in test runner |

## Quick start

### Prerequisites

- Node.js **22.12+ or 24+** and npm.
- A Ticketmaster developer account and Consumer Key (API key).
- A modern browser with Local Storage and Web Crypto enabled.

### 1. Get the project

```sh
git clone https://github.com/NoumanHassan123/Event-Management-System.git
cd Event-Management-System
npm ci
```

### 2. Configure event data

Copy the environment template into a local `.env` file:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
```

Get your Consumer Key from the [Ticketmaster Developer Portal](https://developer.ticketmaster.com/) and set it in `.env`:

```dotenv
VITE_TICKETMASTER_API_KEY=your_ticketmaster_consumer_key
```

`.env` is excluded from Git. Keep real credentials out of commits and screenshots.

### 3. Start the application

```sh
npm run dev
```

Open the local URL printed in your terminal. Restart the development server whenever you change `.env`.

**PowerShell tip:** if script execution blocks `npm.ps1`, use `npm.cmd` in place of `npm`, for example `npm.cmd run dev`.

### 4. Try the flow

1. Search for an event. For example, select **Music**, enter **London**, and use **GB** as the country code.
2. Open an event and choose to register.
3. Create a browser-local account using a valid Gmail address, or log in. You will return to the event you opened.
4. Register, visit **My Registrations**, and refresh to check persistence.
5. Cancel an upcoming registration or explore another event.

## Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the dependency versions recorded in the lockfile. |
| `npm run dev` | Start the development server. |
| `npm run build` | Generate a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run Oxlint. |
| `npm test` | Run the automated test suite. |

## Architecture

```text
src/
  components/                Reusable navigation, cards, forms, and controls
  features/
    auth/                    Account and session state
    events/                  Listings, filters, pagination, and event details
    registrations/           Per-user registrations and cancellation
  pages/                     Route-level views and their styles
  services/                  Storage, authentication, Ticketmaster, and tests
  store/                     Redux store configuration
  utils/                     Validation, formatting, and schedule helpers
  App.jsx                    Application routes and shared layout
  main.jsx                   React, Redux Provider, and BrowserRouter setup
```

Pages dispatch Redux actions; services handle API requests, browser storage, and password hashing. The store separates authentication, event data, and registrations. Shared helpers keep validation and schedule behavior consistent across the interface and service layer.

For a feature-to-source map, see [Implementation reference](REQUIREMENTS.md).

### Routes

| Path | View | Access |
| --- | --- | --- |
| `/` | Redirect to event discovery | Public |
| `/events` | Discovery, search, filters, and pagination | Public |
| `/events/:id` | Event details and registration controls | Public; registration requires login |
| `/register` | Account creation | Signed-out users |
| `/login` | Login and return to the requested destination | Signed-out users |
| `/my-events` | Personal registrations | Requires login |
| Any unmatched path | Not Found with a return link | Public |

## Account and registration behavior

- **New accounts:** valid `@gmail.com` addresses only. Case and surrounding spaces are normalized. Dotted and `+tag` variants are matched to prevent duplicate accounts.
- **Names:** Unicode letters are supported, extra spaces are normalized, and the maximum length is 80 characters. Numeric-only names and hidden/control characters are rejected.
- **Passwords:** 8-128 characters, at least one letter or number, and at least one special character. Leading/trailing whitespace, hidden/control characters, and all-symbol passwords are rejected. Confirmation must match.
- **Existing accounts:** previously created non-Gmail accounts remain accessible; new signup strength rules are not reapplied to existing login passwords.
- **Sessions and registrations:** saved in this browser, with separate event registrations for each user. Clearing site storage removes this local data. Data does not synchronize across devices or browser profiles.
- **Cancellation:** upcoming and undated registrations can be cancelled and registered again. Completed events remain in history.
- **Schedule groups:** based on saved event dates. Known end timestamps take precedence over start timestamps; date-only events stay upcoming through the venue's local calendar day. Later provider schedule changes are not automatically synchronized into saved registrations.

## Scope and deployment notes

Gather currently runs entirely in the browser. Its account system demonstrates frontend authentication; salted password hashing and protected routes do not provide server-enforced identity or authorization. Use demo credentials. Email validation checks syntax and domain, not mailbox ownership; there is no OTP or email verification service.

Event registrations are local application records. They **do not reserve or purchase Ticketmaster tickets**.

Vite embeds `VITE_` variables into the browser build, so the Ticketmaster key is visible to visitors even though `.env` is excluded from Git. A deployment that needs a private provider key should route requests through a backend or serverless proxy. Set the environment variable before building; changing it requires a rebuild.

For static hosting, publish the contents of `dist/` and configure a fallback to `index.html` for client-side routes such as `/events/:id`. Serve deployed builds over HTTPS for Web Crypto support. `npm run preview` is for checking builds locally.

Ticketmaster pagination is bounded to the first 1,000 matches. Gather limits navigation accordingly and prompts you to narrow broad searches. See the [Discovery API documentation](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) for provider behavior.

## Testing

```sh
npm test
npm run lint
npm run build
```

The current suite contains **55 automated tests**, covering validation, session restoration, Gmail aliases, duplicate signup, user isolation, registration/cancellation persistence, schedule boundaries, malformed storage, API errors, filters, pagination, and stale responses.

Tests use isolated storage and mocked API responses; they do not require your API key or modify your browser's real accounts. Live Ticketmaster requests have also been checked separately. Component render checks have covered the primary pages.

Manual browser interactions and mobile visual verification remain pending. See the [QA checklist](QA.md) for the complete review flow and viewport sizes.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Events are not configured | Confirm `.env` is beside `package.json`, the variable name matches `.env.example`, and the server was restarted. |
| Event authorization fails | Check the Consumer Key in your Ticketmaster developer account. |
| Rate-limit message | Wait before retrying and avoid rapid repeated searches. |
| No results | Clear filters, try a broader keyword, or change the city/country. Event coverage varies by location. |
| Login or registrations disappear | Use the same browser profile and site origin. Clearing site storage removes browser-local data. |
| Saving an account or registration fails | Check whether browser storage is blocked or full. |
| A deployed page fails on refresh | Configure your host's single-page-application fallback to `index.html`. |
| Password hashing is unavailable | Use localhost for development or HTTPS for deployment. |
