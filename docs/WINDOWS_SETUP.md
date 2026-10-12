# Windows setup

## First-time setup

1. Make sure PostgreSQL is running.
2. Make sure `backend/.env` exists and contains the real PostgreSQL password.
3. From the project root, double-click `setup-windows.cmd`.

The setup script installs backend/frontend dependencies and applies the base schema plus all SQL migrations.

## Start the project

Open two terminals (or double-click the helper files):

- `start-backend.cmd` -> backend on port 5000
- `start-frontend.cmd` -> Vite frontend, normally on port 5173

For PowerShell, use `npm.cmd` rather than `npm` if PowerShell execution policy blocks `npm.ps1`.

## Database commands

From `backend`:

```text
npm.cmd run db:migrate
npm.cmd run db:seed
```

`db:migrate` is safe to run repeatedly. It creates a `schema_migrations` table and applies only migrations that have not been recorded.
