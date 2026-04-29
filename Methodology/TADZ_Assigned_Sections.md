# TADZ Assigned Sections (Chapter 3 Draft)

Source of truth: `supabase/schema_supabase_all_in_one.sql` (generated 2026-04-25).

This file consolidates all sections assigned to **TADZ** in clean manuscript-ready format:
1. Database Schema
2. Data Dictionary
3. Development Methodology
4. Statistical Treatments

## 3.2.4 Database Schema

The proposed system uses a centralized relational database implemented in **Supabase PostgreSQL**. The schema is modular and designed to support the core functions of LYDO Connect: youth participation management, public transparency, citizen services, role-based administration, and accountability tracking.

### 1. Schema Structure by Domain

- **Identity and Access**: `roles`, `user_roles`, `user_profiles`, `admin_accounts`
- **Geographic and Office Reference**: `barangays`, `offices`
- **Youth Participation and Content**: `programs`, `events`, `organizations`, `user_program_memberships`, `user_org_memberships`, `event_registrations`, `program_registrations`
- **Transparency and Governance**: `disclosure_documents`, `document_downloads`, `barangay_financials`, `barangay_youth_metrics`, `compliance_board_status`, `monthly_compliance`
- **Citizen Service Desk**: `ticket_types`, `citizen_tickets`, `service_advisories`
- **Monitoring and Accountability**: `audit_logs`

### 2. Key Design Characteristics

- UUID primary keys are used for major entities for uniqueness and easier distributed operations.
- Controlled enums are used for system states (role, status, quarter, submission state, document state, etc.).
- Foreign keys enforce referential integrity across modules.
- `created_at` and `updated_at` timestamps are standardized for traceability.
- Automated database triggers are used for `updated_at`, user-profile creation on signup, and ticket reference defaults.
- RLS (Row Level Security) policies enforce access control by role and ownership.

### 3. Relationship Summary

- One `auth.users` record maps to one `user_profiles` record and may map to many role mappings in `user_roles`.
- One `barangays` record may have many programs, events, organizations, compliance records, and financial records.
- One user may register to many events/programs through `event_registrations` and `program_registrations`.
- One `disclosure_documents` record may be downloaded many times (`document_downloads`) and referenced by compliance rows.
- One citizen ticket type may classify many tickets.
- `audit_logs` captures insert/update/delete changes on admin-managed tables.

### 4. Why This Schema Fits the Study

The schema directly supports the project objectives: centralized youth information, participation tracking, transparency publication, and request handling. It also aligns with governance requirements through auditability, role-based control, and structured records suitable for reporting and evaluation.

---

## 3.2.5 Data Dictionary

The data dictionary below is derived from `schema_supabase_all_in_one.sql`. It includes the principal enums and operational tables used by the implemented system.

### A. Enumerated Data Types

| Enum | Values |
|---|---|
| `app_role_code` | `admin`, `staff`, `sk`, `youth` |
| `program_status` | `draft`, `published`, `archived` |
| `event_status` | `draft`, `upcoming`, `past`, `cancelled` |
| `organization_status` | `active`, `partner`, `inactive` |
| `registration_status` | `registered`, `waitlisted`, `attended`, `no_show`, `cancelled` |
| `quarter_code` | `Q1`, `Q2`, `Q3`, `Q4` |
| `disclosure_doc_type` | `ordinance`, `resolution`, `executive_order`, `bac_document`, `financial_statement`, `program_outcome`, `other` |
| `doc_state` | `ok`, `partial`, `issue` |
| `submission_state` | `submitted`, `late`, `missing` |
| `ticket_status` | `received`, `in_progress`, `resolved`, `closed` |
| `service_status` | `operational`, `maintenance`, `notice` |
| `barangay_compliance_status` | `compliant`, `pending`, `overdue` |

### B. Core Table Dictionary

