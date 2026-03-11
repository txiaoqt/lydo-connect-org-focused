# System Unique Features, Modules, and API Surface

Based on the current implementation in this repository.

## Unique Features (Practical Differentiators)

1. Source-post-first publishing with Facebook embed intelligence.
- Accepts Facebook links, normalizes permalink formats, detects non-embeddable share links, and still provides source fallback access.
- References:
  - `src/lib/source-post.ts`
  - `src/components/SourcePostEmbed.tsx`

2. Unified Event/Program record page with `Details | Registration` mode.
- One record experience handles both events and programs, including in-page registration/cancellation.
- Reference: `src/pages/EventRecord.tsx`

3. Program registration plus membership sync.
- Tracks both `program_registrations` and `user_program_memberships` lifecycle, not only event registrations.
- References:
  - `src/hooks/use-user-profile.ts`
  - `supabase/sql/21_program_registrations.sql`

4. Full transparency stack in one system.
- Disclosure registry, financial dashboard, quarterly board, monthly compliance, barangay map, citizen desk.
- This all-in-one packaging is a key differentiator compared to isolated modules in other portals.
- Reference: `src/App.tsx`

5. Human-readable audit trail with highlighted changes.
- Audit UI shows who changed what, section labels, changed fields, before/after values, and record snapshot.
- References:
  - `src/admin/pages/AuditLogs.tsx`
  - `supabase/sql/22_audit_logs.sql`

6. Citizen Desk with auto reference generation and secure tracking RPC.
- Automatic `LYDO-######` ticket references and tracking by reference plus requester email.
- Reference: `supabase/sql/04_functions_triggers.sql`

7. Admin PWA mode.
- Separate admin manifest/theme plus install prompt support in admin UI.
- References:
  - `src/admin/AdminPortal.tsx`
  - `public/manifest-admin.webmanifest`
  - `src/admin/components/TopNav.tsx`

## System Modules

### 1. Public/User Side

- Home / About
- Programs + Program Record + Program Registration
- Events + Event Record + Event Registration
- Organizations (join/leave)
- Profile (settings + joined history)
- Transparency Reports
- Transparency Board (Full Disclosure + Monthly Compliance)
- Financial Disclosure
- Barangay Map
- Citizen Desk + Ticket Tracking + My Tickets
- Service Advisories
- Authentication (Sign In / Sign Up)

### 2. Admin Side

- Dashboard
- Programs management
- Events management
- Organizations management
- Barangay map data + resident editing
- Transparency documents management (with upload)
- Transparency Board Config
- Financial DSS (dashboard, budget setup, financial rows)
- Citizen Desk admin handling
- Users management
- Roles and permissions
- Audit Logs

Reference: `src/admin/AdminPortal.tsx`

## API and Data Layer Surface

### 1. API Architecture

- Frontend calls Supabase directly using `supabase-js`.
- The app API surface is mainly:
  - Supabase PostgREST table endpoints
  - Supabase RPC functions
  - Supabase Storage API

Reference: `src/lib/data-api.ts`

### 2. Client Service Methods (Current App-Level API)

From `src/lib/data-api.ts`:

- `fetchPrograms`
- `fetchEvents`
- `fetchEventById`
- `fetchOrganizations`
- `fetchDisclosureRegistry`
- `fetchTransparencyKpis`
- `fetchServiceAdvisories`
- `fetchTicketTypeOptions`
- `submitCitizenTicket`
- `trackCitizenTicket`
- `fetchMyCitizenTickets`
- `fetchFinancialDashboardData`
- `fetchComplianceBoardData`
- `fetchMonthlyComplianceData`

### 3. Supabase Functions, RPC, and Views

From SQL migrations:

- Functions:
  - `set_updated_at()`
  - `current_user_has_any_role(...)`
  - `generate_ticket_reference()`
  - `set_citizen_ticket_defaults()`
  - `handle_new_auth_user()`
  - `track_citizen_ticket(...)` (RPC target)
  - `log_audit_change()`
- Views:
  - `transparency_kpis`

References:
- `supabase/sql/04_functions_triggers.sql`
- `supabase/sql/22_audit_logs.sql`

### 4. Core Database Modules (Tables)

- Identity/RBAC:
  - `roles`
  - `user_roles`
  - `user_profiles`
  - `admin_accounts`
- Youth core:
  - `programs`
  - `events`
  - `organizations`
- Participation:
  - `event_registrations`
  - `program_registrations`
  - `user_program_memberships`
  - `user_org_memberships`
- Transparency:
  - `disclosure_documents`
  - `document_downloads`
  - `compliance_board_status`
  - `monthly_compliance`
- Finance and metrics:
  - `barangay_financials`
  - `barangay_youth_metrics`
- Citizen service:
  - `ticket_types`
  - `citizen_tickets`
  - `service_advisories`
- Audit:
  - `audit_logs`

References:
- `supabase/sql/01_core_tables.sql`
- `supabase/sql/02_youth_tables.sql`
- `supabase/sql/03_transparency_tables.sql`
- `supabase/sql/21_program_registrations.sql`
- `supabase/sql/22_audit_logs.sql`

### 5. External Integrations

- Facebook embed plugin URLs for official source posts
- OpenStreetMap tiles
- Nominatim geocoding and reverse-geocoding
- Google Maps direction link-out

References:
- `src/lib/source-post.ts`
- `src/components/LocationPreviewButton.tsx`
- `src/pages/BarangayMap.tsx`

