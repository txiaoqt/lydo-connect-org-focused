# SCOPE AND LIMITATIONS - LYDO CONNECT

## Overview

This section defines the functional, user, data, and operational boundaries of LYDO Connect: Youth Information, Engagement, and Transparency Management System. The scope is based on the actual modules, workflows, and records present in the current system implementation, as well as the goals and problem context of the study. In particular, it reflects the study's focus on improving youth access to information, strengthening participation monitoring, centralizing transparency records, and providing a more structured citizen-facing service channel for LYDO-related operations. The limitations identify the aspects that are outside the present study, the practical constraints of the platform, and the dependencies that may affect usage and results.

## Scope of the Study

The study covers the design and development of a centralized web-based information and service platform intended for Local Youth Development Office operations, youth participation support, and public transparency functions. The system is designed to serve both public-facing and administrative users through role-based access and shared data records. It specifically addresses the need for a more organized alternative to fragmented communication channels by bringing youth opportunities, participation records, disclosure documents, financial information, and citizen concerns into a single platform.

### 1. Organizational and Geographic Scope

The proposed system is intended for use in the context of local youth governance, particularly for selected Local Youth Development Offices within Metro Manila. The study focuses on youth governance, youth engagement, public information access, and transparency functions related to LYDO operations under the broader policy context of local youth development, public accountability, and digital government service delivery. It does not cover the full range of all local government office transactions outside the youth governance domain, nor does it extend to nationwide implementation beyond the selected Metro Manila coverage of the study.

### 2. User Scope

The study covers the following intended users:

- youth residents and registered youth users who access programs, events, organizations, and account-based participation features;
- general citizens and public viewers who access transparency records, financial disclosures, barangay information, service advisories, and citizen desk services;
- barangay-level youth stakeholders and local youth leaders who monitor public youth governance and transparency information;
- authorized LYDO administrators and staff who manage records, documents, user roles, registrations, transparency content, and citizen concerns.

### 3. Public/User-Side Functional Scope

The study includes the development and use of the following public-facing modules:

- `Home / Landing Page`
  - presents the system overview, key statistics, featured programs, and access points for youth and transparency services;

- `Programs Module`
  - displays youth development programs with structured details, location information, and registration options;

- `Events Module`
  - displays youth events with details, schedules, and registration access;

- `Organizations Module`
  - presents youth organizations, advocacy groups, and partner organizations linked to local youth development efforts;

- `Unified Program/Event Record Pages`
  - provides a combined detailed record view for programs and events, including official source references, activity details, and registration flow;

- `User Profile Module`
  - allows registered users to manage profile details and review joined programs, event registrations, and organization participation history;

- `Transparency Reports Module`
  - provides a searchable and filterable disclosure registry for publicly accessible documents;

- `Transparency Board Module`
  - presents compliance-related rows and monthly reporting status for transparency monitoring;

- `Financial Disclosure Module`
  - displays barangay-linked financial summaries and budget-related information in a public-facing view;

- `Barangay Map Module`
  - provides barangay-based governance and youth-related information using mapped and summarized local data;

- `Citizen Desk Module`
  - allows authenticated users to file service requests, complaints, suggestions, or information-related concerns and track ticket history under their accounts;

- `Service Advisories Module`
  - publishes operational notices, reminders, and service updates for users and citizens;

- `Authentication Modules`
  - supports sign-in, sign-up, and account access management for users.

### 4. Admin-Side Functional Scope

The study includes the development and use of the following administrative modules:

- `Dashboard`
  - provides a summary view of users, transparency records, financial records, registrations, and recent activity;

- `Programs Management`
  - allows administrators to create, edit, publish, and manage youth programs;

- `Events Management`
  - allows administrators to create, edit, publish, and manage youth events;

- `Registrations Management`
  - allows administrators to review local event and program registrations, monitor sync status, preview linked attendance sheets, and export registration data;

- `Organizations Management`
  - allows administrators to maintain organization records linked to youth development activities;

- `Barangay Management`
  - allows administrators to maintain barangay-level information, geographic data, and resident-linked youth records;