| Table | Purpose | Primary Key | Important Fields |
|---|---|---|---|
| `roles` | Defines system roles | `id` | `code`, `label`, `description` |
| `user_roles` | Maps users to roles | (`user_id`, `role_id`) | `assigned_at`, `assigned_by` |
| `barangays` | Barangay reference and demographics | `id` | `name`, `latitude`, `longitude`, `sk_chairperson`, `youth_population` |
| `offices` | Office reference records | `id` | `name`, `code` |
| `user_profiles` | Public user metadata linked to auth | `user_id` | `email`, `full_name`, `display_name`, `contact_number`, `municipality`, `barangay_id` |

### C. Youth Module Tables

| Table | Purpose | Primary Key | Important Fields |
|---|---|---|---|
| `programs` | Program master data | `id` | `slug`, `title`, `sector`, `status`, `start_date`, `end_date`, `location`, `barangay_id`, `registration_form_url`, `external_attendance_enabled` |
| `events` | Event master data | `id` | `slug`, `title`, `sector`, `status`, `event_date`, `capacity`, `location`, `barangay_id`, `start_time`, `end_time`, `registration_form_url` |
| `organizations` | Youth organization directory | `id` | `slug`, `name`, `type`, `focus`, `status`, `barangay_id` |
| `user_program_memberships` | Program membership history | `id` | `user_id`, `program_id`, `joined_at`, `left_at` |
| `user_org_memberships` | Organization membership history | `id` | `user_id`, `organization_id`, `joined_at`, `left_at` |
| `event_registrations` | User-to-event registrations | `id` | `user_id`, `event_id`, `full_name`, `email`, `contact_number`, `registration_status`, `source`, `gform_sync_status` |
| `program_registrations` | User-to-program registrations | `id` | `user_id`, `program_id`, `full_name`, `email`, `contact_number`, `registration_status`, `source`, `gform_sync_status` |

### D. Transparency and Governance Tables

| Table | Purpose | Primary Key | Important Fields |
|---|---|---|---|
| `disclosure_documents` | Public disclosure registry | `id` | `doc_code`, `title`, `document_type`, `fiscal_year`, `quarter`, `barangay_id`, `office_id`, `published_date`, `public_url` |
| `document_downloads` | Download activity logs | `id` | `document_id`, `user_id`, `downloaded_at`, `ip_hash` |
| `barangay_financials` | Monthly budget/financial tracking | `id` | `barangay_id`, `fiscal_year`, `month_no`, `allocated_amount`, `utilized_amount`, `sk_budget` |
| `barangay_youth_metrics` | Annual youth participation metrics | `id` | `barangay_id`, `fiscal_year`, `activities`, `participants`, `organizations`, `compliance_status` |
| `compliance_board_status` | Quarterly compliance board state | `id` | `barangay_id`, `fiscal_year`, `quarter`, `cbydp`, `abyip`, `annual_budget`, `rcb`, `mil`, `remarks` |
| `monthly_compliance` | Monthly submission monitoring | `id` | `barangay_id`, `fiscal_year`, `month_no`, `mfr_status`, `mil_status`, `rcb_status`, `accomplishment_status`, `census_status`, `completion_percent` |

### E. Citizen Desk and Service Tables

| Table | Purpose | Primary Key | Important Fields |
|---|---|---|---|
| `ticket_types` | Ticket category reference | `id` | `name` |
| `citizen_tickets` | Citizen service requests | `id` | `reference_no`, `type_id`, `subject`, `requester_email`, `status`, `priority`, `created_by_user_id`, `assigned_to_user_id` |
| `service_advisories` | Public service advisory posts | `id` | `office_id`, `title`, `status`, `message`, `starts_at`, `ends_at` |

### F. Accountability Table

| Table | Purpose | Primary Key | Important Fields |
|---|---|---|---|
| `audit_logs` | Row-level audit trail for admin-managed changes | `id` | `occurred_at`, `actor_user_id`, `operation`, `table_name`, `row_pk`, `changed_fields`, `old_data`, `new_data` |

### G. Data Integrity and Constraints (Summary)

- Unique constraints on natural identifiers such as `slug`, `doc_code`, `reference_no`, and selected composite keys.
- Partial unique indexes prevent duplicate active memberships and active registrations.
- Check constraints enforce valid ranges (for dates, amounts, percentages, priority values, latitude/longitude, and time ordering).
- RLS policies govern ownership and role-based access.

