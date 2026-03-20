# Panel Security Answers for LYDO Connect

## Short Answer You Can Say First

Our system protects sensitive data using layered security, not just one defense. We use authenticated user accounts through Supabase Auth, role-based access control, and Row-Level Security (RLS) at the database level so users can only access data they are authorized to see. We also validate inputs on both the client side and the database side, use controlled database functions for critical actions like event and program registration, log admin activity through audit logs, restrict file uploads by type and size, and protect the sync endpoint with a secret token.

Most importantly, our security is enforced in the database, not only in the interface. That means even if someone tries to bypass the frontend, the database policies still block unauthorized reads and writes.

## Direct Answers to Common Panel Questions

### 1. How do you protect sensitive data from hackers?

We protect sensitive data through multiple layers:

- User authentication is handled through Supabase Auth, so normal users must sign in before accessing account-based features.
- Access is controlled with role-based permissions such as `admin`, `staff`, `sk`, and `youth`.
- Row-Level Security is enabled on the database tables, so a user can only read or modify rows allowed by policy.
- Sensitive operations, such as registration and ticket tracking, are handled through database functions with validation and permission checks.
- Admin actions are recorded in audit logs, so changes are traceable by actor, timestamp, table, and data change.
- The sync endpoint for registration automation requires a secret trigger token and only accepts authorized POST requests.
- File uploads are restricted to allowed MIME types and a file size limit.
- The deployed app adds browser security headers such as `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.

### 2. How can you ensure that the data is safe?

I ensure data safety by enforcing security in the backend database itself:

- Users can only access their own profile, registrations, and ticket records unless they have higher roles like admin or staff.
- Public information is separated from protected records through explicit database policies.
- Required fields, formats, and business rules are validated before data is stored.
- Foreign keys, unique constraints, and check constraints protect the integrity of the stored data.
- Audit logging helps detect and investigate suspicious or unauthorized changes.
- Server-side secrets like the Supabase service-role key are used only in backend worker/API code, not in normal user-facing database operations.

### 3. How do you prevent SQL injection?

Yes, SQL injection risk is reduced in the current system because:

- The frontend does not build raw SQL strings from user input.
- Database access is done through the Supabase client query builder and RPC calls instead of manual string-concatenated SQL queries.
- Critical operations such as `register_for_event_portal`, `register_for_program_portal`, `retry_registration_sync`, and `track_citizen_ticket` use typed database function parameters.
- The SQL in those functions is static and uses validated parameters, not dynamic SQL built from user input.

So if the panel asks, a strong answer is:

> We do not rely on raw handwritten SQL from the frontend. We use Supabase query APIs and typed database functions, which greatly reduces SQL injection risk. In addition, database-side validation and RLS still protect the data even if someone tries to bypass the UI.

### 4. What if someone bypasses the UI and calls the database directly?

The frontend alone is not the security boundary. The real security boundary is the database:

- Row-Level Security policies are enabled on the tables.
- Policies check `auth.uid()` and role membership before allowing access.
- Only authorized roles can manage admin-controlled records.
- Users are limited to their own records for self-service data like profiles and registrations.

So even if someone bypasses the interface, unauthorized database actions are still blocked by policy.

### 5. How do you control admin access?

In the secure design, admin access is controlled by:

- Role membership stored in `roles` and `user_roles`
- Role checks through the `current_user_has_any_role(...)` database function
- Admin-only or staff-only RLS policies on protected tables
- Route-level separation between user and admin surfaces
- Audit logging of admin-managed data changes

If asked for the strongest line:

> Admin access is not just hidden in the UI. It is enforced by role checks and Row-Level Security in the database.

### 6. How do you monitor or trace changes?

We implemented audit logging:

- Insert, update, and delete actions on admin-managed tables are logged.
- Logs include actor identity, actor role, operation, affected table, primary key, and old/new values.
- Audit logs themselves are protected by RLS and are only readable by authorized roles.

This supports accountability, traceability, and investigation if something suspicious happens.

### 7. What validations do you have before data is stored?

The system validates both in the frontend and the database:

- Registration forms validate full name, email, municipality, barangay, and PH mobile number format.
- Database registration functions validate authentication, event/program existence, status, capacity, and required field formats.
- URL fields for external Google Forms and Google Sheets are checked against allowed patterns.
- Storage uploads are limited by allowed file types and file size.
- Database check constraints enforce safe ranges and valid state values.

### 8. How do you protect uploaded files and transparency documents?

The system has dedicated upload controls:

- A dedicated storage bucket is used for transparency documents.
- File size is limited to 50 MB.
- Allowed MIME types are explicitly whitelisted.
- Filenames are sanitized before upload.
- Document metadata is stored separately in the database with structured fields.

## Complete List of Security Controls Currently Present in the Codebase

### A. Authentication and Identity

- Supabase Auth is used for user sign-in and sign-up.
- User sessions are managed through the Supabase client.
- New sign-ups automatically create a profile record and default `youth` role through a database trigger.
- User passwords for normal users are not stored in custom application tables in the frontend code.

### B. Role-Based Access Control

- Roles are modeled explicitly in the database: `admin`, `staff`, `sk`, and `youth`.
- Role checks are centralized through `current_user_has_any_role(...)`.
- Role management is restricted so only admin can fully manage role definitions.
- User-role mappings are protected by policies.

### C. Row-Level Security

- RLS is enabled across core public tables.
- Public content tables allow public read but restrict write access to authorized roles.
- User profile access is limited to the record owner or authorized staff/admin roles.
- Registration and membership records are limited to the owner or authorized admin/staff/SK roles.
- Citizen tickets are limited to the creator or authorized staff/admin roles.
- Audit logs are restricted to authorized roles.

### D. Query and Injection Safety

- No raw user-built SQL queries are used in the frontend application code.
- Database operations are performed through Supabase query methods and RPC functions.
- Critical write flows use typed database functions instead of raw SQL.
- Dynamic SQL appears only in migration setup scripts and is not built from end-user input.

### E. Input Validation

- Client-side validation exists for registration form values.
- Database-side validation covers authentication requirement, valid event/program existence, open/closed registration status, capacity limits, valid email format, valid PH mobile number format, and municipality requirement.
- Ticket tracking requires both reference number and requester email.

### F. Data Integrity Controls

- Foreign keys link records to valid parent records.
- Unique constraints prevent duplicate active memberships and duplicate active registrations.
- Check constraints validate positive capacity, valid year ranges, valid month ranges, valid completion percentages, valid latitude and longitude ranges, valid time ordering, valid date ordering, allowed registration source values, and allowed sync status values.

### G. Audit and Accountability

- Row-level audit logging is implemented.
- Audit logging captures actor identity, role, claims, operation, target table, primary key, and changed fields.
- Internal audit helper functions are not left openly executable.
- Audit log reads are protected by RLS.

### H. Ticket and Reference Security

- Ticket reference numbers are generated on the server side.
- Citizen ticket defaults are handled by triggers.
- Ticket tracking is done through a database function instead of exposing unrestricted ticket table reads.

### I. File Upload Security

- A dedicated `transparency-documents` bucket is defined.
- Uploads are limited to approved MIME types.
- Uploads are limited to a file size cap.
- Filenames are sanitized before upload.

### J. API and Secret Handling

- The registration sync worker uses the Supabase service-role key only in backend Python code.
- The `/api/sync-run-once` endpoint requires a secret `x-sync-trigger-token`.
- The endpoint rejects unauthorized requests and disallows GET for execution.

### K. Surface Reduction and Browser Protections

- The app supports split deployment surfaces: `user`, `admin`, and `combined`.
- In split mode, user routes and admin routes can be separated to reduce exposed attack surface.
- The deployment includes these response headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: origin-when-cross-origin`.

