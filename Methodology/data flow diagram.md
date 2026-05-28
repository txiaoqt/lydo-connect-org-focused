# Data Flow Diagram

## Overview

This section presents the Data Flow Diagram (DFD) of **LYDO Connect** in three levels: the **Context Diagram (Level 0)**, **DFD Level 1**, and **DFD Level 2 of Process 4.0 Program/Event Registration Service**. These diagrams show how youth users/citizens and admin/staff interact with the system for account access, policy agreement, public information browsing, program/event registration, youth service requests, administrative management, reporting, and audit logs.

## External Entities

- `E1` Youth User / Citizen
- `E2` Admin / Staff / LYDO Personnel
- `E3` External Registration Source

## Context Diagram (Level 0)

```mermaid
flowchart LR
    subgraph LEFT["External Entity"]
        direction TB
        E1[/"E1 Youth User / Citizen"/]
    end

    subgraph CENTER["System Boundary"]
        direction TB
        P0((P0 LYDO Connect System))
    end

    subgraph RIGHT["External Entities"]
        direction TB
        E2[/"E2 Admin / Staff / LYDO Personnel"/]
        E3[/"E3 External Registration Source"/]
    end

    E1 -->|"Sign up/login; browse programs/events; register for programs/events; submit youth service/document requests; view request or registration status"| P0
    P0 -->|"Public information; registration confirmation/status; request updates; policy prompts"| E1

    E2 -->|"Manage programs/events; manage users and records; review requests; generate reports; view audit logs"| P0
    P0 -->|"Dashboard data; reports; alerts; request summaries; exported records"| E2

    E3 -->|"External registration rows for sync"| P0
    P0 -->|"Sync status and validation feedback"| E3
```

*Figure 1: Context Diagram*

## Data Flow Diagram Level 1

### Major Processes

- `1.0` Account and Access Management
- `2.0` Policy Agreement Management
- `3.0` Public Information and Transparency Viewing
- `4.0` Program/Event Registration Service
- `5.0` Youth Service Request Service
- `6.0` Admin Data and Content Management
- `7.0` Monitoring, Reporting, and Audit

### Data Stores

- `D1` User Accounts and Profiles
- `D2` Roles and Permissions
- `D3` Policy Versions and User Policy Acceptance
- `D4` Programs and Events
- `D5` Registration Records
- `D6` Youth Organization and References
- `D7` Transparency, Financial, and Compliance Records
- `D8` Youth Service Request Records
- `D9` Audit Logs

```mermaid
flowchart LR
    subgraph LEFT["External Entity"]
        direction TB
        E1[/"E1 Youth User / Citizen"/]
    end

    subgraph CORE["Core LYDO Connect Processes"]
        direction TB
        P1((1.0 Account and Access Management))
        P2((2.0 Policy Agreement Management))
        P3((3.0 Public Information and Transparency Viewing))
        P4((4.0 Program/Event Registration Service))
        P5((5.0 Youth Service Request Service))
        P6((6.0 Admin Data and Content Management))
        P7((7.0 Monitoring, Reporting, and Audit))
    end

    subgraph STORES["Data Stores"]
        direction TB
        D1[(D1 User Accounts and Profiles)]
        D2[(D2 Roles and Permissions)]
        D3[(D3 Policy Versions and User Policy Acceptance)]
        D4[(D4 Programs and Events)]
        D5[(D5 Registration Records)]
        D6[(D6 Youth Organization and References)]
        D7[(D7 Transparency, Financial, and Compliance Records)]
        D8[(D8 Youth Service Request Records)]
        D9[(D9 Audit Logs)]
    end

    subgraph RIGHT["External Entities"]
        direction TB
        E2[/"E2 Admin / Staff / LYDO Personnel"/]
        E3[/"E3 External Registration Source"/]
    end

    E1 -->|"Account/login details"| P1
    E1 -->|"Policy acceptance input"| P2
    E1 -->|"Public information request"| P3
    E1 -->|"Registration details"| P4
    E1 -->|"Youth service request details"| P5

    E3 -->|"External registration rows"| P4
    P4 -->|"Registration summary/processing feedback"| E2
    P5 -->|"Service request summary"| E2
    P6 -->|"Management confirmation"| E2
    P7 -->|"Reports and audit summaries"| E2
    P4 -->|"Sync status and validation feedback"| E3

    P1 -->|"Account/profile data"| D1
    P1 -->|"Role/permission data"| D2
    P2 -->|"Policy acceptance data"| D3
    P3 -->|"Program/event reference data"| D4
    P3 -->|"Organization reference data"| D6
    P3 -->|"Transparency/compliance data"| D7

    P4 -->|"User/profile reference data"| D1
    P4 -->|"Program/event details and availability"| D4
    P4 -->|"Registration records (create/update)"| D5
    P4 -->|"Registration audit entries"| D9

    P5 -->|"Service request records"| D8
    P6 -->|"Managed core records"| D1
    P6 -->|"Managed program records"| D4
    P6 -->|"Managed service request records"| D8
    P7 -->|"Registration summary data"| D5
    P7 -->|"Service request summary data"| D8
    P7 -->|"Audit trail data"| D9
```