---

## 3.3 Development Methodology

### 3.3.1 Process Model

The study adopts a **hybrid Design Science Research (DSR) and Rapid Application Development (RAD)** process model.

- **DSR as research framework**: identifies the governance and information-management problem, defines solution objectives, develops the artifact, demonstrates the artifact in context, and evaluates quality and usefulness.
- **RAD as development strategy**: delivers the system through short iterative cycles of prototyping, validation, revision, and release.

This combined model is appropriate for LYDO Connect because the project has multiple modules that evolved incrementally: public pages, admin portal, registrations, transparency records, analytics, citizen desk, and integration functions. Database migrations and policy updates in the schema history also confirm iterative development rather than a rigid one-pass model.

#### Process Flow Used in the Project

1. **Problem and Requirement Definition**
- Gathered requirements from LYDO workflow context, transparency obligations, and participation monitoring needs.

2. **Rapid Prototype Construction**
- Initial portal and admin modules were built quickly to validate navigation, forms, and core records.

3. **Schema and Access Control Iteration**
- SQL migrations added normalized tables, enums, constraints, RLS policies, and triggers.

4. **Module Refinement and Integration**
- Registration flows, disclosure management, ticketing, audit trails, and sync automation were integrated.

5. **Testing and Evaluation Preparation**
- Outputs were aligned to quality criteria and evaluation instruments for acceptability testing.

### 3.3.2 Development Tools

The following tools were used in the implementation and maintenance of LYDO Connect:

| Tool Category | Actual Tool(s) Used | Purpose in Project |
|---|---|---|
| Programming Language | TypeScript, JavaScript, SQL, Python | Frontend development, database logic/migrations, and sync worker automation |
| Database Platform | Supabase PostgreSQL | Central relational data store, authentication linkage, RLS, storage integration |
| Framework and Build Tool | React + Vite | Modular single-page app development and optimized builds |
| UI and Styling | Tailwind CSS + shadcn/ui component layer | Responsive, reusable interface components for user and admin portals |
| Backend/API Layer | Supabase APIs (Auth, PostgREST, Storage, Realtime) + SQL RPC functions | Authentication, CRUD access, file handling, realtime-compatible backend operations |
| Development Environment | Visual Studio Code | Main IDE for coding, debugging, and source control integration |
| Version Control | Git + GitHub repository workflow | Change tracking, collaboration, and rollback-safe history |
| Testing/Validation Support | Vitest (configured), SQL assertions/migration checks | Basic app-level and schema-level validation |
| Automation Utility | Python worker scripts (`worker/gform_sync_worker.py`) | Registration sync handling with Google Forms/Sheets workflow |
| Deployment Surface | Vercel (frontend) + Supabase cloud services | Hosting, managed database, and storage access |

#### Tool Selection Justification

- The stack supports **rapid iteration** (RAD fit), especially for frequent schema and UI updates.
- Supabase enables **production-grade relational controls** needed by governance data.
- SQL-first migrations ensure **traceable and reproducible** database evolution.
- React + Vite supports fast front-end iteration for both public and admin workflows.

---

## 3.7.6 Statistical Treatments

For this study, statistical treatment focuses on **descriptive analysis** appropriate for design-and-development evaluation.

### 1. Statistical Tools

- **Frequency and Percentage**: for respondent profile summaries.
- **Weighted Mean**: for acceptability scores per criterion (based on Likert-scale responses).
- **Standard Deviation**: for variability/consistency of responses.

### 2. Decision Basis

- Criteria are interpreted using pre-defined Likert verbal interpretations.
- Overall system acceptability is determined from aggregated weighted means.
- Qualitative comments are grouped thematically to support revisions.

### 3. Note on Inferential Tests

Inferential tests (for example, `t-test` or `z-test`) are not required by default for this capstone design unless the final adviser-approved research design explicitly compares respondent groups.

---

## Ready-to-Paste Note

If needed, I can also split this file into section-specific `.md` files (`3.2.4`, `3.2.5`, `3.3.1`, `3.3.2`, `3.7.6`) to match your manuscript structure one-to-one.
