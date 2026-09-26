# ReachInbox Email Scheduler 🚀

Production-grade full-stack email scheduling service + real-time dashboard built for the **ReachInbox Hiring Assignment**.

Built using **TypeScript, Node.js, Express.js, PostgreSQL (Prisma ORM), Redis, BullMQ, Nodemailer (Ethereal Email), Elasticsearch, and React.js (Vite + Tailwind CSS)**.

---

## 🌟 Key Features Implemented

### 🛠️ Backend Features
1. **No-Cron BullMQ Delayed Scheduler**: Accepts single and batch email requests via REST APIs and queues them with precise execution delays using BullMQ on Redis.
2. **PostgreSQL Persistence**: Email job metadata stored persistently in PostgreSQL using Prisma ORM.
3. **Server Restart Recovery**: On backend restart, a recovery service inspects pending `Scheduled` emails and re-registers missing jobs into BullMQ automatically.
4. **Rate Limiting & Order Preserving Rescheduling**:
   - Multi-worker concurrency support (`WORKER_CONCURRENCY=5`).
   - Configurable minimum delay between email sends (e.g. 2 seconds).
   - Redis-backed hourly counter per sender (`MAX_EMAILS_PER_HOUR`).
   - When hourly limit is hit, jobs are **rescheduled to the next hour window** without losing order or dropping jobs.
5. **Live Slack Alerts**:
   - OAuth/Webhook integration (`/api/slack/connect`, `/api/slack/disconnect`, `/api/slack/status`).
   - Sends real-time Slack notifications when a sender hits their hourly rate limit.
6. **Elasticsearch Search Indexing**:
   - Scheduled and sent emails are indexed into Elasticsearch (with in-memory fallback).
   - Full-text search endpoint available at `/api/emails/search?q=...`.
7. **Live BullMQ Board UI**: Real-time queue statistics dashboard exposed at `/admin/queues`.

### 🎨 Frontend Features
1. **Google OAuth & Guest Auth**: User authentication flow showing name, email, and avatar in top header + logout functionality.
2. **Dashboard**: Metrics summary cards (Scheduled, Sent, Failed, Total) auto-refreshing every 5 seconds + quick links.
3. **Compose Email & CSV Lead Upload**:
   - Single and batch email composer.
   - **CSV/TXT Lead File Parser**: Automatically extracts lead email addresses, counts detected leads, and schedules batch campaigns.
   - Throttling & delay configuration controls.
4. **Searchable Email Tables**: Scheduled and Sent email lists with live search, loading indicators, and empty states.
5. **Slack Connection Modal**: Interactive modal in header to connect/manage Slack Webhook for live rate limit alerts.

---

## 🏗️ Architecture Overview

```
User / Lead CSV Upload
         │
         ▼
 ┌─────────────────┐
 │ React Dashboard │
 └────────┬────────┘
          │ POST /api/emails/schedule (-batch)
          ▼
 ┌─────────────────┐       ┌──────────────────────┐
 │ Express API     │ ────> │ PostgreSQL (Prisma)  │
 └────────┬────────┘       └──────────────────────┘
          │
          ├────────────────> ┌──────────────────────┐
          │ (BullMQ Queue)   │ Redis (Jobs & Limits)│
          │                  └──────────┬───────────┘
          ▼                             │
 ┌─────────────────┐                    ▼
 │ BullMQ Worker   │ <──────────────────┘
 └────────┬────────┘
          ├────────────────> ┌──────────────────────┐
          │ (Rate Limit Hit) │ Slack Webhook Alert  │
          │                  └──────────────────────┘
          ├────────────────> ┌──────────────────────┐
          │ (Search Index)   │ Elasticsearch        │
          │                  └──────────────────────┘
          ▼
 ┌─────────────────┐
 │ Nodemailer      │ ────> Ethereal Email SMTP
 └─────────────────┘
```

---

## ⚡ How to Run Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Redis Server (`sudo apt install redis-server`)

### 1. Database & Cache Setup

Ensure Redis and PostgreSQL are running:
```bash
sudo systemctl start redis-server
sudo systemctl start postgresql
```

Create PostgreSQL Database & User:
```bash
sudo -u postgres psql -c "CREATE DATABASE reachinbox_db;"
sudo -u postgres psql -c "CREATE USER reachinbox_user WITH PASSWORD 'password123';"
```

### 2. Backend Setup

Navigate to the `backend` folder:
```bash
cd backend
npm install
```

Configure `backend/.env` file:
```env
DATABASE_URL="postgresql://reachinbox_user:password123@127.0.0.1:5432/reachinbox_db?schema=reachinbox"

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

PORT=5000

# Ethereal Email Credentials
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=ethereal_user@ethereal.email
SMTP_PASS=ethereal_pass

WORKER_CONCURRENCY=5
EMAIL_DELAY_SECONDS=2
MAX_EMAILS_PER_HOUR=10

ELASTICSEARCH_NODE=http://localhost:9200
```

Run database sync & migrations:
```bash
npx prisma db push
```

Start backend development server:
```bash
npm run dev
```
- Backend API: `http://localhost:5000`
- BullMQ Live Dashboard: `http://localhost:5000/admin/queues`

---

### 3. Frontend Setup

Navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Open browser at `http://localhost:5173`.

---

## 🔍 Rate Limiting & Concurrency Design

- **Worker Concurrency**: Set via `WORKER_CONCURRENCY` env variable (default: `5`). Multiple jobs run safely in parallel.
- **Provider Delay**: Minimum delay between emails set via `EMAIL_DELAY_SECONDS` (default: `2` seconds).
- **Hourly Rate Limiter**:
  - Redis counters keyed by `emails:sender:<senderEmail>:<YYYY-MM-DD-HH>`.
  - Incremented atomically on each attempt.
  - If limit exceeded, the job is **not dropped**; instead, it is rescheduled into the next hour window preserving original queue sequence.
  - Triggers a **live Slack alert** to the user's connected Slack webhook.

---

## 📜 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/emails/schedule` | Schedule a single email |
| `POST` | `/api/emails/schedule-batch` | Schedule batch emails from leads |
| `GET` | `/api/emails/scheduled` | Get pending scheduled emails (supports `?q=`) |
| `GET` | `/api/emails/sent` | Get sent & failed email log (supports `?q=`) |
| `GET` | `/api/emails/search` | Search emails using Elasticsearch |
| `GET` | `/api/slack/status` | Get Slack connection status |
| `POST` | `/api/slack/connect` | Connect Slack Webhook |
| `POST` | `/api/slack/disconnect` | Disconnect Slack Webhook |
| `GET` | `/admin/queues` | Live BullMQ Board UI |
