# Verification

Run `npm test`, `npm run lint`, and `npm run build`.

The automated suite covers authentication, session restoration, duplicate and per-user registrations, persistence, cancellation, date grouping, API errors, filtering, pagination, and stale responses. The integrated user-flow test uses isolated in-memory browser storage and does not change real accounts or registrations. These checks do not replace browser testing.

## Browser checklist

Manual browser interactions and mobile visual verification are pending. The checks below are the release review checklist.

- Start `npm run dev` and visit the printed localhost URL.
- Visit My Registrations while logged out; confirm login is required.
- Open an event, choose login, switch to register, and create a demo account. Confirm you return to the same event.
- Register for the event, open My Registrations, and refresh. Confirm the event remains and duplicate registration is blocked.
- Log out, create a different demo account, and confirm its registrations are empty.
- Log back in to the first account and cancel the registration. Refresh and confirm removal; register again to confirm this is allowed.
- Check Upcoming, Ongoing, Completed, and Date To Be Announced groups. A started event without an end time should stay ongoing through its final scheduled venue-local day; new registration and cancellation should be unavailable once it starts.
- Search by keyword, category, city, and country. Test no results and Clear filters.
- Use Next and Previous, visit details and return, and confirm filters and page remain selected.
- Check an unknown event URL and retry feedback. Test Offline mode in browser developer tools, then reconnect and retry.
- At widths 320, 375, 768, and 1280 pixels, check navigation wrapping, headings, forms, cards, details and pagination. Confirm no horizontal page scrolling.
- Tab through links and form controls; check visible focus indicators, the skip-to-content link, password visibility controls, and readable colors in the Gather theme.
- On registration, test a non-Gmail domain, a spoofed suffix (`gmail.com.example.com`), repeated dots, and dotted/`+tag` duplicates of an existing Gmail account. Test a password without a symbol, a short/all-symbol password, surrounding whitespace, a confirm-password mismatch, and correction after each error. Valid Unicode names and passwords with an internal space plus a symbol should work. Existing demo accounts should still log in.

The redesigned Events, Login, Register, Event Details, My Registrations, and Not Found pages passed server-render checks with fixture data. This verifies component rendering, page headings, and password controls; it does not verify browser interactions or pixel layout.

Only use demo passwords; authentication is simulated in Local Storage.
