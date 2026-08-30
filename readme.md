# MMV WebPortal — Mahila Mahavidyalaya, BHU

Official web portal for Mahila Mahavidyalaya (Women's College), Banaras Hindu University, Varanasi.

Built with a **React + Vite** frontend, **FastAPI** backend, and **SQLite** database.

---

## Project Structure

```
MMV_WebPortal/
├── readme.md                  # This file
│
├── info/
│   └── mmv_knowledge.json      # Knowledge base content for the planned AI assistant
│
├── backend/                   # FastAPI app
│   ├── main.py                  # App entry point, all API routes
│   ├── models.py                  # SQLAlchemy database models
│   ├── database.py                  # DB engine/session setup
│   ├── auth.py                        # JWT authentication
│   ├── seed.py                          # Seed initial admin/student users
│   ├── requirements.txt                  # Python dependencies
│   └── uploads/                            # Uploaded photos and PDFs (served as static files)
│
└── frontend/                  # React + Vite client
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── app.jsx                        # Route definitions
        ├── main.jsx                       # React entry point
        ├── app.css / index.css            # Global styles
        ├── utils/
        │   └── auth.js                    # Token/session helpers (getToken, isAdmin, etc.)
        ├── data/
        │   └── mmvInfo.js                 # Static reference data
        ├── components/
        │   ├── Navbar.jsx                 # Navigation bar (all 57 links)
        │   ├── Layout.jsx                 # Wraps navbar + footer around pages
        │   ├── Footer.jsx                 # Site footer
        │   └── WelcomeSplash.jsx          # Full-screen welcome splash shown on first load
        └── pages/
            ├── home.jsx                       # Home page
            ├── about.jsx                       # About MMV page
            ├── AboutSarthi.jsx                 # About MMV सारथी (portal itself) page
            ├── contact.jsx                      # Contact page
            ├── notice.jsx                        # Notices page (reads from /notices)
            ├── News.jsx                            # College news page (reads from /news)
            ├── Feedback.jsx                          # Student feedback form
            ├── generic.jsx                        # ★ Single template for all 57 content pages
            ├── SlideshowBlock.jsx                  # Reusable photo slideshow component
            ├── ProfileCardsBlock.jsx               # Reusable staff/warden profile card carousel
            ├── AdministrationRouted.jsx            # Route config for Administration section
            ├── AcademicsRouted.jsx                 # Route config for Academics section
            ├── FacilitiesRouted.jsx                # Route config for Facilities section
            ├── AdminDashboard.jsx                  # Admin control panel
            ├── adminreadme.jsx                     # ★ In-portal formatting/syntax guide, shown as a tab in
            │                                          AdminDashboard and standalone at /admin/content-guide
            └── LoginPage.jsx                       # Admin login
```

---

## How the 57-Page System Works

Instead of building 57 separate pages, the portal uses a **single template** (`generic.jsx`) powered by three router config files.

### The flow

```
URL → Router File → generic.jsx (template) → Backend API → Database
```

1. A navbar link sends the user to a URL like `/facilities/hostels/kirtikunj`
2. The matching router file (`FacilitiesRouted.jsx`) looks up that URL in its config table and reads the `pageType`
3. `generic.jsx` receives the config as props and renders accordingly
4. It fetches the actual content (text, photo, PDF, table data) from the backend API

### Page types available

`pageType` is a string built from keywords — combine as many as a page needs:

| Keyword          | What it adds to the page |
|---|---|
| `description`     | Text content box |
| `photo`            | Photo grid (configurable columns/size) |
| `table`             | Editable data table |
| `slideshow`          | Auto-rotating photo slideshow |
| `profile`             | Database-driven profile card (photo, name, designation, contact info) |
| `pdf-list` (exact value) | PDF upload and viewer |

Example combos: `'description'`, `'photo-description'`, `'description-table'`, `'description-profile'`, `'description-slideshow'`, or any mix of the above.

### Adding or changing a page

To change what a page shows (e.g. remove a table, add a photo), edit **only the router file** for that section. Example in `FacilitiesRouted.jsx`:

```js
// Change this page from a table to just a description:
'hostels/kirtikunj': { title: 'Kirti Kunj Hostel', pageType: 'description' },

// Or make it show a PDF:
'hostels/kirtikunj': { title: 'Kirti Kunj Hostel', pageType: 'pdf-list' },

// Or add a slideshow with custom sizing:
'hostels/kirtikunj': {
  title: 'Kirti Kunj Hostel',
  pageType: 'description-slideshow',
  slideshowHeight: 360,
  slideshowMaxWidth: '100%',
},

// Or add a staff profile section (used for Principal/Dean/VC-style pages):
'administration/principal': {
  title: 'Principal',
  pageType: 'description-profile',
},
```

To add a brand new page, add one line to the router file and add its link to `Navbar.jsx`.

---

## Content Formatting (for Admins)

When editing any page's description in the admin controls, `generic.jsx` parses a small custom shorthand (not full Markdown). The same guide is also available live inside the app for admins — see **Admin Panel → Content Guide** below.

### Basic text & links

| What you type              | How it appears |
|---|---|
| First line of content      | Large centered heading with underline |
| `## Section Title`         | Navy subheading |
| `### Smaller Title`        | Smaller dark subheading |
| `- Item`                   | Bullet point |
| `**Bold text**`            | Bold |
| `*Italic text*` or `_Italic text_` | Italic |
| `[link text](url)`         | Clickable link — internal (`/...`) links open in the same tab, external links open in a new tab |
| `---`                      | Horizontal divider |
| Blank line                 | Vertical spacing |
| Anything else              | Normal left-aligned paragraph |

### Callout notes (`>` ... `<`)

Start a line with `> ` to open a highlighted note box; close it by ending a line with `<`. A single-line note can open and close on the same line. Notes support their own nested `##`, `###`, `---`, and `- ` bullets.

```
> Visitors allowed only between 4 PM and 6 PM on weekdays. <
```

```
> **Hostel Rules**
- Curfew is 8:00 PM
- Guests must sign in at the gate <
```

### In-description tables (`| Col 1 | Col 2 |`)

Pipe-delimited rows render as a styled data table. The first row is the header; the second row must be a divider (`| --- | --- |`); every row after that is data. Cells support bold, italic, and links.

```
| Warden Name | Hostel | Contact Number |
| --- | --- | --- |
| Dr. Moumita Das | Swasti Kunj | +91 8967064498 |
| Dr. Rana Noor | Swasti Kunj | +91 9451735063 |
```

### Full-width accordion (`+++ Title` ... `+++`)

```
+++ Fee Refund Policy
Refunds are processed within 15 working days of the withdrawal request.
+++
```

### 3-column grid accordions (`:::grid [theme]` ... `:::`)

Renders up to 3 cards side-by-side; each card expands on click. Cards inside the block are separated with `=== Card Title`. Optional theme keyword after `:::grid` — one of `blue`, `green`, `slate`, `crimson`, `purple`, `amber` (omit for the default gold/navy theme).

```
:::grid blue
=== Hostel Rules
- Curfew time is **8:00 PM**
- Check [Hostel Guidelines](/facilities/hostels) for details
=== Mess Timings
- Breakfast: **7:30 AM - 9:00 AM**
:::
```

### Staff / warden profile cards

Not text shorthand — added from the **Admin Controls** bar on the live page via the **+ Profile Card** button (needs `profile` in the page's `pageType`). Captures full name, designation, hostel/department, university, phone, email, and a photo avatar.

### Full example

```
Kirti Kunj Hostel

## About
Established in 1985, one of the oldest hostels on campus.

## Facilities
- 24-hour hot water
- Wi-Fi on all floors

> Visitors allowed only between 4 PM and 6 PM on weekdays. <

**Warden:** Dr. Anita Singh — 9876543210
```

### Admin Panel → Content Guide

The formatting rules above are also documented in-app for non-technical admins: `frontend/src/pages/adminreadme.jsx` renders a live "Administrator Operating & Syntax Guide" — visible as a tab inside `/admin` (`AdminDashboard.jsx`) and standalone at `/admin/content-guide`. Update that file alongside this section whenever `generic.jsx`'s parsing rules change, so the two stay in sync.

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

---

## 1) Backend Setup

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### Environment Variables

Create a `.env` file in the project root (this file is git-ignored and should **never** be committed):

```env
SECRET_KEY=replace-with-a-long-random-string
DATABASE_URL=sqlite:///./college_portal.db
```

- `SECRET_KEY` — used to sign JWT auth tokens. **Required.** Generate a real random value for it, for example with `python -c "import secrets; print(secrets.token_hex(32))"`, and keep it private — anyone with this value can forge valid admin logins.
- `DATABASE_URL` — optional, defaults to `sqlite:///./college_portal.db` if not set. Switch to PostgreSQL by pointing this at a Postgres connection string instead.

A `.env.example` file (with placeholder values only) should be committed alongside the code so other contributors know which variables to set, without ever committing the real `.env` itself.

---

## 2) Seed Initial Data (Optional but recommended)

With the virtual environment activated, from the project root:

```powershell
python -m backend.seed
```

---

## 3) Run Backend API

From the project root:

```powershell
cd backend
uvicorn main:app --reload
```

- API runs at: `http://127.0.0.1:8000`
- Interactive API docs: `http://127.0.0.1:8000/docs`
- Uploaded photos/PDFs are saved to `backend/uploads/` and served as static files

---

## 4) Frontend Setup and Run

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://127.0.0.1:5173`

---

## Admin Access

Navigate to `/login` to access the admin login page.

After logging in, the navbar top bar shows an **Admin Panel** link and a **Logout** button on every page. The admin panel (`/admin`) allows managing:

- Notices and announcements (`/notices` — also used by the public Notices page)
- News posts, including attachments (`/news` — also used by the public News page)
- Contact info and emergency contacts
- College info cards
- Administration section content
- Academics: NEP info, syllabus uploads, electives, incharges, SWAYAM
- Facility content (description, photos, PDFs, tables, profiles) across all 57 pages
- Student feedback submissions (from the public `/feedback` form)
- MMV Knowledge Base — content intended for a planned AI assistant (not yet built; see below)
- **Content Guide** — the live formatting/syntax reference for admins, also reachable directly at `/admin/content-guide` (see [Content Formatting](#content-formatting-for-admins) above)

Content on any of the 57 pages can be edited by visiting that page while logged in as admin — an **Admin Controls** bar appears at the top with Edit, Upload Photo, and Upload PDF options. Pages with a profile section show an additional **Edit Profile** option.

---



## Default Seed Users

Running `python -m backend.seed` creates a default admin account for local development. The exact email and password are defined in `backend/seed.py` — check that file directly rather than relying on this README, since it may be changed without this doc being updated.

> ⚠️ **Security note:** the seed admin password is currently hardcoded in `backend/seed.py` as plain text. This is fine for local development only. Before deploying anywhere public, change it to a strong, unique password (and ideally move it into `.env` rather than leaving it in source code).

---

## Development Notes

- CORS is restricted via an `ALLOWED_ORIGINS` list defined in `backend/main.py` (`allow_origins=ALLOWED_ORIGINS`, `allow_credentials=True`) — update that list directly in code when adding new frontend origins (e.g. a production domain), rather than reopening it to `["*"]`.
- `SECRET_KEY` must be set via `.env` — the app should not run with a hardcoded or default key in production.
- Database tables are auto-created at backend startup via SQLAlchemy.
- SQLite is used by default; switch to PostgreSQL by setting the `DATABASE_URL` environment variable.
- The frontend proxies API requests to `http://localhost:8000` via Vite config.
- Never commit `.env` to version control. Confirm it's listed in `.gitignore`, and if it was ever committed in the past, rotate `SECRET_KEY` immediately (an old key in git history is still a leaked key, even after deletion).