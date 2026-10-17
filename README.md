# Event Management System

A React and Redux Toolkit assignment project with browser-based account registration, login, logout, persistent sessions, protected registrations, and upcoming events from Ticketmaster.

The interface uses the Gather identity: warm ivory backgrounds, navy surfaces, coral accents, ticket-inspired artwork, responsive event cards, category chips, split authentication pages, and a personal registration overview. All artwork and icons are local SVG/CSS; no additional UI package or external font is required.

## Setup

1. Install Node.js compatible with Vite 8 (Node 22.12+ recommended).
2. Run `npm install`.
3. Copy `.env.example` to `.env` in the project root:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Get a Ticketmaster Consumer Key (API key) from https://developer.ticketmaster.com/ and enter it locally:

   ```dotenv
   VITE_TICKETMASTER_API_KEY=your_consumer_key_here
   ```

5. Run `npm run dev` and open the URL printed in the terminal. Restart the dev server after changing `.env`.

Never commit `.env` or a real API key. `.env.example` contains only an empty placeholder. Vite exposes `VITE_` variables to the browser; this frontend integration does not keep the key secret from visitors. A deployed application requiring a private key needs a server proxy.

## Commands

- `npm run dev`: start development server.
- `npm run build`: build into `dist`.
- `npm run preview`: preview the build locally.
- `npm run lint`: run Oxlint.
- `npm test`: run authentication, registration, and Ticketmaster service tests with Node's built-in test runner.

If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands.

## Current behavior

See [QA.md](QA.md) for automated test scope and the pending browser/mobile checklist.
See [REQUIREMENTS.md](REQUIREMENTS.md) for the assignment implementation map and remaining submission checks.

- Registration creates an account in this browser and signs the user in.
- New registrations accept valid `@gmail.com` addresses only. Email case/outer spaces are normalized; Gmail dot and `+tag` aliases cannot create duplicate accounts. Existing non-Gmail demo accounts retain login access. This validates address syntax/domain, not mailbox ownership.
- New passwords require 8–128 characters, a letter or number, and at least one special character. Leading/trailing whitespace, hidden/control characters, and all-symbol passwords are rejected. Existing login passwords are not subjected to new signup strength rules. Names support Unicode letters, normalize extra spaces, and are limited to 80 characters.
- Authentication state uses Redux, with a session restored from Local Storage on refresh.
- Passwords use salted PBKDF2 hashes. This remains a frontend simulation, not backend authentication; use demo credentials only.
- `/my-events` requires login and returns the user there after sign-in.
- `/events` requests up to 20 upcoming events, ordered by date, and displays images, categories, venue dates, and locations.
- Loading, missing configuration, connection errors, invalid credentials, rate limits, and empty results have feedback.
- `/events/:id` loads event details directly from Ticketmaster, including images, venue dates and times, location, category, status, description, and notes when available. Direct links and refresh work without first visiting the list. Missing events and request errors show feedback and a retry button.
- Signed-in users can register from an event details page. Duplicate registrations are blocked and registrations persist separately for each user in Local Storage. My Registrations displays the signed-in user's saved events. These are app registrations, not Ticketmaster ticket reservations or purchases.
- My Registrations groups saved events into upcoming, completed, and date-to-be-announced sections. Date-only events stay upcoming through the venue's local day; known end timestamps take precedence over start timestamps. These groups use the saved event schedule, rather than live completion tracking.
- Upcoming and undated registrations can be cancelled. Cancellation persists, updates Redux, and allows re-registration. Completed registrations remain as history and cannot be cancelled; registration for past events is closed.
- Events supports submitted keyword, category, city, and two-letter country-code filters. Search requests go to Ticketmaster; clear filters restores the unfiltered upcoming list. Applied filters stay in Redux when navigating to details and back. Newer searches take precedence over older responses, and retries preserve the applied filters.
- Results show 20 events per page with Previous/Next controls, page numbers, and total matches. Searches and clearing filters restart at page 1; retries retain the requested page, and detail navigation preserves the current results. Pagination preserves the upcoming-date cutoff across pages. Ticketmaster permits access to the first 1,000 matches, so large result sets show a prompt to narrow the filters.

API reference: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
