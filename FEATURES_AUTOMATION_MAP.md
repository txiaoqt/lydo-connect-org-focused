# Youth Governance System - Feature and Automation Map

## Current Features (with automation classification)

| Module | Feature | Short Description | Automation Today | Why this classification | Future Automation Upgrade |
|---|---|---|---|---|---|
| Access | Sign Up / Sign In | Account creation and login through Supabase Auth. | `Hybrid` | User enters credentials manually; session handling is automatic. | Add passwordless magic links and adaptive risk checks. |
| Access | Auto Profile Provisioning | On new auth user, profile + default youth role are created in DB. | `Automation` | Trigger-based, no manual back-office encoding needed. | Auto-assign barangay/role from verified onboarding forms. |
| Profile | Account Settings | User updates full name, contact, barangay, bio, preferences. | `Hybrid` | User edits manually; save + DB upsert is automatic. | Add profile completeness nudges and auto-validation workflows. |
| Youth Zone | Programs Catalog | Published programs list with search/filter and join action. | `Hybrid` | Discovery is manual; data fetch is automatic from Supabase. | Auto-publish from approved content pipeline (social feed sync). |
| Youth Zone | Events Catalog | Upcoming/past events list with search and event record page. | `Hybrid` | Manual browsing; dynamic retrieval and sorting are automatic. | Auto status transition (`upcoming` -> `past`) via scheduled job. |
| Youth Zone | Event Registration | Youth users register/cancel participation per event. | `Hybrid` | User submits form manually; registration persistence is automatic. | Capacity-based waitlist + auto confirmations/reminders. |
| Youth Zone | Organizations Directory | Active/partner organizations with join/leave controls. | `Hybrid` | User decides actions; membership writes and state sync are automatic. | Auto recommendation of orgs based on user interests/activity. |
| Transparency | Disclosure Registry | Public documents with filters and downloadable links. | `Hybrid` | Manual filtering by user; data retrieval is automatic. | Auto-ingest registry from official filing channels and OCR tagging. |
| Transparency | CSV/JSON Export | Exports currently filtered disclosure rows. | `Automation` | File generation is automatic from current filter state. | Scheduled open-data exports to a public data endpoint. |
| Transparency | KPI Snapshot | Counts of disclosures, tickets, resolution stats, pending volume. | `Automation` | KPI view is computed directly in DB from live records. | Add anomaly alerts and trend forecasting (weekly/monthly). |
| Transparency | Financial Disclosure Dashboard | Barangay budget totals, utilization table, monthly trend chart. | `Automation` | Aggregation and chart feed are generated from DB records. | Auto variance explanations and budget risk scoring. |
| Transparency | SK Full Disclosure Board | Compliance state matrix per barangay and quarter. | `Automation` | Renders directly from compliance status records. | Auto compliance reminders/escalations by due-date rules. |
| Transparency | Monthly Compliance Turnover | Per-month checklist (MFR/MIL/RCB/etc.) with completion % and status. | `Automation` | Status computation and completion scoring are automatic. | SLA engine with escalating notifications for late submissions. |
| Transparency | Barangay Map | Interactive map with coordinates and governance metrics. | `Automation` | Markers/metrics are dynamically built from DB data. | Geo-fencing alerts and hotspot analytics (low-compliance clusters). |
| Citizen Desk | Ticket Submission | Citizen files request/complaint/suggestion/service ticket. | `Hybrid` | User writes ticket manually; reference handling/storage are automatic. | AI-assisted form completion and duplicate-ticket detection. |
| Citizen Desk | Ticket Reference Generation | Human-readable reference number is auto-created in DB trigger. | `Automation` | No manual numbering by staff. | Smart routing code in reference (office + category + date). |
| Citizen Desk | Ticket Tracking | Citizens track status via reference + email lookup RPC. | `Automation` | Secure lookup is automated by RPC function. | Multi-channel status updates (email/SMS/chat). |
| Citizen Desk | My Tickets | Authenticated users see their submitted ticket history. | `Automation` | User-specific query and ordering are automatic. | Priority prediction + expected resolution-time estimator. |
| Platform | Service Advisories | Operational / maintenance / notice cards from DB. | `Automation` | Advisories render from live records without code edits. | Scheduled publish/unpublish windows with auto-expiry. |
| Platform | Row-Level Security (RLS) | Public-read and role-based policies for protected operations. | `Automation` | Access enforcement is automatic at DB layer. | Policy simulation dashboard + audit policy tests in CI. |
| Platform | Updated Timestamp Triggers | `updated_at` maintained automatically on updates. | `Automation` | No manual timestamp handling in app code. | Add audit trail table (who/what/when per mutation). |

## Emerging Tech Suggestions (high-impact additions)

1. **AI Ticket Triage (LLM + rules engine)**  
   Auto-classify Citizen Desk tickets, suggest priority, and route to the right office queue.

2. **RAG Transparency Assistant**  
   A chatbot grounded on your disclosure documents, ordinances, and reports for answerable public queries with citations.

3. **Predictive Compliance Scoring (ML)**  
   Forecast barangays likely to become late/non-compliant next month and trigger early interventions.

4. **PostGIS Geospatial Insights**  
   Add true geospatial analytics (distance, density, cluster heatmaps) for barangay performance and service coverage.

5. **Event Recommendation Engine**  
   Recommend programs/events/orgs per user profile and prior participation behavior.

6. **Real-time Ops with Realtime Channels**  
   Push live updates for advisories, ticket status changes, and dashboard counters without page reload.

## Suggested first implementation order

1. AI Ticket Triage  
2. RAG Transparency Assistant  
3. Predictive Compliance Scoring

