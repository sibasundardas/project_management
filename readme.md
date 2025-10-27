# Project Management Tool (Flask + MySQL + React)

A lightweight project manager with JWT auth, roles (Admin/Manager/Developer), projects, tasks, comments, basic metrics, and an optional AI user‑story generator.  

## Live Demo Links
- Frontend Application (Vercel): https://siba-pm.vercel.app/
- Backend API (Railway): https://pm-backend-production-1772.up.railway.app/

## How to run (very short)

Backend (Flask + MySQL)
- Create venv
  - Windows (PowerShell): `python -m venv .venv && .\.venv\Scripts\Activate.ps1`
  - macOS/Linux: `python3 -m venv .venv && source .venv/bin/activate`
- Install deps: `pip install -r requirements.txt`
- Create backend/.env
  - DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST:3306/DB_NAME
  - SECRET_KEY=your-secret
  - JWT_SECRET_KEY=your-jwt-secret
  - (Optional) GROQ_API_KEY=your-groq-key
- Init DB and run
  - Quick: `python app.py`
  - Or one-time init (if provided): `python init_db.py`

Frontend (React + Vite)
- From frontend/: `npm install`
- Install required packages:
  - `npm install react-router-dom`
  - `npm install react-toastify`
- Configure API base:
  - If using `src/api.js`, set `BASE` (or Vite `VITE_API_BASE`) to your backend URL
- Start dev: `npm run dev`

Deploy notes
- Vercel (frontend): set `VITE_API_BASE` to your backend URL in project settings
- Railway/Render (backend): set `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, and optionally `GROQ_API_KEY` as environment variables; start with `gunicorn wsgi:application` or `python app.py`

## API endpoints (short)

Auth
- POST `/api/auth/register` → create user { full_name, email, password, role }
- POST `/api/auth/login` → { access_token, user }

Users (JWT)
- GET `/api/users/` → list users
- DELETE `/api/users/{id}` → delete user (Admin)

Projects (JWT)
- POST `/api/projects/` → create (Admin/Manager)
- GET `/api/projects/` → list
- DELETE `/api/projects/{id}` → delete (Admin)
- GET `/api/projects/{id}/metrics` → totals/overdue

Tasks (JWT)
- POST `/api/tasks/` → create (Admin/Manager)
- GET `/api/tasks/` → list (RBAC)
- PATCH `/api/tasks/{id}/status` → TODO/IN_PROGRESS/DONE
- DELETE `/api/tasks/{id}` → delete (Admin/Manager)

Comments (JWT)
- GET `/api/comments/task/{taskId}` → list comments
- POST `/api/comments/task/{taskId}` → add { content }
- DELETE `/api/comments/{id}` → delete (author/Admin)

Groq AI
- POST `/api/ai/generate-user-stories` → { project_id, projectDescription, create_tasks? }

Note: Send `Authorization: Bearer <token>` for protected routes (token from `/api/auth/login`).


## Author

- Name: Siba Sundar Das
- Email: sibasundardas2004@gmail.com
- LinkedIn: https://www.linkedin.com/in/siba-sundar-das
- Portfolio: https://sibasundardas.github.io/portfolio/
- GitHub: https://github.com/sibasundardas
