# Project implementation reference

This maps Gather's features to their source files. Implementation coverage and manual browser verification are tracked separately; see [QA.md](QA.md) for the remaining review checklist.

| Requirement | Implementation |
| --- | --- |
| React, Redux Toolkit, React Router | `src/main.jsx`, `src/store/store.js`, `src/App.jsx` |
| Name/email/password registration, login, logout | `src/pages/Register.jsx`, `src/pages/Login.jsx`, `src/features/auth/authSlice.js`, `src/components/Navbar.jsx` |
| Persistent user session | `src/services/authService.js` |
| Ticketmaster event exploration and upcoming events | `src/services/ticketmasterService.js`, `src/pages/Events.jsx` |
| Keyword search, category and location filters | `src/utils/eventFilters.js`, `src/pages/Events.jsx` |
| Event image, date/time, venue, location, category and description | `src/pages/EventDetails.jsx` |
| Logged-in registration, duplicate prevention and user association | `src/features/registrations/registrationsSlice.js`, `src/services/registrationService.js` |
| My Events, upcoming/completed groups, cancellation | `src/pages/MyEvents.jsx`, `src/utils/eventSchedule.js`, `src/components/CancelRegistration.jsx` |
| Shared state and Redux hooks | Auth, events, and registrations slices; components use `useSelector` and `useDispatch` |
| Routing and protected My Events | `src/App.jsx`, `src/components/ProtectedRoute.jsx` |
| Loading, errors, validation and empty results | Auth forms, event views, registration controls and services |
| Responsive structure and reusable components | CSS grids/wrapping; shared navbar, event card, registration controls; visual checks pending |
| API key configuration excluded from Git | `.env.example` and `.gitignore`; real key stays in ignored `.env` |
| Setup instructions and regular commits | `README.md` and repository history |

## Release checks

1. Complete the browser/mobile checklist in `QA.md`.
2. Configure the Ticketmaster environment variable for the target environment.
3. Verify direct navigation and refresh on client-side routes before publishing a deployment.

Authentication and event registrations are frontend simulations stored per browser. Registrations do not reserve or purchase Ticketmaster tickets. My Events groups use saved event schedules, so later provider changes are not automatically synchronized.
