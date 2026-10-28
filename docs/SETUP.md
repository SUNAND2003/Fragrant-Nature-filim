# Running the site + admin panel

The project is two processes: the **Vite web app** (React UI) and the **Express API**
(`backend/`). In dev, Vite proxies `/api` and `/uploads` to the API, so the browser only
talks to one origin.

## 1. One-time setup

```bash
npm install
copy .env.example .env      # PowerShell (macOS/Linux: cp .env.example .env)
```

Then fill in `.env`:

| Key                                                   | What it is                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                                         | Atlas `mongodb+srv://…` or local `mongodb://127.0.0.1:27017/fragrant-nature`                                          |
| `JWT_SECRET`                                          | any long random string used to sign admin sessions                                                                    |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`                      | admin login created by the seed (defaults `admin` / `admin1234`)                                                      |
| `CLOUDINARY_URL` (or the three `CLOUDINARY_*` values) | where uploaded images go. **Leave empty** → images are stored on disk in `backend/uploads` and served at `/uploads/…` |

## 2. Seed the database

```bash
npm run seed
```

Idempotent — safe to re-run. Loads the 7 films, 5 news articles, 7 honors, categories +
subcategories, site settings, and the admin user.

## 3. Start everything

```bash
npm run dev:all     # web on :5173 + API on :4000
```

or in two terminals:

```bash
npm run dev         # Vite
npm run backend       # Express (--watch)
```

| URL                              | What                         |
| -------------------------------- | ---------------------------- |
| http://localhost:5173            | public site                  |
| http://localhost:5173/admin      | admin panel (login required) |
| http://localhost:4000/api/health | API health check             |

## 4. Admin panel (`/admin`)

Sections: **Dashboard**, **Films**, **Categories**, **Subcategories**, **Navigation**,
**News**, **Awards**, **Media**, **Settings**.

- **Categories / Subcategories** — create, edit, reorder, delete. Deleting strips the
  reference from affected films; it never deletes films.
- **Navigation** — the public header menu and the footer's Navigation column: rename an
  entry, repoint its link (internal path or full URL), hide/show it, reorder with the
  arrows, or add new items. The News dropdown stays attached to the `/about` entry.
- **Films** — full CRUD: poster upload, category + multi-subcategory picker, cast,
  laurels, accent colour, trailer URL, `now`/`upcoming`, “featured” (hero carousel).
- **News** — full CRUD with draft/publish, one paragraph per line, optional pull quote,
  optional link to a film. Public URLs stay `/news/<id>` (server-assigned id).
- **Awards** — honors that feed the home-page rail and `/awards`.
- **Media** — upload many images, copy URLs, delete (deletes the Cloudinary/local file).
- **Settings** — site name, tagline, emails, address, social links, footer note + the
  admin password change. These are read live by the public header/footer.

Every change calls the API, then refreshes the public catalogue, so the site updates
immediately — no rebuild needed while developing.

## Behaviour when the API is down

The public site falls back to the bundled catalogue in `src/lib/films.ts` and renders
normally (it does not blank out). The admin panel shows an “API offline” screen instead
of the login form, with instructions to start the server.

## Tests / lint / build

```bash
npm test        # vitest (routing integration tests)
npm run lint    # eslint
npm run build   # vite build
```

For a production build talking to a hosted API, set `VITE_API_URL=https://api.example.com`
in the build environment.
