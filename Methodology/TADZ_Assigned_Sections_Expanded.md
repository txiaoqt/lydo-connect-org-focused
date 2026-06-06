# TADZ Assigned Sections (Expanded Chapter 3 Draft)

This supporting file collects the sections assigned to Tadz and aligns them with the current LYDO Connect site workflow in the repository. The content below is based on the implemented features of the system, including organization registration, document submission, budget request and liquidation monitoring, notifications, transparency content, and admin review.

## 3.1.4 Purpose and Description

LYDO Connect is a web-based information and monitoring platform for the Local Youth Development Office workflow. Its purpose is to centralize organization registration, policy acceptance, document submission, budget request processing, liquidation reporting, content posting, notifications, and admin monitoring in one accessible system.

The system supports the following site functions:
- user sign-up, sign-in, sign-out, and active policy agreement gating
- organization profile management
- document requirement uploads and review
- budget request submission and monitoring
- liquidation reporting after budget approval
- news releases and transparency posts
- notifications and workflow logs
- admin review and management tools

## 3.1.5 Specific Objectives

The study aims to:

1. design and develop a centralized LYDO Connect platform based on the current site workflow
2. allow organization users to create and update their organization profile
3. support document submission with file tracking and admin review
4. support budget request processing, including approval, release, and monitoring
5. support liquidation reporting after approved budget requests
6. provide public access to published news releases and transparency posts
7. notify users about important workflow changes and remarks
8. maintain traceable records for administrative actions and status changes

## 3.1.6 Scope and Limitations

### Scope

The study focuses on the current LYDO Connect workflow implemented in the site and repository. Covered modules include:
- authentication and policy acceptance
- organization profiles
- document submissions and required document management
- budget requests and barangay-level budget monitoring
- liquidation reports
- news releases
- transparency posts
- notifications
- compliance remarks
- activity logs
- admin review and content management

### Limitations

The study is limited to the current implementation and does not claim to cover every possible youth governance workflow. It also does not extend to modules that are not present in the site, such as unrelated civic systems, external government integrations that are not yet implemented, or advanced analytics that are not part of the current build.

## 3.1.7 Definition of Terms

| Term | Definition |
|---|---|
| LYDO Connect | The web-based platform developed to support youth organization monitoring, document handling, budget processing, and transparency publishing. |
| Organization Profile | The registered record of a youth organization, including contact details, barangay, district, classifications, and verification status. |
| Document Submission | The upload and review of required documents by an organization user. |
| Budget Request | A funding request submitted by an organization for an activity, including requested, approved, and released amounts. |
| Liquidation Report | The post-activity report used to document how an approved budget was used. |
| Transparency Post | A public-facing post published by admins to share accountability or disclosure information. |
| News Release | A public announcement linked to a Facebook post and shown through the site. |
| Notification | A system-generated message that informs a user about a workflow update, revision, approval, rejection, or reminder. |
| Compliance Remark | An administrative note that records a workflow issue, consequence, or required correction. |
| Activity Log | A trace record of important system actions for monitoring and accountability. |
| Barangay Allocation Monitoring | The admin view that groups released budget amounts by barangay and district for monitoring purposes. |

## 3.1.8 Problem-Requirements Matrix

| Client Problem | System Requirement | Site Feature Response |
|---|---|---|
| Organization data is scattered and difficult to track | Centralize organization profiles | The site stores organization profile records in one place and links them to user accounts. |
| Requirement submission is manual and hard to monitor | Provide digital document submission | The site allows document uploads, file tracking, and admin review of requirements. |
| Budget approval and release are difficult to monitor | Provide budget request workflow and release tracking | The site supports budget request status updates, approved amount, released amount, and release dates. |
| Released funds are difficult to trace by barangay | Provide barangay allocation monitoring | The admin budget monitoring view groups released amounts by barangay and district. |
| Post-activity accountability is hard to enforce | Provide liquidation reporting | The site creates liquidation reporting after budget approval and tracks status changes. |
| Users do not get timely updates | Provide notifications | The site sends workflow notifications when records are revised, approved, rejected, or completed. |
| Public information is not easy to publish and maintain | Provide news and transparency management | The site includes admin-managed news releases and transparency posts for public viewing. |
| Administrative actions need traceability | Provide activity logs and remarks | The site records important actions in logs and compliance remarks. |

## 3.2.4 Database Schema

