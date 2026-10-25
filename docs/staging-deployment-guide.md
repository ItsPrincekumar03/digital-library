# Digital Library V1 — Staging Deployment Guide

**Target Version:** 1.0 (Module 15 Verified)  
**System Architecture:** Monolithic Node.js/Express Backend, Vanilla JS Frontend, MySQL 8.x  
**Audience:** Deployment Engineers, System Administrators, Project Reviewers  
**Last Updated:** October 25, 2026  

---

## 1. Architecture Overview

The Digital Library application is deployed as a single-origin or reverse-proxied monolithic system:

```
           [ Client Browser (HTTPS) ]
                       |
                       v
         [ Nginx Reverse Proxy (Port 443) ]
             |                        |
             | /api/*                 | /* (Static Assets)
             v                        v
[ Node.js Monolith (Port 5000) ]  [ /var/www/digital-library/frontend ]
             |
             +---> [ Persistent Storage: /var/www/digital-library/uploads ]
             |          |-- public/
             |          +-- private/
             |
             v
   [ MySQL 8.x Database (Port 3306) ]
```

---

## 2. Server Prerequisites

### 2.1 Hardware Requirements
- **CPU:** 2 vCPU cores minimum (recommended for concurrent PDF text extraction)
- **RAM:** 2 GB minimum (4 GB recommended)
- **Disk:** 20 GB SSD storage (accommodates node_modules, database records, and PDF files)

### 2.2 Software Requirements
- **Operating System:** Ubuntu 22.04 LTS or Debian 12 (Linux), or Windows Server 2022
- **Node.js:** Node.js 18 LTS or Node.js 20 LTS (verified with built-in fetch)
- **Package Manager:** npm 9.x or later
- **Database:** MySQL Server 8.0 or 8.4 LTS
- **Process Manager:** PM2 (`npm install -g pm2`) or systemd
- **Web Server / Reverse Proxy:** Nginx (or Caddy)

---

## 3. Environment Variables Specification

Create a dedicated staging `.env` file in the `backend/` directory (`backend/.env`). **Never commit this file to version control.**

| Variable Name | Required | Default / Staging Value | Description |
|---|:---:|---|---|
| `NODE_ENV` | Yes | `staging` (or `production`) | Enables production optimizations, secure cookies, and compact logging. |
| `PORT` | Yes | `5000` | Port on which Express listens internally. |
| `CORS_ORIGIN` | Yes | `https://staging.digitallibrary.example.com` | Allowed frontend origin. Can be `http://localhost:3000` for local staging. |
| `DB_HOST` | Yes | `localhost` (or database private IP) | Hostname or IP of the MySQL server. |
| `DB_PORT` | Yes | `3306` | MySQL port. |
| `DB_NAME` | Yes | `digital_library` | Database name. |
| `DB_USER` | Yes | `library_staging_user` | Dedicated non-root MySQL user for the application. |
| `DB_PASSWORD` | Yes | *(Strong generated secret)* | Password for the MySQL user. |
| `DB_CONNECTION_LIMIT`| No | `10` | Maximum connections in the `mysql2` pool. |
| `JWT_SECRET` | Yes | *(64-byte random hex string)* | Secret key for signing and verifying JSON Web Tokens. |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiration period. |
| `COOKIE_SECRET` | Yes | *(32-byte random hex string)* | Secret for signing session cookies. |

### Generating Cryptographic Secrets
Use Node's built-in `crypto` module to generate staging secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Step-by-Step Staging Setup

### Step 1: Clone Repository & Checkout Tag/Branch
```bash
git clone https://github.com/ItsPrincekumar03/digital-library.git /var/www/digital-library
cd /var/www/digital-library
git checkout main
```

### Step 2: Install Backend Dependencies
```bash
cd /var/www/digital-library/backend
npm ci --omit=dev
```

