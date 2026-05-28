# Data Flow Diagram

## Overview

This section presents the Data Flow Diagram (DFD) of **LYDO Connect** in three levels: the **Context Diagram (Level 0)**, **DFD Level 1**, and **DFD Level 2 of Process 3.0 Program and Event Registration**. The updated diagrams follow the reduced data-store scope from the latest draft and focus on user access, public information, registration flow, youth service requests, and admin monitoring/reporting.

## External Entities

- `E1` Youth User / Public User
- `E2` LYDO Admin / Staff / LYDO Personnel

## Context Diagram (Level 0)

```mermaid
flowchart LR
    E1[/"E1 Youth User / Public User"/]
    P0((P0 LYDO Connect System))
    E2[/"E2 LYDO Admin / Staff / LYDO Personnel"/]

    E1 -->|"Account/login details; browse public information; registration details; request/concern details"| P0
    P0 -->|"Public information; registration confirmation/status; service request updates"| E1

    E2 -->|"Manage programs, events, records, and content; review/update registrations; monitor service requests"| P0
    P0 -->|"Reports, summaries, monitoring results, and audit outputs"| E2
```

*Figure 1: Context Diagram*

## Data Flow Diagram Level 1

### Major Processes

- `1.0` Manage User Access
- `2.0` View Public Information and Transparency
- `3.0` Program and Event Registration
- `4.0` Youth Service Request
- `5.0` Manage Records and Generate Reports

### Data Stores (Reduced)

- `D1` User Accounts
- `D2` Programs, Events, and Registrations
- `D3` Service Requests
- `D4` Transparency and Organization Records
- `D5` Reports and Audit Logs

```mermaid
%%{init: {"flowchart": {"curve": "stepBefore"}} }%%
flowchart LR
    subgraph LEFT["External Entities"]
        direction TB
        E1[/"E1 Youth User / Public User"/]
        E2[/"E2 LYDO Admin / Staff"/]
    end

    subgraph CORE["Core Processes"]
        direction TB
        P1([1.0 Manage User Access])
        P3([3.0 Program and Event Registration])
        P2([2.0 View Public Information and Transparency])
        P5([5.0 Manage Records and Generate Reports])
        P4([4.0 Youth Service Request])
    end

    subgraph STORES["Data Stores"]
        direction TB
        D1[(D1 User Accounts)]
        D2[(D2 Programs, Events, and Registrations)]
        D4[(D4 Transparency and Organization Records)]
        D5[(D5 Reports and Audit Logs)]
        D3[(D3 Service Requests)]
    end

    E1 -->|"Account details / login"| P1
    P1 -->|"Store / verify account data"| D1

    E1 -->|"Registration details"| P3
    P3 -->|"Store registration records"| D2
    P3 -->|"Retrieve public records"| D2

    E1 -->|"Browse programs, events, transparency records"| P2
    P2 -->|"Retrieve transparency and organization records"| D4

    E1 -->|"Request or concern details"| P4
    P4 -->|"Store and update request records"| D3

    E2 -->|"Manage programs, events, records, and content"| P5
    P5 -->|"Update managed records"| D2
    P5 -->|"Update transparency and organization records"| D4
    P5 -->|"Monitor service requests"| D3
    P5 -->|"Store reports and audit logs"| D5
    P5 -->|"Reports, summaries, and monitoring results"| E2

    classDef entity fill:#f8f8f8,stroke:#666,stroke-width:1.2px,color:#222;
    classDef process fill:#e9f2fb,stroke:#5d84b3,stroke-width:1.5px,color:#1f2e3d,rx:10,ry:10;
    classDef store fill:#ffffff,stroke:#666,stroke-width:1.2px,color:#222;
    class E1,E2 entity;
    class P1,P2,P3,P4,P5 process;
    class D1,D2,D3,D4,D5 store;
```

*Figure 2: Data Flow Diagram Level 1*

### Data Flow Diagram Level 1 Process Description

The DFD Level 1 provides a more detailed view of the updated LYDO Connect scope using five core processes and reduced data stores (up to `D5`). It shows how user requests and admin management actions are processed, stored, and monitored.

### Manage User Access (1.0)