Authoritative file: [`3.2.4-Database-Schema.md`](./3.2.4-Database-Schema.md)

The schema coverage is limited to the current app workflow:
- authentication and policy acceptance
- organization profiles and document submission
- budget requests, liquidation reports, and budget monitoring
- news releases and transparency posts
- templates, notifications, activity logs, and compliance remarks

## 3.2.5 Data Dictionary

Authoritative file: [`3.2.5-Data-Dictionary.md`](./3.2.5-Data-Dictionary.md)

The data dictionary uses the same current workflow scope and excludes modules that are not implemented in the app.

## 3.3 Development Methodology

### 3.3.1 Process Model

The study uses an iterative DSR + RAD process with scope, build, test, revise, and deploy cycles.

### 3.3.2 Development Tools

Authoritative file: [`3.3.2-Development-Tools.md`](./3.3.2-Development-Tools.md)

The implementation uses the current frontend, Supabase, SQL, testing, and deployment tools listed in that file.

## 3.6.1 Storage, Backup, and Recovery Procedures

LYDO Connect uses Supabase PostgreSQL and Supabase Storage, so storage and recovery procedures are tied to database backups, storage object retention, and migration-based version control.

### Storage Procedure

- user-uploaded files are saved in the correct Supabase Storage bucket
- structured records are stored in the PostgreSQL database
- uploaded files and database records are linked through foreign keys and identifiers

### Backup Procedure

- database changes are managed through SQL migrations
- important schema updates are version-controlled in the repository
- uploaded file metadata and record references can be exported for recovery planning

### Recovery Procedure

- if a record is updated incorrectly, the latest valid migration and data export can be used to restore the affected workflow
- if file references are lost, the stored database relationships and bucket paths can be used to reconnect the records
- if a module fails, the affected workflow can be rebuilt from the migration files and current repository state

## 3.6.2 Security Procedures

The site applies security through authenticated access, role-based restrictions, and database-level access control.

### Security Controls

- authenticated users must sign in before accessing protected workflows
- non-admin users must accept the active policy before continuing
- role checks determine whether a user can access admin tools
- record-level restrictions protect organization, budget, liquidation, and admin data
- sensitive admin sessions are stored using hashed tokens
- file buckets are separated according to content type and access needs

### Operational Security

- admin actions are limited to authorized accounts
- status updates are recorded for review and traceability
- notifications are generated from workflow changes instead of manual messaging
- logs and remarks preserve an audit trail for important actions

## 3.6.3 Policies and Procedures

The system uses policy versions and acceptance records to ensure that users agree to the current terms before using protected workflows.

### Policy Procedure

- the active terms and privacy policy are stored in the policy version table
- each user acceptance is recorded with a time stamp and related policy version
- protected workflows remain gated until acceptance is complete
- admin users can manage policy records when necessary

### Operational Procedure

- organization users submit documents, requests, and reports through the portal
- admins review, approve, revise, or reject records through the admin interface
- published content remains visible to the public according to visibility status

## 3.7.6 Statistical Treatments

For this design-and-development study, statistical treatment focuses on descriptive analysis:

- frequency and percentage for respondent profile summaries
- weighted mean for Likert-scale acceptability scores
- standard deviation for variability and consistency of responses

## 3.7.7 Statistical Treatment Details

The evaluation responses are treated as descriptive data for the purpose of summarizing usability and acceptability results.

### Measures Used

| Statistic | Purpose |
|---|---|
| Frequency | Count how many respondents selected each answer |
| Percentage | Show the proportion of each response category |
| Weighted mean | Determine the average acceptability score for each criterion |
| Standard deviation | Measure how consistent the answers are across respondents |

### Weighted Mean Formula

`WM = sum(fx) / N`

Where:
- `f` is the frequency of each response
- `x` is the assigned Likert weight
- `N` is the total number of responses

### Interpretation Guide

| Weighted Mean Range | Interpretation |
|---|---|
| 4.21 - 5.00 | Excellent / Highly Acceptable |
| 3.41 - 4.20 | Very Good / Acceptable |
| 2.61 - 3.40 | Good / Moderately Acceptable |
| 1.81 - 2.60 | Fair / Needs Improvement |
| 1.00 - 1.80 | Poor / Not Acceptable |

## Summary

These assigned sections remain aligned with the current LYDO Connect site and its implemented modules. The paper should keep using the same system scope across the methodology, requirements, development, security, and evaluation sections so the manuscript stays consistent with the actual application.