- `Transparency Documents Management`
  - allows administrators to upload, store, edit, and publish public disclosure documents with metadata such as type, year, quarter, barangay, and office;

- `Transparency Board Configuration`
  - allows administrators to encode and maintain quarterly and monthly transparency and compliance records;

- `Financial DSS`
  - allows administrators to manage barangay budget data, financial rows, analytics, and export-ready summaries;

- `Citizen Desk Administration`
  - allows administrators to monitor tickets, review requester details, and update ticket status and priority;

- `Users Management`
  - allows administrators to review and maintain user accounts and profile information;

- `Roles and Permissions`
  - allows administrators to manage role assignments and access scope;

- `Audit Logs`
  - records and displays traceable administrative create, update, and delete activities across covered modules.

### 5. Process Scope

The study covers the following core system processes:

- dissemination of youth program, event, organization, and advisory information through a centralized web platform;
- registration and participation tracking for events and programs;
- organization membership-related record handling;
- structured management and publication of transparency documents and governance-related records;
- barangay-based financial encoding and reporting workflows;
- citizen desk ticket submission, tracking, and status management;
- user profile creation, updating, and role-sensitive access;
- administrator-side record maintenance and audit-aware data management;
- optional synchronization of registration data to external Google Form and Google Sheet attendance workflows where configured.

### 6. Data Scope

The study covers the management and display of the following major data sets:

- youth programs;
- youth events;
- organizations and memberships;
- user profiles and roles;
- event and program registrations;
- disclosure documents and transparency metadata;
- compliance board and monthly transparency records;
- barangay financial records and youth metrics;
- citizen desk ticket types and citizen ticket records;
- service advisories;
- audit logs and related administrative change records.

### 7. Platform and Deployment Scope

The study is limited to a web-based platform accessible through standard desktop and mobile web browsers. The system includes responsive public and admin interfaces and may operate in user-only, admin-only, or combined deployment surfaces depending on configuration. The admin environment also supports installable Progressive Web App behavior for easier operational access.

### 8. Integration Scope

The study includes only the integrations currently reflected in the implemented system, such as:

- cloud-based authentication, storage, and database services;
- official source-post linking for youth programs and events;
- geographic map and location services for barangay and activity data;
- optional Google Form and Google Sheet registration sync workflows;
- export functions for registry or financial data where available in the system.

### 9. Evaluation Scope

The study covers the development of a working platform that may be evaluated in relation to usability, functionality, transparency support, and operational relevance in a local youth governance context. The scope of evaluation is limited to the developed system and its intended user and admin workflows within the study boundaries.

## Limitations of the Study

Although the proposed system covers several important youth governance and transparency functions, the present study has limitations that define what the platform does not yet include or fully guarantee.

### 1. Domain Limitation

The system is limited to youth governance, youth engagement, transparency support, and citizen-facing functions related to LYDO operations. It is not intended to replace the full digital operations of the entire local government unit, nor does it cover unrelated office functions such as taxation, procurement processing, human resources, health records, or full municipal records management. It is also not intended to replace official statutory mechanisms for all government notices, full FOI processing, or enterprise-wide records administration beyond the youth governance and public information scope defined in the study.

### 2. Internet and Infrastructure Dependence

The system depends on stable internet access, cloud service availability, and browser compatibility. Because it is designed as a web-based platform, interruptions in connectivity or external service availability may affect registration access, document retrieval, data updates, and overall responsiveness.

### 3. No Native Mobile Application

The study is limited to a responsive web system and installable web application behavior. It does not include a fully native Android or iOS mobile application with platform-specific mobile features.

### 4. External Platform Dependence

Some system functions depend on third-party platforms and services. These include:

- social-media-linked source references for programs and events;
- Google Form and Google Sheet registration sync workflows;
- map and geolocation services for barangay and route-related views.

Because of this, changes in external platform rules, link validity, privacy settings, or service availability may affect some features even when the main system remains functional.

### 5. Data Accuracy and Completeness Dependence

The system can organize and present records, but the accuracy, timeliness, and completeness of the information still depend on authorized users who encode, upload, validate, and maintain the data. If documents are outdated, records are incomplete, or uploads are delayed, the quality of public information and admin analytics will also be affected.

