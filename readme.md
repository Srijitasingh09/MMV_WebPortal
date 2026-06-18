# MMV WebPortal — Mahila Mahavidyalaya, BHU

Official web portal for Mahila Mahavidyalaya (Women's College), Banaras Hindu University, Varanasi.

Built with a **React + Vite** frontend, **FastAPI** backend, and **SQLite** database.

---

## Project Structure

```
MMV_WebPortal/
├── backend/                  # FastAPI app
│   ├── main.py               # App entry point, all API routes
│   ├── models.py             # SQLAlchemy database models
│   ├── auth.py               # JWT authentication
│   ├── seed.py               # Seed initial admin/student users
│   ├── seed_v2.py            # Seed additional sample data
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React + Vite client
    └── src/
        ├── app.jsx                        # Route definitions
        ├── components/
        │   ├── NAVBAR.JSX                 # Navigation bar (all 57 links)
        │   ├── Layout.jsx                 # Wraps navbar + footer around pages
        │   ├── footer.jsx                 # Site footer
        │   └── Sidebar.jsx                # Admin sidebar
        └── pages/
            ├── home.jsx                   # Home page
            ├── about.jsx                  # About MMV page
            ├── generic.jsx                # ★ Single template for all 57 content pages
            ├── administrationrouted.jsx   # Route config for Administration section
            ├── academicsrouted.jsx        # Route config for Academics section
            ├── facilitiesrouted.jsx       # Route config for Facilities section
            ├── AdminDashboard.jsx         # Admin control panel
            └── LoginPage.jsx              # Admin login
```

---

## How the 57-Page System Works

Instead of building 57 separate pages, the portal uses a **single template** (`generic.jsx`) powered by three router config files.

### The flow

```
URL → Router File → generic.jsx (template) → Backend API → Database
```

1. A navbar link sends the user to a URL like `/facilities/hostels/kirtikunj`
2. The matching router file (`facilitiesrouted.jsx`) looks up that URL in its config table and reads the `pageType`
3. `generic.jsx` receives the config as props and renders accordingly
4. It fetches the actual content (text, photo, PDF, table data) from the backend API

### Page types available

| `pageType` value          | What appears on the page |
|---|---|
| `description`             | Text content box only |
| `photo-description`       | Photo on the left + text on the right |
| `description-table`       | Text box + data table below |
| `pdf-list`                | PDF upload and viewer |
| `photo-description-table` | Photo + text + table |

### Adding or changing a page

To change what a page shows (e.g. remove a table, add a photo), edit **only the router file** for that section. Example in `facilitiesrouted.jsx`:

```js
// Change this page from a table to just a description:
'hostels/kirtikunj': { title: 'Kirti Kunj Hostel', pageType: 'description' },

// Or make it show a PDF:
'hostels/kirtikunj': { title: 'Kirti Kunj Hostel', pageType: 'pdf-list' },
```

To add a brand new page, add one line to the router file and add its link to `NAVBAR.JSX`.

---

## Content Formatting (for Admins)

When editing any page's description in the admin controls, use this simple shorthand:

| What you type              | How it appears |
|---|---|
| First line of content      | Large centered heading with underline |
| `## Section Title`         | Navy subheading |
| `### Smaller Title`        | Smaller dark subheading |
| `- Item`                   | Bullet point |
| `**Bold text**`            | Bold emphasized line |
| `> Some note`              | Highlighted callout box with left border |
| `---`                      | Horizontal divider |
| Blank line                 | Vertical spacing |
| Anything else              | Normal left-aligned paragraph |

Example:

```
Kirti Kunj Hostel

## About
Established in 1985, one of the oldest hostels on campus.

## Facilities
- 24-hour hot water
- Wi-Fi on all floors

> Visitors allowed only between 4 PM and 6 PM on weekdays.

**Warden:** Dr. Anita Singh — 9876543210
```

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

Optional environment variable:

- `DATABASE_URL` — defaults to `sqlite:///./college_portal.db` if not set

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
uvicorn backend.main:app --reload
```

- API runs at: `http://127.0.0.1:8000`
- Interactive API docs: `http://127.0.0.1:8000/docs`

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

- Notices and announcements
- Courses and subjects
- Professors
- Clubs and events
- Facilities
- Hostel documents
- College info cards
- Academic calendar PDFs
- MMV Knowledge Base (used by AI assistant)
- College images

Content on any of the 57 pages can be edited by visiting that page while logged in as admin — an **Admin Controls** bar appears at the top with Edit, Upload Photo, and Upload PDF options.

---

## Default Seed Users

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bhu.ac.in` | `admin123` |

> Use only for local development and testing.

---

## Development Notes

- CORS is open (`allow_origins=["*"]`) for local development — restrict before deploying to production.
- Database tables are auto-created at backend startup via SQLAlchemy.
- SQLite is used by default; switch to PostgreSQL by setting the `DATABASE_URL` environment variable.
- The frontend proxies API requests to `http://localhost:8000` via Vite config.