### Step 3: Configure Storage Directories & Permissions
The backend stores uploaded public and private PDFs and processed JSON files in `uploads/`. Ensure proper directory structure and write permissions:
```bash
mkdir -p /var/www/digital-library/uploads/public
mkdir -p /var/www/digital-library/uploads/private

# Grant ownership to node process user (e.g. www-data or nodejs)
chown -R www-data:www-data /var/www/digital-library/uploads
chmod -R 750 /var/www/digital-library/uploads
```

### Step 4: Provision MySQL Database & User
Log in to MySQL as root:
```sql
CREATE DATABASE IF NOT EXISTS digital_library 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'library_staging_user'@'localhost' 
  IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

GRANT ALL PRIVILEGES ON digital_library.* TO 'library_staging_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 5: Run Database Migrations
Initialize the schema and apply all migration files:
```bash
cd /var/www/digital-library/backend
npm run migrate
```

Verify that all tables exist:
```bash
mysql -u library_staging_user -p digital_library -e "SHOW TABLES;"
```
Expected: 16 tables (`users`, `books`, `authors`, `categories`, `chapters`, `private_books`, etc.).

### Step 6: Create or Seed Demo Accounts
To seed the initial administrative and demo user accounts:
```bash
npm run seed:dev
```
Or create a staging administrator using the registration API and promote via MySQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@staging.digitallibrary.example.com';
```

---

## 5. Process Management (PM2)

Using PM2 ensures the backend process automatically restarts on failure and persists across server reboots.

### PM2 Configuration (`ecosystem.config.js`)
Create `/var/www/digital-library/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: "digital-library-api",
      cwd: "/var/www/digital-library/backend",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "staging"
      }
    }
  ]
};
```

### Start & Enable Service
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 6. Reverse Proxy Configuration (Nginx)

Nginx serves frontend static assets directly, handles SSL termination, and proxies API requests to Express on port 5000.

Create `/etc/nginx/sites-available/digital-library-staging`:
```nginx
server {
    listen 80;
    server_name staging.digitallibrary.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.digitallibrary.example.com;

    ssl_certificate /etc/letsencrypt/live/staging.digitallibrary.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.digitallibrary.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Maximum file upload size (matches backend 50MB limit)
    client_max_body_size 55M;

    # Frontend Static Files
    root /var/www/digital-library/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # API Proxy to Express Monolith
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Disable proxy buffering for streaming/large payloads
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

Enable the configuration:
```bash
ln -s /etc/nginx/sites-available/digital-library-staging /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 7. Staging Verification & Smoke Testing

Immediately after deployment, run the automated verification checks:

### 7.1 Backend Health Endpoints
```bash
curl -i https://staging.digitallibrary.example.com/api/health
# Expected: HTTP 200 {"success":true,"message":"Server is running."}

curl -i https://staging.digitallibrary.example.com/api/health/db
# Expected: HTTP 200 {"success":true,"message":"Database connected successfully."}
```

### 7.2 Run Automated Test Suites
From the staging server backend directory:
```bash
npm test
```
All 4 test suites must exit with status code 0 (100% pass).

---

## 8. Backup & Maintenance Plan

### 8.1 Database Backups
Create daily automated backups using `mysqldump`:
```bash
mysqldump -u library_staging_user -p'PASSWORD' digital_library | gzip > /var/backups/digital_library_$(date +%F).sql.gz
```

### 8.2 File Upload Storage Backups
Synchronize the persistent upload directory:
```bash
rsync -avz /var/www/digital-library/uploads/ /var/backups/digital-library-uploads/
```

### 8.3 Rollback Procedure
If a regression is identified in staging:
1. Revert Git repository to the previous confirmed commit:
   ```bash
   git checkout <PREVIOUS_COMMIT_HASH>
   ```
2. Re-run migrations or rollback script if schema changes occurred.
3. Restart process:
   ```bash
   pm2 restart digital-library-api
   ```
4. Verify `/api/health` and `/api/health/db`.