- Youth/public users submit account details or login information.
- The process stores and verifies account data in `D1 User Accounts`.

### View Public Information and Transparency (2.0)

- Youth/public users browse programs, events, and transparency information.
- The process retrieves transparency and organization records from `D4 Transparency and Organization Records`.

### Program and Event Registration (3.0)

- Youth/public users submit registration details.
- Registration data is stored in `D2 Programs, Events, and Registrations`.
- Public registration-related records can also be retrieved from `D2` as needed.

### Youth Service Request (4.0)

- Youth/public users submit request or concern details.
- The process stores and updates request records in `D3 Service Requests`.

### Manage Records and Generate Reports (5.0)

- Admin/staff manages programs, events, records, and content.
- The process updates managed program/registration records in `D2`.
- The process updates transparency and organization records in `D4`.
- The process monitors service requests through `D3`.
- Reports and audit outputs are stored in `D5 Reports and Audit Logs`.
- Reports, summaries, and monitoring results are returned to admin/staff.

## Data Flow Diagram Level 2 of Process 3.0 Program and Event Registration

```mermaid
%%{init: {"flowchart": {"curve": "stepBefore"}} }%%
flowchart LR
    subgraph LEFT["External Entities"]
        direction TB
        E1[/"E1 Youth User / Citizen"/]
        E2[/"E2 Admin / Staff / LYDO Personnel"/]
    end

    subgraph CORE["Process 3.0 Decomposition"]
        direction LR
        P31([3.1 Submit Registration])
        P32([3.2 Validate Registration])
        P33([3.3 Save Registration Record])
        P34([3.4 Manage and Monitor Registrations])
    end

    subgraph STORES["Data Stores"]
        direction TB
        D1[(D1 User Accounts)]
        D2[(D2 Programs and Events)]
        D3[(D3 Registration Records)]
        D4[(D4 Audit Logs)]
    end

    E1 -->|"Registration details"| P31
    P31 -->|"Submitted registration"| P32

    P32 -->|"Check user account details"| D1
    D1 -->|"User account details"| P32

    P32 -->|"Check program/event details"| D2
    D2 -->|"Program/event details"| P32

    P32 -->|"Validated registration"| P33
    P33 -->|"New or updated registration"| D3
    P33 -->|"Registration activity log"| D4
    P33 -->|"Registration confirmation / status"| E1

    E2 -->|"Review or update registrations"| P34
    P34 -->|"Retrieve and update registration records"| D3
    P34 -->|"Registration summary / monitoring results"| E2

    classDef entity fill:#f8f8f8,stroke:#666,stroke-width:1.2px,color:#222;
    classDef process fill:#e9f2fb,stroke:#5d84b3,stroke-width:1.5px,color:#1f2e3d,rx:10,ry:10;
    classDef store fill:#ffffff,stroke:#666,stroke-width:1.2px,color:#222;
    class E1,E2 entity;
    class P31,P32,P33,P34 process;
    class D1,D2,D3,D4 store;
```

*Figure 3: Data Flow Diagram Level 2 of Process 3.0 Program and Event Registration*

### Data Flow Diagram Level 2 Process Description

The DFD Level 2 provides a more detailed view of **Process 3.0 Program and Event Registration**, building on the Level 1 diagram. It shows how registration details are submitted, validated against user and program/event records, saved in registration records, and monitored by admin/staff with corresponding audit logging.

### Program and Event Registration (3.0)

- Youth users/citizens submit registration details for LYDO programs and events.
- The process validates user account details and registration inputs.
- Program/event details are checked before saving registrations.
- New or updated registration records are stored.
- Admin/staff can review, update, and monitor registration results.
- Registration activity is recorded in audit logs.

### Submit Registration (3.1)

- Captures registration details submitted by youth users/citizens.
- Passes submitted registration data to validation.

### Validate Registration (3.2)

- Validates user account details and registration completeness.
- Checks program/event details before approval.

### Save Registration Record (3.3)

- Saves new or updated registration entries.
- Records registration activity logs.
- Sends registration confirmation or status to the youth user/citizen.

### Manage and Monitor Registrations (3.4)

- Allows admin/staff to review or update registration records.
- Produces registration summaries and monitoring results for admin/staff.
