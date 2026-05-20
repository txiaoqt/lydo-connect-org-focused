# Appendix: Full Data Dictionary Reference

Source of truth: the current Supabase SQL migrations and `supabase/schema_supabase_all_in_one.sql`.

The complete, current data dictionary is maintained in [`3.2.5-Data-Dictionary.md`](./3.2.5-Data-Dictionary.md). That file is organized by the same eight modules used in the partitioned database schema:

1. Authentication, Users, and Roles
2. Barangay and Office Reference Data
3. Youth Programs, Events, and Organizations
4. Registrations
5. Transparency and Public Documents
6. Barangay Financials and Compliance
7. Citizen Services and Advisories
8. Audit Logs

The maintained dictionary now includes the current site updates: active policy versions and user policy acceptance, registration sync metadata, expanded organization references and projects, and the latest organization status values. This appendix intentionally points to the maintained dictionary instead of duplicating table rows. Keeping one authoritative dictionary prevents mismatched fields, stale migration artifacts, and contradictory table descriptions in the manuscript package.
