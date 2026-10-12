# Database Setup Guide

## 1. Install PostgreSQL

- **Windows/Mac**: download from https://www.postgresql.org/download/
- **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`

Confirm it's running:
```bash
psql --version
```

## 2. Create the database

```bash
# Log in as the postgres superuser
sudo -u postgres psql

# Inside psql:
CREATE DATABASE agri_supply_chain;
CREATE USER agri_user WITH ENCRYPTED PASSWORD 'change_this_password';
GRANT ALL PRIVILEGES ON DATABASE agri_supply_chain TO agri_user;
\q
```

Or, if you're fine using the default `postgres` user for a LAN demo/exhibition setup, just:
```bash
createdb agri_supply_chain
```

## 3. Load the schema

From the project root:
```bash
psql -U agri_user -d agri_supply_chain -f database/schema.sql
```

This creates all 21 tables (users, roles, farmers, farms, products, batches, warehouses, inventory, shipments, vehicles, orders, retailers, tracking_history, notifications, qr_codes, activity_logs, images, and supporting tables), indexes, and the `updated_at` triggers.

## 4. Load seed data

```bash
psql -U agri_user -d agri_supply_chain -f database/seed.sql
```

This inserts the 7 roles and a default admin account:
- Email: `admin@agrichain.local`
- Password: `Admin@12345`

**Change this password immediately after your first login** via the reset-password flow.

## 5. Point the backend at your database

Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agri_supply_chain
DB_USER=agri_user
DB_PASSWORD=change_this_password
```

## 6. Verify the connection

```bash
cd backend
npm run dev
```

You should see `Database connection verified.` in the console. If you instead see a connection error, double check that PostgreSQL is running (`sudo systemctl status postgresql` on Linux) and that the credentials in `.env` match what you created above.

## Backup & Restore (for the Admin > Backup Database feature)

```bash
# Backup
pg_dump -U agri_user agri_supply_chain > backup_$(date +%Y%m%d).sql

# Restore
psql -U agri_user -d agri_supply_chain -f backup_20260712.sql
```
