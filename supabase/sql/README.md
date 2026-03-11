# Supabase SQL Run Order

Run these files in order inside Supabase SQL Editor:

1. `00_extensions_enums.sql`
2. `01_core_tables.sql`
3. `02_youth_tables.sql`
4. `03_transparency_tables.sql`
5. `04_functions_triggers.sql`
6. `05_indexes.sql`
7. `06_rls_policies.sql`
8. `07_seed_data.sql`
9. `08_privileges.sql`
10. `09_template_seed_data.sql` (optional, imports the current in-app dataset into Supabase)
11. `11_template_seed_data_pack_b.sql` (optional, alternate/additional template dataset)
12. `12_admin_accounts.sql` (adds predefined admin account metadata and admin-only RLS policies)
13. `13_auth_signup_profile_metadata.sql` (updates signup trigger to store contact number and barangay id from signup metadata)
14. `14_admin_portal_anon_manage_policies.sql` (optional: enables anon write policies so the current predefined frontend admin can create/update portal content)
15. `15_transparency_upload_and_user_manage.sql` (optional: adds custom transparency document type field, storage upload policies, and anon manage policies for users)
16. `16_user_profile_delete_removes_auth_user.sql` (optional but recommended: deleting from `user_profiles` also deletes matching `auth.users`)
17. `17_admin_citizen_tickets_anon_manage.sql` (optional: allows predefined frontend admin mode to read/update Citizen Desk tickets)
18. `18_program_event_precise_location.sql` (optional but recommended: adds precise `location_latitude` and `location_longitude` columns for programs/events, used by admin map picker and user map directions)
19. `19_program_event_time_fields.sql` (optional but recommended: adds `start_time`/`end_time` fields with time-order checks for programs/events)
20. `20_events_remove_legacy_time_text.sql` (optional but recommended: ensures `start_time`/`end_time` exist, then removes legacy `events.time_text` so event time comes only from actual time fields)
21. `21_program_registrations.sql` (optional but recommended: adds `program_registrations` so programs can use form-based registration like events)
22. `22_audit_logs.sql` (optional but recommended: adds row-level `audit_logs` + triggers so admin changes are traceable by actor, table, and payload diff)

Notes:
- Files are idempotent (`if not exists`, `on conflict`).
- If you need a clean reset, drop existing objects first in a non-production environment.
- After running, configure frontend env vars from `.env.example`.
- Optional rollback for template data only: `10_template_seed_data_delete.sql`.
