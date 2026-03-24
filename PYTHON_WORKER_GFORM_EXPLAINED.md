# Python Worker and Google Forms Sync Explained

This document explains how the Python worker in this project helps move registration data from the portal into Google Forms and, from there, into Google Sheets.

It covers:

- the big picture
- the end-to-end registration flow
- how the worker dynamically scans a Google Form to find the right `entry.*` fields
- how statuses, retries, and failures work
- a simple "like I am 7 years old" explanation

## Main Files Involved

- `worker/gform_sync_worker.py`
- `worker/README.md`
- `supabase/sql/23_registration_integration.sql`
- `supabase/sql/24_registration_sync_automation.sql`
- `api/sync-run-once.py`
- `src/admin/pages/Registrations.tsx`

## Big Picture

The worker exists so the portal can register a user immediately in Supabase without waiting for Google Forms.

That means the system does **not** send the form directly from the browser every time a youth registers. Instead:

1. the portal stores the registration in Supabase first
2. the row is marked for sync
3. the Python worker picks it up in the background
4. the worker submits the same information into Google Form
5. Google Form automatically writes the response into the linked Google Sheet

This design makes the system more reliable because the user can still be registered in the portal even if Google Forms is slow, temporarily down, or needs retrying.

## Why The Worker Helps

The Python worker acts like a bridge between two worlds:

- the portal world, where registrations live in Supabase
- the Google world, where responses need to appear in Google Form and Google Sheet

Without the worker:

- the portal would need to submit to Google Form directly at registration time
- the user might wait longer
- any Google Form problem could interrupt the portal registration flow

With the worker:

- the portal saves first and stays fast
- sync happens asynchronously in the background
- failed syncs can be retried
- admins can see whether each row is `pending`, `synced`, `failed`, or `skipped`

## End-To-End Flow

Here is the full process in simple system terms.

### 1. Admin configures the event or program

The admin can set:

- `registration_form_url`
- `registration_sheet_url`
- `external_attendance_enabled`

These are stored on `events` or `programs`.

If sync is enabled and a Google Form URL exists, the registration row will later be queued for worker sync.

### 2. A user registers in the portal

The frontend does not write directly into Google Form.

Instead, it calls Supabase RPC functions:

- `register_for_event_portal(...)`
- `register_for_program_portal(...)`

These functions validate the registration data, then insert or update a row in:

- `event_registrations`
- `program_registrations`

### 3. The database tags the row for sync

When the parent event/program has external attendance sync enabled and a form URL is present, the SQL function sets:

- `source = 'portal_direct'`
- `gform_sync_status = 'pending'`

If sync is not enabled, the row becomes:

- `gform_sync_status = 'skipped'`

This is important: the portal already considers the registration saved even before Google Form is touched.

### 4. The Python worker polls for pending rows

The worker checks both tables:

- `event_registrations`
- `program_registrations`

It only asks for rows where:

- `gform_sync_status = 'pending'`

It processes them oldest first using `registered_at asc`.

### 5. The worker loads the parent event/program settings

For each pending row, the worker fetches the related parent record to get:

- whether sync is enabled
- the Google Form URL
- cached form metadata such as saved entry IDs

### 6. The worker normalizes the Google Form URL

The worker accepts different Google Form URL styles, such as:

- `forms.gle/...`
- `.../viewform`
- `.../edit`
- `.../formResponse`

Then it converts them into the correct submission endpoint:

- `.../formResponse`

If the admin pasted a short `forms.gle` link, the worker follows the redirect first so it reaches the real Google Form URL.

### 7. The worker scans the Google Form structure dynamically

This is the smart part.

Instead of hardcoding every field ID, the worker opens the public Google Form page:

- it converts `formResponse` into `viewform`
- it downloads the HTML of the form page
- it looks for a script variable called `FB_PUBLIC_LOAD_DATA_`
- it parses that embedded JSON-like data

Inside that structure, the worker finds the list of form questions. For each question, it extracts:

- the visible question title
- the hidden Google Forms field ID like `entry.123456789`

So the worker builds a catalog like:

- `entry.111111111 -> Full Name`
- `entry.222222222 -> Email Address`
- `entry.333333333 -> Contact Number`
- `entry.444444444 -> Municipality`
- `entry.555555555 -> Barangay`

That is how it "learns" the shape of the form at runtime.

## How Dynamic Field Matching Works

After building the form catalog, the worker tries to match known portal data to the most likely Google Form field.

It uses title hints, not exact hardcoded field IDs.

