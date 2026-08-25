# Frontend

Next.js (App Router) web UI for the personal task manager. See the repo
root `README.md` and `docs/` for full setup, Docker, and deployment
instructions.

Quick local dev (backend must already be running, see `backend/README`
instructions in the root docs):

```bash
cp .env.local.example .env.local   # point INTERNAL_API_BASE_URL at your backend
npm install
npm run dev
```

Open http://localhost:3000.
