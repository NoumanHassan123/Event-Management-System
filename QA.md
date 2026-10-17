# Verification

Run `npm test`, `npm run lint`, and `npm run build`.

The automated suite covers authentication, session restoration, duplicate and per-user registrations, persistence, cancellation, date grouping, API errors, filtering, pagination, and stale responses. The integrated user-flow test uses isolated in-memory browser storage and does not change real accounts or registrations. These checks do not replace browser testing.

## Browser checklist

Actual browser and mobile visual checks are pending: no connected browser was available in the agent session.

- Start `npm run dev` and visit the printed localhost URL.
- Visit My Registrations while logged out; confirm login is required.
- Open an event, choose login, switch to register, and create a demo account. Confirm you return to the same event.
- Register for the event, open My Registrations, and refresh. Confirm the event remains and duplicate registration is blocked.
- Log out, create a different demo account, and confirm its registrations are empty.
- Log back in to the first account and cancel the registration. Refresh and confirm removal; register again to confirm this is allowed.
- Search by keyword, category, city, and country. Test no results and Clear filters.
- Use Next and Previous, visit details and return, and confirm filters and page remain selected.
- Check an unknown event URL and retry feedback. Test Offline mode in browser developer tools, then reconnect and retry.
- At widths 320, 375, 768, and 1280 pixels, check navigation wrapping, headings, forms, cards, details and pagination. Confirm no horizontal page scrolling.
- Tab through links and form controls; check visible focus indicators and readable light/dark layouts.

Only use demo passwords; authentication is simulated in Local Storage.