### Name matching hints

- `name`
- `full name`
- `first name`
- `last name`
- `pangalan`

### Email matching hints

- `email`
- `e-mail`
- `e mail`
- `gmail`

### Contact number hints

- `contact`
- `contact number`
- `phone`
- `mobile`
- `cell`
- `cp number`
- `number`

### Municipality hints

- `municipality`
- `city`
- `town`
- `munisipyo`

### Barangay hints

- `barangay`
- `brgy`
- `village`

The worker lowercases the question title, cleans spacing, and checks whether one of these hint words appears in the title.

## How It Decides Which Entry IDs To Use

The worker mixes two strategies:

### 1. Reuse configured or cached IDs if they are still valid

The parent event/program record can store:

- `gform_response_url`
- `gform_email_entry_id`
- `gform_name_entry_id`

If those IDs still exist in the scanned form, the worker reuses them.

### 2. Auto-detect missing IDs from the form titles

If the cached IDs are missing, invalid, or empty, the worker tries to find them again from the live form page.

It also prevents duplicate use of the same field by tracking already used `entry.*` IDs.

### Special fallback

If the form has only one question and the worker still cannot find a name field, it assumes that single field is probably the name field.

## What Data The Worker Sends

From the registration row, the worker reads:

- `full_name`
- `email`
- `contact_number`
- `municipality`
- `barangay`

The barangay label is resolved from the related `barangays(name)` relation.

Then it builds the POST payload for Google Form.

The payload always starts with:

- `emailAddress`
- `submit=Submit`

Then it conditionally adds mapped fields such as:

- `entry.xxxxx = full_name`
- `entry.yyyyy = email`
- `entry.zzzzz = contact_number`
- `entry.aaaaa = municipality`
- `entry.bbbbb = barangay`

If a field does not exist in the form, that piece is skipped instead of crashing the whole sync.

## Why This Is Considered Dynamic

The worker is dynamic because it does **not** depend only on fixed, manually typed field IDs.

It can adapt when:

- the admin pastes a `forms.gle` short link
- the form URL is `viewform` instead of `formResponse`
- the form contains matching question titles but the `entry.*` numbers are different
- some optional fields exist in one form but not another

So the worker is not blindly posting static field names. It inspects the real form, discovers the real entry IDs, and maps the portal data to those IDs.

## What Happens After Submission

The worker posts the payload to Google Form's `formResponse` endpoint.

If Google accepts the submission, Google Forms itself handles the next part:

- the response is stored in the form
- the linked Google Sheet is updated automatically by Google

So the worker's job is to push the data into Google Form correctly. It does not write into Google Sheet directly.

## Status Lifecycle

Each registration row can move through these states:

### `pending`

The row is waiting for the worker to sync it to Google Form.

### `synced`

The worker successfully posted the data to Google Form.

The worker also sets:

- `gform_synced_at`

### `failed`

The worker found a non-transient problem, such as:

- missing email
- missing parent record
- invalid Google Form URL
- entry detection failure
- bad HTTP response from the form

The error text is saved in:

- `gform_sync_error`

### `skipped`

The row is intentionally not sent, for example when:

- sync is disabled
- the row source is not `portal_direct`

## Why Only `portal_direct` Rows Are Synced

The worker checks the row `source`.

If the row source is not:

- `portal_direct`

then the worker marks it `skipped`.

This prevents data that came from other pipelines like CSV imports or manual imports from being pushed into Google Form again by mistake.

## Retry Behavior

The worker has two retry layers.

### In the same processing attempt

When posting to Google Form, it tries up to 3 times for transient problems such as:

- connection errors
- timeouts
- HTTP `408`
- HTTP `425`
- HTTP `429`
- HTTP `500`
- HTTP `502`
- HTTP `503`
- HTTP `504`

It waits a little between retries.

### Across future worker cycles

If the error still looks transient after the local retries, the worker does **not** mark the row `failed`.

Instead, it leaves the row as `pending`.

That means the next worker cycle can try again automatically.

This is a very practical design because temporary network issues should not permanently fail a valid registration.

## Worker Run Modes

The worker supports two modes:

### One cycle

```bash
python worker/gform_sync_worker.py --once
```

or

```bash
npm run sync:once
```

### Continuous worker loop

```bash
python worker/gform_sync_worker.py
```

or

```bash
npm run sync:worker
```

In loop mode, it keeps polling every few seconds.

## Environment And Runtime Settings

The worker reads environment variables from:

- project root `.env`
- `worker/.env`

