# Registration Automation Workflow (Events and Programs)

This project now supports asynchronous Google Form/Sheet sync for portal registrations.

## Components

- Frontend portal (user + admin)
- Supabase (events/programs + registrations)
- Google Form (target form submission endpoint)
- Google Sheet (linked response sheet)
- Python worker (`worker/gform_sync_worker.py`)

## Database Fields Used

### Parent records (`events`, `programs`)
- `registration_form_url`
- `registration_sheet_url`
- `external_attendance_enabled`
- `gform_response_url`
- `gform_email_entry_id`
- `gform_name_entry_id`

### Registration records (`event_registrations`, `program_registrations`)
- `source` (`portal_direct|admin_csv_sync|imported`)
- `gform_sync_status` (`pending|synced|failed|skipped`)
- `gform_sync_error`
- `gform_synced_at`

## Migration Order (new)

After your existing applied scripts, run:
1. `supabase/sql/23_registration_integration.sql`
2. `supabase/sql/24_registration_sync_automation.sql`

## Registration Flow

1. User submits registration in portal.
2. RPC writes registration row and sets:
   - `source='portal_direct'`
   - `gform_sync_status='pending'` when sync is enabled and form URL is configured.
3. User immediately appears registered in portal/profile (Supabase row already exists).
4. Worker polls pending rows and submits them to Google Form `formResponse`.
   - Worker auto-detects form `entry.*` fields from `viewform` and maps Name/Email/Contact Number/Municipality/Barangay when present.
5. Google Form writes to linked Google Sheet automatically.
6. Worker marks row `synced` (or `failed`/`skipped`).

## Admin Flow

1. Admin configures event/program:
   - Registration Form URL
   - Registration Sheet URL (optional preview source)
   - Enable automated Google Form sync
2. Admin checks `Registrations` page:
   - local portal registrations
   - sync status per row
   - retry failed rows
   - optional external sheet preview

## Worker Run Modes

- One cycle:
```bash
npm run sync:once
```

- Continuous:
```bash
npm run sync:worker
```

## Worker Environment

Create `worker/.env` from `worker/.env.example` and set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional:
  - `SYNC_POLL_SECONDS`
  - `SYNC_BATCH_SIZE`
  - `SYNC_REQUEST_TIMEOUT_SECONDS`
