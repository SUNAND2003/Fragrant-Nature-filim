# Fragrant Nature — Backend API contract

Express + Mongoose (MongoDB) + Cloudinary. Server lives in `backend/` (plain Node ESM, no build step).
Runs on **http://localhost:4000**. Vite dev server proxies `/api` and `/uploads` to it.

All responses are JSON. Errors are `{ "error": "Human readable message" }` with a proper HTTP status.

Auth: `Authorization: Bearer <jwt>` on every `/api/*` route marked **admin**.
JWT payload: `{ sub: adminId, email, name }`, expiry `7d`, secret from `JWT_SECRET`.

---

## Data shapes

### Category

```json
{
  "_id": "665f...",
  "name": "Genre",
  "slug": "genre",
  "description": "",
  "accent": "#E01B24",
  "order": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Subcategory

```json
{
  "_id": "665f...",
  "name": "Neo-Noir",
  "slug": "neo-noir",
  "category": { "_id": "665f...", "name": "Genre", "slug": "genre" },
  "order": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Film

```json
{
  "_id": "665f...",
  "slug": "red-highway",
  "title": "Red Highway",
  "director": "Mara Kessel",
  "year": 2026,
  "genre": "Neo-Western",
  "runtime": "1h 58m",
  "rating": "R",
  "poster": "/images/films/hero.jpg",
  "posterPublicId": "",
  "tagline": "Some roads only go one way.",
  "synopsis": "...",
  "cast": ["Theo Vance", "Lina Ortiz"],
  "status": "now",
  "release": "In theaters now",
  "laurels": ["Cannes — Official Selection"],
  "accent": "#E01B24",
  "trailer": "https://www.youtube.com/watch?v=xxxx",
  "featured": true,
  "category": { "_id": "...", "name": "Genre", "slug": "neo-western" },
  "subcategories": [{ "_id": "...", "name": "Neo-Western", "slug": "neo-western" }],
  "order": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

`category` may be `null`. `category` / `subcategories` are **hydrated** (name+slug) on read.
Accepted write types: `category` = category `_id` or `null`; `subcategories` = array of subcategory `_id`s.

### NewsArticle

```json
{
  "_id": "665f...",
  "id": 1,
  "date": "Oct 18, 2026",
  "tag": "Awards",
  "title": "Drown takes the Grand Jury Prize",
  "excerpt": "...",
  "image": "/images/films/p1.jpg",
  "imagePublicId": "",
  "author": "Claire Moreau",
  "readTime": "4 min read",
  "filmSlug": "drown",
  "content": ["paragraph", "paragraph"],
  "quote": { "text": "...", "author": "..." },
  "published": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

`id` is a server-assigned integer (`max + 1`), used in the public URL `/news/:id`.

### Award

```json
{
  "_id": "665f...",
  "id": "sundance-drown",
  "festival": "Sundance Film Festival",
  "award": "Grand Jury Prize — U.S. Dramatic",
  "year": 2026,
  "filmSlug": "drown",
  "category": "Major Prize",
  "citation": "..."
}
```

`id` is a client-supplied unique string slug (required, e.g. `kebab(festival)+"-"+slug(filmSlug)`).
`category` is one of: `Major Prize | Selection | Craft | Audience`.

### Media

```json
{ "_id": "...", "url": "https://res.cloudinary.com/.../poster.jpg", "publicId": "...",
  "originalName": "poster.jpg", "bytes": 123456, "width": 1600, "height": 2400,
  "format": "jpg", "kind": "poster" | "news" | "gallery" | "misc", "createdAt": "..." }
```

### Settings

Plain object map: `{ "siteName": "Fragrant Nature Film Productions", "email": "...", ... }`.

### Navigation

```json
{
  "_id": "...",
  "label": "Movies",
  "to": "/films",
  "order": 0,
  "visible": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

`label` is the menu text, `to` is the link (site path or external URL), `order` sets the
position (asc), and `visible: false` keeps the entry in the admin list but drops it from the
public menu. The About entry still carries the News dropdown on the client side.

---

## Routes

### Health / auth

| Method                                                                                                | Path                 | Auth  | Notes                                                                                       |
| ----------------------------------------------------------------------------------------------------- | -------------------- | ----- | ------------------------------------------------------------------------------------------- |
| GET                                                                                                   | `/api/health`        | –     | → `{ ok: true, db: "up"\|"down", cloudinary: true\|false, uploads: "cloudinary"\|"local" }` |
| POST                                                                                                  | `/api/auth/login`    | –     | body `{ email, password }` — `email` is the **identifier**: a username such as `admin` or a |
| full address, matched case-insensitively → `{ token, admin: { id, name, email } }`. 401 on bad creds. |
| GET                                                                                                   | `/api/auth/me`       | admin | → `{ admin: { id, name, email } }`                                                          |
| PUT                                                                                                   | `/api/auth/password` | admin | body `{ currentPassword, newPassword }` (min 8) → `{ ok: true }`                            |

### Content (public read)

| Method | Path                 | Query / notes                                                                                                                                  |
| ------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/films`         | `?status=now\|upcoming`, `?category=<slug\|_id>`, `?subcategory=<slug\|_id>`, `?q=`, `?featured=true`. Sorted by `order` asc then `year` desc. |
| GET    | `/api/films/:slug`   | 404 `{ "error": "Film not found" }`                                                                                                            |
| GET    | `/api/categories`    | sorted by `order` asc, `name` asc                                                                                                              |
| GET    | `/api/subcategories` | `?category=<slug\|_id>`                                                                                                                        |
| GET    | `/api/news`          | published only, `?all=true` (admin, includes drafts), sorted `createdAt` desc                                                                  |
| GET    | `/api/news/:id`      | numeric `id` **or** slug; 404 otherwise                                                                                                        |
| GET    | `/api/awards`        | sorted `year` desc                                                                                                                             |
| GET    | `/api/settings`      | → key/value object (always an object, even if empty)                                                                                           |
| GET    | `/api/navigation`    | visible menu entries only, sorted `order` asc — drives the public header menu and footer                                                       |

### Content (admin — Bearer required, 401 otherwise)

| Method              | Path                         | Notes                                                                     |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| POST / PUT / DELETE | `/api/films[/:id]`           | POST creates, PUT partial update, DELETE removes                          |
| POST / PUT / DELETE | `/api/categories[/:id]`      | DELETE → `{ ok: true, unlinked: <n> }` and strips the category from films |
| POST / PUT / DELETE | `/api/subcategories[/:id]`   | DELETE unlinks from films                                                 |
| POST / PUT / DELETE | `/api/news[/:id]`            |                                                                           |
| POST / PUT / DELETE | `/api/awards[/:id]`          | id here is `_id`                                                          |
| POST / PUT / DELETE | `/api/navigation[/:id]`      | `PUT /api/navigation` (no id) = bulk reorder, body `{ order: [<ids>] }`   |
| GET                 | `/api/news` with `?all=true` | includes drafts                                                           |
| GET                 | `/api/navigation?all=true`   | includes `visible: false` entries                                         |

### Media (admin)

| Method | Path             | Notes                                                                                                                    |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/api/upload`    | multipart, field name **`file`**, optional `kind` field. → Media object. 10 MB limit, accepts jpg/png/webp/gif/avif/svg. |
| GET    | `/api/media`     | newest first → Media[]                                                                                                   |
| DELETE | `/api/media/:id` | destroys the Cloudinary asset (or deletes the local file) and the record                                                 |

### Settings (admin)

| Method | Path            | Notes                                                    |
| ------ | --------------- | -------------------------------------------------------- |
| PUT    | `/api/settings` | body is a partial key/value map → merged settings object |

---

## Storage behaviour

- If `CLOUDINARY_URL` / `CLOUDINARY_CLOUD_NAME`+`CLOUDINARY_API_KEY`+`CLOUDINARY_API_SECRET` are present in `.env`,
  uploads go to Cloudinary (folder `fragrant-nature`), `Media.url` = the secure URL.
- Otherwise fall back to **local disk**: write to `backend/uploads/`, serve it statically at `/uploads/...`
  (Vite proxies `/uploads` → `:4000`). `GET /api/health` reports which mode is active.

## Database

- `MONGODB_URI` in `.env`.
- `npm run seed` connects, wipes/inserts the seed catalogue (from `backend/seed/data.js`) and
  upserts the admin user from `ADMIN_EMAIL` (default `admin`) and
  `ADMIN_PASSWORD` (default `admin1234`). Safe to re-run (idempotent).

## Env (`.env.example` at repo root)

```
PORT=4000
MONGODB_URI=
JWT_SECRET=
ADMIN_EMAIL=admin
ADMIN_PASSWORD=admin1234
CLOUDINARY_URL=
# or: CLOUDINARY_CLOUD_NAME=  CLOUDINARY_API_KEY=  CLOUDINARY_API_SECRET=
```