Important values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional tuning values:

- `SYNC_POLL_SECONDS`
- `SYNC_BATCH_SIZE`
- `SYNC_REQUEST_TIMEOUT_SECONDS`

## Admin "Run Sync Now" Button

The admin dashboard includes a "Run Sync Now" action.

That button calls:

- `POST /api/sync-run-once`

The API route does not invent a separate sync system. It imports and reuses the same worker logic:

- `get_config()`
- `SupabaseRestClient`
- `process_pending_batch(...)`

So whether sync is triggered by the background worker or by the admin button, the same core processing rules are used.

## Important Smart Behaviors In The Worker

Here are the strongest design ideas in the worker:

### 1. It keeps the portal responsive

Registration is stored first in Supabase, so the user does not have to wait for Google Form.

### 2. It adapts to real Google Form fields

It reads the form page and discovers the current `entry.*` IDs instead of relying only on hardcoded values.

### 3. It is partly self-healing

If the saved form URL is in a different style, the worker normalizes it.

If cached email/name entry IDs are stale, the worker can rediscover them.

### 4. It updates cached form metadata

When it resolves the normalized response URL and the email/name entry IDs, it saves those back into the parent event/program record.

This helps future runs because the worker starts with better known values next time.

### 5. It separates temporary errors from permanent errors

Transient issues stay `pending`.
Clear data or configuration problems become `failed`.

### 6. It supports both events and programs with the same engine

The worker loops through both registration tables using almost identical logic.

### 7. It avoids repeating unnecessary lookups

The worker keeps a small in-memory cache for parent event/program records during a cycle.

It also uses memoized caches for:

- resolved `forms.gle` redirects
- scanned Google Form entry catalogs

This reduces repeated network requests when many registrations point to the same form.

## Current Limits And Practical Notes

Some important limits are worth noting:

### Only certain fields are auto-mapped

The worker currently targets these types of fields:

- name
- email
- contact number
- municipality
- barangay

If the Google Form asks for other custom questions, the worker will not automatically fill those unless the code is extended.

### Matching depends on question titles

The worker matches fields by human-readable titles.

So your Google Form labels should clearly contain words like:

- `Full Name`
- `Email`
- `Contact Number`
- `Municipality`
- `Barangay`

If the labels are unusual, detection may fail or miss some fields.

### Only email and name IDs are stored back on the parent record

The worker persists:

- normalized response URL
- email entry ID
- name entry ID

Contact, municipality, and barangay IDs are resolved dynamically during processing but are not currently stored back as parent metadata.

### Google Form structure is assumed to be publicly readable

Because the worker scans the `viewform` page, the form must be reachable enough for the worker to read its public structure.

### Dynamic detection depends on Google Form page structure

The parser looks for `FB_PUBLIC_LOAD_DATA_` inside the Google Form page HTML.

That means the dynamic scanner works because Google currently exposes question metadata there. If Google changes that internal page format in the future, the auto-detection logic may need to be updated.

## High-Level Summary

At a high level, the Python worker is a background sync engine.

It watches for pending portal registrations, reads the related event or program settings, opens the target Google Form, discovers which `entry.*` fields belong to Name/Email/Contact/Municipality/Barangay, builds the correct POST payload, submits that payload to Google Form, and then updates the registration row with the final sync result.

In short:

- Supabase is the source of truth for portal registrations
- the Python worker is the delivery bridge
- Google Form is the submission target
- Google Sheet is updated automatically by Google after the form accepts the submission

## Explain It Like You Are 7 Years Old

Imagine your app is a school desk where kids write their names to join an activity.

But the teacher also wants every name copied into a special Google notebook.

The Python worker is like a helper robot.

Here is what the robot does:

1. A kid signs up in the app.
2. The app puts the kid's details in its own class list first.
3. The robot looks for new names that still need to be copied.
4. The robot opens the Google form and reads the labels to find:
   - where the name goes
   - where the email goes
   - where the phone number goes
   - where the town goes
   - where the barangay goes
5. The robot fills in the right boxes.
6. The robot presses submit.
7. Google automatically writes that answer into the Google Sheet notebook.

If the robot cannot do it right now because the internet is sleepy, it tries again later.

If something is really wrong, it writes down an error so the admin can see what happened.

So the worker is basically:

- a smart copier
- a background helper
- a robot that reads the form first before filling the boxes

## One-Sentence Summary

The Python worker makes portal registrations appear in Google Forms and Google Sheets by automatically finding the correct Google Form fields and submitting the right registration data in the background.