### 6. No Payment and Financial Transaction Processing

The current study does not include online payment processing, digital disbursement workflows, cash handling, scholarship fund processing, or integration with formal government accounting, treasury, and external government database systems. Financial views in the platform are limited to reporting, encoding, analytics, and public disclosure functions.

### 7. No Formal E-Signature or Full Document Approval Workflow

The system supports digital records, uploads, and administrative data handling, but it does not implement a full legal e-signature workflow, formal records approval routing, or automated document authorization chain across government offices.

### 8. Limited Notification and Communication Automation

The platform does not currently include SMS gateway integration, automated mass messaging, email notification pipelines, or advanced notification orchestration for public users. Communication remains primarily platform-based and dependent on existing web access.

### 9. Citizen Desk Limitation

The Citizen Desk module supports structured submission, tracking, and status updates, but it is not intended to function as a complete replacement for all formal government complaint, legal, or investigative mechanisms. It is also not a full case-management platform with inter-agency escalation, evidence handling workflows, or statutory complaint adjudication.

### 10. Registration Automation Limitation

The registration sync workflow supports optional forwarding of portal registrations to configured Google Forms and Sheets, but it depends on correct external form setup, valid URLs, available worker execution, and compatible field mapping. If those external configurations are incomplete or changed, automated sync may fail or require manual correction.

### 11. Transparency Scope Limitation

The transparency modules are limited to the disclosure records, compliance rows, financial entries, and advisory data encoded into or uploaded to the system. The platform does not automatically scrape, verify, or legally certify all external public records. It functions as a structured publication and management environment, not as an automatic open-data harvesting or legal records validation system.

### 12. Security and Privacy Limitation

The system is designed to support protected access and proper handling of user data, but the present study does not guarantee absolute immunity from all cybersecurity threats, misuse, misconfiguration, or human error. Data privacy compliance also depends on proper administrative use, correct access assignment, and proportionate data collection practices.

### 13. Analytics Limitation

The analytics and dashboards included in the system are descriptive and operational in nature. They summarize stored records and support monitoring, but they do not include advanced predictive analytics, machine learning models, automated forecasting, or deep policy intelligence beyond the available encoded data.

### 14. Accessibility and Inclusivity Limitation

The platform is designed to be responsive and public-facing, but full real-world accessibility still depends on careful implementation, device capability, user digital literacy, and continued compliance review. The study does not claim that all usability and accessibility barriers for every user group have been fully eliminated.

### 15. Research Boundary Limitation

The present study focuses on the design and development of the proposed platform within the project timeline, available resources, and current implementation scope. It does not claim to resolve every institutional, organizational, legal, or adoption-related challenge in local youth governance beyond the digital functions addressed by the system.

## Concluding Scope Statement

In summary, the study covers the development of a centralized, role-based, web-based youth information, engagement, and transparency management system for LYDO-related operations. It includes both public and administrative workflows for information dissemination, registration management, transparency publication, financial reporting, citizen desk handling, and record-based monitoring. However, the study is bounded by internet dependence, data maintenance requirements, external service dependencies, and the exclusion of advanced features such as native mobile apps, payment systems, full case-management escalation, and full enterprise-level government integration.

## Scope and Limitations Summary

### I. Scope

- `Coverage Area:` selected Local Youth Development Offices within Metro Manila
- `Target Users:` youth participants, youth organizations, and LYDO administrators, with public users able to access transparency-related information and citizen-facing services
- `System Coverage:` centralized management and dissemination of youth program information, event and organization records, participation tracking, transparency records, citizen desk services, and administrative monitoring tools

### II. Limitations

- The system does not replace the full digital operations of the LGU or cover unrelated government offices and services
- The system does not include payment processing, scholarship fund processing, formal e-signature approval workflows, or full integration with existing government databases and systems
- The system depends on internet connectivity, cloud services, external tools, and timely data encoding or uploading by authorized administrators
- Public transparency pages may be accessed by the public, but account-based features and administrative functions remain limited to authorized or registered users
- The study is limited to selected LYDOs within Metro Manila and does not yet cover other regions or nationwide deployment
