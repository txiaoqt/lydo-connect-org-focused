# TADZ Assigned Sections (Chapter 3 Draft)

Source of truth: the current Supabase SQL migrations and `supabase/schema_supabase_all_in_one.sql`.

This file keeps the TADZ-assigned manuscript sections aligned with the current dedicated Chapter 3 Markdown files. The authoritative versions are maintained in separate files to avoid duplicate, inconsistent diagrams and dictionaries.

## 3.2.4 Database Schema

Authoritative file: [`3.2.4-Database-Schema.md`](./3.2.4-Database-Schema.md)

The database schema is presented as partitioned ERDs instead of one oversized diagram. The partitions are:

1. Authentication, Users, and Roles
2. Barangay and Office Reference Data
3. Youth Programs, Events, and Organizations
4. Registrations
5. Transparency and Public Documents
6. Barangay Financials and Compliance
7. Youth Services and Advisories
8. Audit Logs

Policy version and user policy acceptance tables are documented inside the Authentication, Users, and Roles partition because they are tied directly to authenticated user access. Expanded organization reference and project tables are documented inside the Youth Programs, Events, and Organizations partition.

Each partition shows table boxes, primary keys, foreign keys, and relationships. Shared reference tables such as `auth.users`, `barangays`, `offices`, and `disclosure_documents` are repeated as simplified boxes where needed for readability.

## 3.2.5 Data Dictionary

Authoritative file: [`3.2.5-Data-Dictionary.md`](./3.2.5-Data-Dictionary.md)

The data dictionary uses the same modules as the database schema. For each table, it lists the field name, data type, key type, reference table, and field purpose. The dictionary is aligned with the partitioned ERDs and the implemented schema, including policy agreement records, organization references/projects, and registration sync fields.

## 3.3 Development Methodology

### 3.3.1 Process Model

The study adopts a hybrid Design Science Research (DSR) and Rapid Application Development (RAD) process model.

- DSR frames the research problem, solution objectives, artifact development, demonstration, evaluation, and communication.
- RAD supports iterative prototyping, stakeholder review, revision, and delivery of working modules.

This combined method fits LYDO Connect because the platform includes public information access, account and role management, policy agreement handling, youth participation, registration monitoring, transparency records, financial and compliance data, Youth Tickets, and audit-supported administration.

### 3.3.2 Development Tools

Authoritative file: [`3.3.2-Development-Tools.md`](./3.3.2-Development-Tools.md)

The implementation uses TypeScript, React, Vite, Tailwind CSS, Supabase, PostgreSQL, SQL migrations, Supabase Storage, Python worker scripts, Google Forms/Sheets integration support, Recharts, React Leaflet, Git, ESLint, Vitest, Visual Studio Code, Vercel, and related frontend libraries. These tools support responsive development, structured relational storage, role-based access, public document handling, registration sync monitoring, maps, dashboards, and maintainable deployment.

## 3.7.6 Statistical Treatments

For this design-and-development study, statistical treatment focuses on descriptive analysis:

- Frequency and percentage for respondent profile summaries.
- Weighted mean for Likert-scale acceptability scores.
- Standard deviation for variability and consistency of responses.

Inferential tests are not required by default unless the final adviser-approved research design explicitly compares respondent groups.


