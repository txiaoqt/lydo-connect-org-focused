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

Notes:
- Files are idempotent (`if not exists`, `on conflict`).
- If you need a clean reset, drop existing objects first in a non-production environment.
- After running, configure frontend env vars from `.env.example`.
- Optional rollback for template data only: `10_template_seed_data_delete.sql`.
