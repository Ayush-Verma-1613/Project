# Appointment Manager

A small appointment management application built for the freelancer practical assessment.

**Stack:** React 18 (Vite) + Node.js + Express — the MERN stack **without the MongoDB connection**, which was explicitly excluded from scope. The API persists data in an in-memory store behind a repository interface, so a Mongo implementation can be dropped in without touching routes or controllers. See [Persistence](#persistence) and [Technical decision](#technical-decision).

---

## Contents

- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [API notes](#api-notes)
- [Persistence](#persistence)
- [Tests performed](#tests-performed)
- [Feature status](#feature-status)
- [Known limitations](#known-limitations)
- [Technical decision](#technical-decision)
- [Disclosure](#disclosure)

---

## Quick start

Requires Node.js 18 or newer (developed on Node 24, npm 11).

```bash
# 1. install dependencies for both packages
npm run install:all

# 2. create the env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. run the API and the web app together
npm run dev

# 4. (optional) run the test suites
npm test
```

- Web app: http://localhost:5173
- API: http://localhost:4000

### Running the two packages separately

```bash
npm run dev:server    # Express on :4000 (node --watch)
npm run dev:client    # Vite dev server on :5173
```

### Production build

```bash
npm run build         # builds client/dist
npm start             # runs the API without the watcher
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so the browser stays on a single origin during development. To point the client at a different API host, set `VITE_API_BASE_URL` in `client/.env`.

---

## Project structure

```
.
├── package.json              # root scripts (install:all, dev, build, start)
├── .env.example
├── server/
│   ├── .env.example
│   └── src/
│       ├── index.js          # bootstrap: init store, start listener
│       ├── app.js            # express app, CORS, routes, error handling
│       ├── config.js         # env parsing
│       ├── models/appointment.js      # statuses + validation rules
│       ├── routes/appointments.js
│       ├── controllers/appointmentsController.js
│       ├── middleware/errorHandlers.js
│       ├── appointments.test.js    # 15 API tests (node:test)
│       └── store/
│           ├── index.js      # persistence selector (memory | mongo)
│           ├── memoryStore.js
│           └── seed.js       # the three starting appointments
└── client/
    ├── .env.example
    ├── vite.config.js        # /api dev proxy
    └── src/
        ├── App.jsx           # state, data loading, optimistic updates
        ├── App.test.jsx      # 14 UI tests (vitest + testing-library)
        ├── constants.js
        ├── api/client.js     # fetch wrapper, field-level error surfacing
        ├── components/       # Form, List, Row, Toolbar, Icons
        ├── utils/format.js
        └── styles/index.css  # design tokens, light + dark, responsive
```

---

## Environment variables

No secrets are committed. `.env` files are gitignored; `.env.example` files hold placeholders only.

### `server/.env`

| Variable      | Default                                           | Purpose                                                 |
| ------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `PORT`        | `4000`                                            | API port.                                               |
| `CORS_ORIGIN` | `http://localhost:5173`                           | Comma-separated list of allowed browser origins.        |
| `PERSISTENCE` | `memory`                                          | `memory` (implemented) or `mongo` (intentionally unimplemented). |
| `MONGODB_URI` | `mongodb://localhost:27017/appointment_manager`   | Placeholder for a future Mongo store. Unused today.     |

### `client/.env`

| Variable            | Default | Purpose                                                        |
| ------------------- | ------- | -------------------------------------------------------------- |
| `VITE_API_BASE_URL` | empty   | Leave empty to use the Vite dev proxy; set to an absolute URL otherwise. |

---

## API notes

Base URL: `http://localhost:4000/api`. All requests and responses are JSON. Successful reads/writes return `{ "data": ... }`; failures return `{ "message": ..., "errors": { field: message } }`.

| Method   | Path                        | Description                                       |
| -------- | --------------------------- | ------------------------------------------------- |
| `GET`    | `/health`                   | Liveness probe + active persistence driver.       |
| `GET`    | `/meta`                     | Allowed statuses and suggested services.          |
| `GET`    | `/appointments`             | List; optional `?status=` and `?search=` filters. |
| `GET`    | `/appointments/:id`         | Fetch one appointment.                            |
| `POST`   | `/appointments`             | Create an appointment.                            |
| `PATCH`  | `/appointments/:id/status`  | Change an appointment's status.                   |
| `DELETE` | `/appointments/:id`         | Delete an appointment.                            |

### Appointment shape

```json
{
  "id": "82228402-5b2b-41b5-bbfa-a9edb19631a5",
  "customerName": "Alex Morgan",
  "service": "Consultation",
  "dateTime": "2026-11-02T10:00",
  "status": "Pending",
  "createdAt": "2026-10-29T10:13:13.032Z",
  "updatedAt": "2026-10-29T10:13:13.034Z"
}
```

`status` is one of `Pending`, `Confirmed`, `Cancelled`. Results are sorted by `dateTime` ascending.

### Query parameters on `GET /appointments`

- `status` — `All` (or omitted), `Pending`, `Confirmed`, `Cancelled`. Anything else returns `400`.
- `search` — case-insensitive substring match on `customerName`.

Both can be combined: `GET /api/appointments?status=Pending&search=alex`.

### Validation rules

| Field          | Rule                                                       |
| -------------- | ---------------------------------------------------------- |
| `customerName` | Required, 2–80 characters after trimming.                  |
| `service`      | Required, max 80 characters.                               |
| `dateTime`     | Required, must parse as a valid date.                      |
| `status`       | Required, must be one of the three allowed values.         |

The same rules run in the browser for instant feedback; the API remains the source of truth and is validated independently (a request sent with curl is rejected the same way).

### Example requests

```bash
curl http://localhost:4000/api/appointments

curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Priya Nair","service":"Consultation","dateTime":"2026-11-04T09:15","status":"Pending"}'

curl -X PATCH http://localhost:4000/api/appointments/<id>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Confirmed"}'

curl "http://localhost:4000/api/appointments?status=Confirmed&search=ja"
```

### Status codes

`200` OK · `201` created · `204` deleted · `400` validation failure · `404` unknown id or route · `500` unexpected error.

---

## Persistence

**MongoDB is not connected — this was excluded from scope deliberately, not because of an environment blocker.**

Data lives in `server/src/store/memoryStore.js`, seeded on boot with the three appointments from the brief. What that means in practice:

- Changes **survive a browser refresh**, because the data lives in the API process, not in the browser.
- Changes **do not survive a server restart** — the seed data comes back.

The store is written against the async interface a Mongo repository would expose (`init`, `findAll`, `findById`, `create`, `updateStatus`, `remove`). Adding persistence means writing `store/mongoStore.js` with those five methods and selecting it in `store/index.js`; no route, controller or client code changes. Setting `PERSISTENCE=mongo` today throws a clear startup error rather than failing silently.

---

## Tests performed

```bash
npm test             # runs both suites
npm run test:server  # 15 API tests  (node:test, no extra dependencies)
npm run test:client  # 14 UI tests   (vitest + React Testing Library + jsdom)
```

Last run: **29 passing, 0 failing.**

### API — `server/src/appointments.test.js` (15 tests, all passing)

The suite boots the real Express app on an ephemeral port and re-seeds the store before each test.

| Test                                     | Expected                                   |
| ---------------------------------------- | ------------------------------------------ |
| `GET /health`                            | `200`, reports `persistence: memory`       |
| `GET /appointments`                      | `200`, 3 seeded rows, date-sorted          |
| `POST` valid appointment                 | `201` + record with `id` and `createdAt`   |
| `POST` empty body `{}`                   | `400` with one error per required field    |
| `POST` with `status: "Done"`             | `400`, status field error                  |
| `POST` with `dateTime: "not-a-date"`     | `400`, date field error                    |
| `PATCH /:id/status`                      | `200`, status changed, `updatedAt` advanced |
| `PATCH /:id/status` with `"Archived"`    | `400`                                      |
| `PATCH` on unknown id                    | `404`                                      |
| `GET ?status=Confirmed`                  | only confirmed rows                        |
| `GET ?status=Nope`                       | `400` invalid filter                       |
| `GET ?search=JAM`                        | `Jamie Lee` only (case-insensitive)        |
| `GET ?search=a&status=Pending`           | combined filter correct                    |
| `DELETE /:id` then repeat                | `204` then `404`                           |
| `GET /nothing`                           | `404` with a route message                 |

### UI — `client/src/App.test.jsx` (14 tests, all passing)

The API module is mocked, so these exercise real component behaviour without a running server.

| Test                                                              |
| ----------------------------------------------------------------- |
| Renders the seeded appointments with name, service, date and status |
| Shows the per-status counters                                      |
| Empty submit shows a message per required field and sends no request |
| One-character customer name is rejected before any request          |
| Valid submit calls the API with trimmed values and clears the form  |
| A field error returned by the API is shown under that field         |
| Changing status calls `PATCH` and confirms with a toast             |
| A rejected status change is rolled back in the UI                   |
| Status filter narrows the list                                      |
| Empty state appears when a filter matches nothing                   |
| Customer-name search queries the API (debounced)                    |
| Search and status filter combine correctly                          |
| Deleting removes the row                                            |
| An unreachable API shows the error banner and the offline pill      |

### Also verified manually

| Check                                                              | Result |
| ------------------------------------------------------------------ | ------ |
| `npm run build` production build                                   | ✅ clean, 39 modules |
| Dev server serves the app and proxies `/api` to port 4000          | ✅ |
| Full curl pass over every endpoint against the running server      | ✅ matches the table above |
| Browser refresh keeps changes (data lives in the API process)      | ✅ |

The responsive layout and the dark theme are implemented with CSS breakpoints at 960 px / 620 px and a `prefers-color-scheme` block; they were **not** verified visually on real devices — see limitations.

---

## Feature status

### Completed

- List appointments with customer name, service, date/time and status.
- Add an appointment through a validated form.
- Required-field validation with clear, per-field error messages, on both client and API.
- Change an appointment's status from the list (optimistic update, rolled back on API failure).
- Filter by `All` / `Pending` / `Confirmed` / `Cancelled`, with live counts per filter.
- **Customer-name search** (the mid-assessment change request) — debounced, case-insensitive, served by the API, and combinable with the status filter.
- Delete an appointment (small extra beyond the brief).
- Node.js/Express REST API with centralised validation and error handling.
- Responsive interface with light and dark themes, loading skeletons, empty states, toasts and an API-connection indicator.
- Keyboard-accessible controls, labelled inputs, `aria-invalid` / `role="alert"` on errors, and reduced-motion support.
- **29 automated tests** — 15 API tests on the real Express app, 14 UI tests on the React components.

### Not implemented

- **MongoDB persistence** — excluded from scope; the store abstraction is in place for it.
- **Editing an appointment's name, service or date/time** — only the status is editable, as specified in the brief.
- Authentication, pagination, timezone handling, and server-side rate limiting.

---

## Known limitations

1. **Data is lost on server restart.** Expected, given the in-memory store. A browser refresh is safe; `Ctrl+C` on the API is not.
2. **Not multi-process safe.** The store is a module-level array, so running several API instances would give each its own copy.
3. **Date/time is stored as the literal local string** (`2026-11-02T10:00`) that `<input type="datetime-local">` produces — no timezone is attached. Fine for a single-locale demo; a real deployment should store UTC instants.
4. **Status filtering is applied in the browser, search on the API.** The API supports both, but the UI filters status locally so the four counters stay accurate for the current search without a second request.
5. **No optimistic-concurrency control.** Two people changing the same appointment's status — last write wins.
6. **The delete action has no confirmation dialog.**
7. **Duplicate appointments are allowed** — there is no uniqueness check on customer + time.
8. **The responsive layout and dark theme were not checked on real devices.** The breakpoints and the `prefers-color-scheme` block are implemented but verified only by code review, not visually at each width.
9. **No end-to-end test.** The UI tests mock the API module, so the two suites meet at the contract but never exercise the real network path together; the curl pass covered that manually.

---

## Technical decision

**Putting a repository interface in front of the data, instead of calling a data source directly from the controllers.**

The brief asked for MongoDB "if the environment allows", and for this build the database connection was deliberately left out. The cheap route would have been an array in the controller file. Instead, `store/memoryStore.js` implements the same five async methods a Mongoose-backed store would (`init`, `findAll`, `findById`, `create`, `updateStatus`, `remove`), and `store/index.js` picks the implementation from the `PERSISTENCE` env variable.

Why it was worth the extra file:

- **The swap is contained.** Adding Mongo means writing one new file and one line in the selector. Routes, controllers, validation and the entire client stay untouched.
- **The async surface is honest.** The in-memory methods are already `async`, so controllers already `await` — no refactor from sync to async later, which is where this kind of shortcut usually costs time.
- **Filtering lives in one place.** `findAll({ status, search })` is the single query entry point, which is exactly the signature a Mongo `find()` would take. The mid-assessment search change needed one filter block in the store plus a query param — not changes scattered across layers.
- **The gap is explicit, not silent.** `PERSISTENCE=mongo` throws a named startup error instead of pretending to persist, so nobody mistakes this build for a persistent one.

The trade-off is one layer of indirection on a three-endpoint API. That is acceptable here because the persistence choice is the single most likely thing to change in this codebase.

---

## Disclosure

- No starter template was used; the project was created from scratch (`vite` was used only as the build tool, configured manually).
- AI assistance (Claude) was used to scaffold the project files, write the UI styling, and draft this README. All code was reviewed, run and tested manually as recorded above.
- All data in the repository is fictional. No credentials, API keys or production systems are involved.
