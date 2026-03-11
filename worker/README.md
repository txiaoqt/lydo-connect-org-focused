# Google Form Sync Worker

This worker pushes pending portal registrations to Google Form so they appear in the linked Google Sheet.

## Field Mapping Behavior

- Worker reads Google Form schema from `viewform` and auto-detects question `entry.*` ids.
- It maps and submits:
  - `Name`
  - `Email`
  - `Contact Number`
  - `Municipality`
  - `Barangay`
- Matching is title-based (case-insensitive hints), so your form question labels should include those words.
- If a field does not exist in the form, the worker skips that field and still submits available ones.

## Setup

1. Copy `worker/.env.example` to `worker/.env`.
2. Fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

Install dependencies:

```bash
pip install -r worker/requirements.txt
```

## Run

Single cycle:

```bash
python worker/gform_sync_worker.py --once
```

Continuous daemon:

```bash
python worker/gform_sync_worker.py
```

## Manual Run From Admin (Vercel)

- This repo includes `POST /api/sync-run-once` for one-shot sync trigger from Admin UI.
- Required Vercel server env:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SYNC_TRIGGER_TOKEN`
- Admin UI sends header `x-sync-trigger-token`.
- You can click the button repeatedly; each click processes only current pending rows.

## Requirements

Run these SQL files first:
1. `supabase/sql/23_registration_integration.sql`
2. `supabase/sql/24_registration_sync_automation.sql`

Then in admin:
- set Registration Form URL on event/program
- enable automated Google Form sync