*Figure 2: Data Flow Diagram Level 1*

## Data Flow Diagram Level 2 of Process 4.0 Program/Event Registration Service

```mermaid
flowchart LR
    subgraph LEFT["External Sources"]
        direction TB
        E1[/"E1 Youth User / Citizen"/]
        E3[/"E3 External Registration Source"/]
    end

    subgraph CORE["Process 4.0 Decomposition"]
        direction LR
        P41((4.1 Receive Registration Request))
        P42((4.2 Validate Eligibility and Required Fields))
        P43((4.3 Check Program/Event Availability))
        P45((4.5 Save or Update Registration Record))
        P46((4.6 Send Registration Status and Confirmation))
    end

    subgraph AUX["Supporting Processes"]
        direction TB
        P44((4.4 Import and Reconcile External Registration Rows))
        P47((4.7 Admin Review and Registration Management))
    end

    subgraph STORES["Data Stores"]
        direction TB
        D1[(D1 User Accounts and Profiles)]
        D4[(D4 Programs and Events)]
        D5[(D5 Registration Records)]
        D9[(D9 Audit Logs)]
    end

    E2[/"E2 Admin / Staff / LYDO Personnel"/]

    E1 -->|"Registration details"| P41
    P41 -->|"Submitted registration details"| P42

    P42 -->|"User profile/eligibility query"| D1
    D1 -->|"User profile and eligibility data"| P42
    P42 -->|"Validated user and registration details"| P43

    P43 -->|"Program/event query"| D4
    D4 -->|"Program/event details and slot availability"| P43
    P43 -->|"Approved registration details"| P45
    P43 -->|"Unavailable slot or registration issue status"| P46

    E3 -->|"External registration rows"| P44
    P44 -->|"Existing registration records query"| D5
    D5 -->|"Matched/reconciled registration rows"| P44
    P44 -->|"Validated imported registrations"| P45

    E2 -->|"Review action/registration update"| P47
    P47 -->|"Registration records for review query"| D5
    D5 -->|"Updated registration status"| P47
    P47 -->|"Approved or updated registration details"| P45

    P45 -->|"New or updated registration record"| D5
    P45 -->|"Registration audit entry"| D9
    P45 -->|"Final registration status"| P46

    P46 -->|"Registration confirmation/rejection/waitlist/status update"| E1
    P46 -->|"Registration summary or processing confirmation"| E2
```

*Figure 3: Data Flow Diagram Level 2 of Process 4.0 Program/Event Registration Service*

### Program/Event Registration Service (4.0)

- Youth users/citizens submit registration details for available LYDO programs or events.
- The system validates the user profile, required fields, and eligibility requirements.
- The system checks the selected program/event details and available slots.
- Valid registrations are saved in `D5 Registration Records`.
- If external registration sources are used, imported rows are matched and reconciled with existing registration records.
- Admin/staff can review, approve, update, or manage registration records.
- The system sends confirmation, rejection, waitlist, or status updates to the youth user/citizen.
- Important registration actions are recorded in `D9 Audit Logs`.

### Receive Registration Request (4.1)

- Captures registration details submitted by the youth user/citizen.
- Passes submitted data to validation.

### Validate Eligibility and Required Fields (4.2)

- Checks user profile, required registration fields, and eligibility.
- Uses `D1 User Accounts and Profiles` as reference.

### Check Program/Event Availability (4.3)

- Checks selected program/event information and slot availability.
- Uses `D4 Programs and Events` as reference.

### Import and Reconcile External Registration Rows (4.4)

- Accepts rows from external registration sources, such as imported sheets or forms.
- Matches imported rows with existing records in `D5 Registration Records` to avoid duplicates.

### Save or Update Registration Record (4.5)

- Creates or updates registration records in `D5`.
- Sends important actions to `D9 Audit Logs`.

### Send Registration Status and Confirmation (4.6)

- Sends confirmation, rejection, waitlist, or status update to the youth user/citizen.
- Sends summaries or processing confirmation to admin/staff.

### Admin Review and Registration Management (4.7)

- Allows admin/staff to review, approve, update, or manage program/event registration records.
- Updates registration status in `D5 Registration Records`.
