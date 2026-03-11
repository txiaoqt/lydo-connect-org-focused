# System Unique Workflows

This document lists the implementation-specific workflows that make this system distinct from common youth/event portals.

## Workflow 1: Source-Post-First Content Publishing and Display

Goal: Publish events/programs from official Facebook source links while still showing local structured details.

Actors: Admin, Youth user/public viewer.

Flow:
1. Admin creates/updates a Program or Event and stores `source_post_url`.
2. User opens the details page (`/programs/:id` or `/events/:id`).
3. System normalizes the URL, checks Facebook format compatibility, and builds embed config.
4. If embeddable, iframe preview is shown; if not, system shows a clear guidance fallback and still provides source link.
5. Local summary and structured record data (date/time/location/registration) remain available regardless of embed success.

Automation points:
1. URL normalization and share-link detection.
2. Automatic embed type selection (`post` vs `video`).
3. Graceful fallback messaging for non-embeddable formats.

Data/API touched:
1. `programs.source_post_url`
2. `events.source_post_url`
3. Facebook plugin URLs

References:
1. `src/lib/source-post.ts`
2. `src/components/SourcePostEmbed.tsx`
3. `src/pages/EventRecord.tsx`

## Workflow 2: Unified Details and Registration Record Flow (Program and Event)

Goal: Use one record experience for both program and event, with `Details | Registration` mode.

Actors: Youth user/public viewer.

Flow:
1. User opens a record page.
2. System resolves whether the record is an Event or Program.
3. UI provides two modes:
4. `Details` mode shows local summary and official source context.
5. `Registration` mode shows registration form or registered state.
6. User can register/unregister without leaving the page.

Automation points:
1. Record kind fallback resolution (`event` then `program`).
2. Dynamic form behavior based on registration state.

Data/API touched:
1. `events`
2. `programs`
3. `event_registrations`
4. `program_registrations`

References:
1. `src/pages/EventRecord.tsx`
2. `src/lib/data-api.ts`
3. `src/hooks/use-user-profile.ts`

## Workflow 3: Program Registration and Membership Synchronization

Goal: Keep program registration status and membership state synchronized.

Actors: Youth user.

Flow:
1. User submits program registration.
2. System writes to `program_registrations`.
3. System writes to `user_program_memberships`.
4. If duplicate/previous record exists, system updates existing row to reactivate (`cancelled_at` or `left_at` cleared).
5. On leave/cancel, both registration and membership lifecycle are updated.

Automation points:
1. Insert-then-update fallback for idempotent behavior.
2. Automatic join-state consistency between two related tables.

Data/API touched:
1. `program_registrations`
2. `user_program_memberships`

References:
1. `src/hooks/use-user-profile.ts`
2. `supabase/sql/21_program_registrations.sql`

## Workflow 4: Citizen Desk Submission with Auto Reference and Tracking

Goal: Provide accountable ticket filing and tracking using official reference numbers.

Actors: Youth/citizen user, Admin/staff.

Flow:
1. User submits a ticket form.
2. System resolves ticket type and inserts into `citizen_tickets`.
3. DB trigger auto-generates `reference_no` and default status behavior.
4. User receives reference immediately in UI.
5. User can track ticket by reference and requester email through RPC.
6. Admin updates ticket status from admin portal.

Automation points:
1. Auto ticket reference generation.
2. Status-to-resolution timestamp handling.
3. Secure track RPC output with controlled fields.

Data/API touched:
1. `ticket_types`
2. `citizen_tickets`
3. RPC: `track_citizen_ticket`

References:
1. `src/pages/CitizenDesk.tsx`
2. `src/lib/data-api.ts`
3. `supabase/sql/04_functions_triggers.sql`

## Workflow 5: Transparency Board Admin-to-Public Sync

Goal: Let admin configure quarterly and monthly transparency records that immediately drive public views.

Actors: Admin, Public viewer.

Flow:
1. Admin opens Transparency Board Config.
2. Admin chooses section (`Board Rows` or `Monthly Compliance`) and manages records.
3. Admin sets statuses/remarks and optionally links report documents.
4. Records save to `compliance_board_status` and `monthly_compliance`.
5. Public transparency pages fetch these same rows and compute dashboard/indicators.

Automation points:
1. Completion percentage computation on monthly save.
2. Filtered month/search views for compliance operations.

Data/API touched:
1. `compliance_board_status`
2. `monthly_compliance`
3. `disclosure_documents` (linked reports)