## Best Counter Statements You Can Use in Defense

If the panel asks aggressively, these are good counter lines:

- `Security is enforced at the database level, not only in the frontend.`
- `Even if someone bypasses the UI, Row-Level Security still blocks unauthorized access.`
- `We do not build raw SQL from user input; we use Supabase query APIs and typed RPC functions.`
- `Critical actions are validated twice: first in the client, then again in the database.`
- `Admin changes are auditable because we log who changed what, when, and in which table.`
- `We also protect integrations through a tokenized backend endpoint instead of exposing the service-role key to regular users.`

## Important Honesty Notes for the Panel

These are very important so you do not overclaim.

### 1. Do not present the local predefined admin login as a production-grade security feature

The repo currently contains a frontend local admin mode with hardcoded credentials and a localStorage session flag. That is acceptable only for demo or local development, not as a production security control.

Safe way to say it:

> For production, the intended secure approach is authenticated admin accounts with database-enforced roles and RLS. The local predefined admin mode is only a demo/development convenience and should be disabled in deployment.

### 2. Do not claim anon-admin policies as strong production security

Some optional SQL files intentionally allow `anon` access to manage admin data so the frontend-only demo admin can work. Those files are clearly labeled as development/demo use. If those are enabled in production, security becomes weaker.

Safe way to say it:

> The secure production configuration relies on authenticated RBAC and RLS. Demo-only anon-manage policies should not be enabled in production.

### 3. Do not claim features that are not proven in this repo

Do not say the system already has these unless you separately configured them:

- multi-factor authentication
- rate limiting
- WAF or IDS/IPS
- full Content Security Policy
- encryption-at-rest configuration details
- automatic attack detection dashboards

You can say:

> Those can be added as further hardening, but they are not the main controls shown directly in this codebase.

### 4. Do not expose the sync trigger token in a frontend environment variable in production

The sync endpoint is protected by a secret token, but that token should remain secret. If it is placed in a `VITE_` environment variable, it becomes part of the frontend bundle and is no longer a true server-side secret.

Safe way to say it:

> In production, the sync token should be stored only on the server side or entered securely by an authorized admin, not embedded into the public frontend bundle.

## Strong Final Answer for Oral Defense

If I had to summarize our data protection in one statement, I would say this:

> Our system protects sensitive data through defense in depth. We use authenticated access, role-based permissions, Row-Level Security, database-side validation, controlled RPC functions, audit logging, secure integration tokens, restricted uploads, and browser security headers. We also avoid raw SQL from user input, which helps reduce SQL injection risk. Most importantly, access control is enforced in the database itself, so security does not depend only on the frontend interface.

## Code Evidence Used for This Answer

- `src/lib/supabase.ts`
- `src/hooks/use-auth.tsx`
- `src/lib/admin-auth.ts`
- `src/lib/deployment-surface.ts`
- `src/lib/registration-validation.ts`
- `src/hooks/use-user-profile.ts`
- `src/lib/data-api.ts`
- `api/sync-run-once.py`
- `worker/gform_sync_worker.py`
- `vercel.json`
- `supabase/sql/04_functions_triggers.sql`
- `supabase/sql/06_rls_policies.sql`
- `supabase/sql/08_privileges.sql`
- `supabase/sql/12_admin_accounts.sql`
- `supabase/sql/14_admin_portal_anon_manage_policies.sql`
- `supabase/sql/15_transparency_upload_and_user_manage.sql`
- `supabase/sql/16_user_profile_delete_removes_auth_user.sql`
- `supabase/sql/17_admin_citizen_tickets_anon_manage.sql`
- `supabase/sql/21_program_registrations.sql`
- `supabase/sql/22_audit_logs.sql`
- `supabase/sql/23_registration_integration.sql`
- `supabase/sql/24_registration_sync_automation.sql`
- `supabase/sql/25_admin_portal_anon_registration_policies.sql`
- `supabase/sql/26_program_registration_membership_fix.sql`