References:
1. `src/admin/pages/TransparencyBoardAdmin.tsx`
2. `src/pages/TransparencyBoard.tsx`
3. `src/lib/data-api.ts`

## Workflow 6: Financial DSS Budget Setup to Analytics Pipeline

Goal: Control yearly budget and monthly utilization in one operational flow.

Actors: Admin, Public viewer.

Flow:
1. Admin sets yearly total budget per barangay.
2. Admin creates/updates monthly financial rows.
3. System validates fiscal year, month range, and amount relationships.
4. System computes trend and utilization metrics for dashboards.
5. Public financial disclosure consumes aggregated outputs.

Automation points:
1. Validation rules for budget/allocation/utilization consistency.
2. Auto-aggregation to trend and summary KPIs.
3. Export to formatted Excel/PDF from filtered rows.

Data/API touched:
1. `barangay_financials`
2. `barangays`
3. computed outputs in client data layer

References:
1. `src/admin/pages/FinancialDss.tsx`
2. `src/pages/FinancialDisclosure.tsx`
3. `src/lib/data-api.ts`

## Workflow 7: Barangay Resident Editing from Barangay Context

Goal: Manage resident profiles directly inside barangay-level operations.

Actors: Admin.

Flow:
1. Admin opens Barangay page and selects a barangay.
2. Resident list modal loads profiles for that barangay.
3. Admin edits resident profile directly from resident card.
4. Save updates `user_profiles` and refreshes resident list in the same context.

Automation points:
1. Contextual resident loading by selected barangay.
2. Immediate in-modal refresh after save.

Data/API touched:
1. `barangays`
2. `user_profiles`
3. `user_roles` (read for role badges)

References:
1. `src/admin/pages/Barangays.tsx`

## Workflow 8: Human-Readable Audit Logging for Admin Changes

Goal: Track and explain admin-side data mutations with non-technical readability.

Actors: Admin/auditor.

Flow:
1. Admin performs create/update/delete in managed tables.
2. DB audit trigger logs actor context, table, operation, row key, old/new data.
3. Audit Logs page shows list view with filters and readable labels.
4. Detail modal highlights changed fields and before/after values.
5. Technical JSON remains available as optional expanded view.

Automation points:
1. Trigger attachment across multiple admin-managed tables.
2. Skip no-op updates where only `updated_at` changed.
3. Actor resolution from JWT and profile/role context.

Data/API touched:
1. `audit_logs`
2. trigger function `log_audit_change()`
3. multiple managed tables monitored by trigger

References:
1. `supabase/sql/22_audit_logs.sql`
2. `src/admin/pages/AuditLogs.tsx`

## Workflow 9: Signup Auto-Provisioning and Role Bootstrap

Goal: Convert new auth accounts into usable youth profiles without manual encoding.

Actors: New user, system automation.

Flow:
1. User signs up with metadata (name, contact, barangay).
2. Auth insert trigger runs `handle_new_auth_user()`.
3. System creates or updates `user_profiles`.
4. System assigns default `youth` role in `user_roles`.
5. User can immediately proceed with user-side features tied to profile and role.

Automation points:
1. Metadata extraction and validation (including barangay UUID checks).
2. Default role assignment with conflict-safe insert.

Data/API touched:
1. `auth.users`
2. `user_profiles`
3. `user_roles`
4. `roles`

References:
1. `supabase/sql/13_auth_signup_profile_metadata.sql`
2. `src/hooks/use-auth.tsx`

## Workflow 10: Location Intelligence from Admin Capture to User Navigation

Goal: Capture precise coordinates in admin and reuse them for map preview and directions on user pages.

Actors: Admin, user/public viewer.

Flow:
1. Admin sets location text plus optional latitude/longitude.
2. Coordinates are stored in Program/Event records.
3. User sees location preview and can open route direction links.
4. Barangay-level map views reuse geo-enabled data for transparency context.

Automation points:
1. Coordinate range validation in SQL constraints.
2. Geocode/reverse-geocode helpers and route generation in UI components.

Data/API touched:
1. `programs.location_latitude`, `programs.location_longitude`
2. `events.location_latitude`, `events.location_longitude`
3. OpenStreetMap and Nominatim requests

References:
1. `supabase/sql/18_program_event_precise_location.sql`
2. `src/components/LocationPreviewButton.tsx`
3. `src/pages/BarangayMap.tsx`

