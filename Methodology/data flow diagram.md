# Data Flow Diagram

This section presents the Data Flow Diagram (DFD) of LYDO Connect in three levels: the Context Diagram (Level 0), DFD Level 1, and DFD Level 2 of Process 2.0 Organization Profile and Document Submission. The diagrams follow the current site scope and focus on authenticated organization work, budget and liquidation processing, news previewing, notifications, and admin monitoring/reporting.

## External Entities

- `E1` Organization User / Authenticated User
- `E2` LYDO Admin / Staff / LYDO Personnel

## Figure 1. Context Diagram (Level 0)

```mermaid
flowchart LR
    E1[/"E1 Organization User / Authenticated User"/]
    P0((P0 LYDO Connect System))
    E2[/"E2 LYDO Admin / Staff / LYDO Personnel"/]

    E1 -->|"Account/login details; policy acceptance; organization profile details; required documents; budget request and liquidation details; news preview and notification interactions"| P0
    P0 -->|"Authentication result; policy prompts; registration and document status; budget and liquidation updates; published news preview; notifications"| E1

    E2 -->|"Review and update profiles, documents, budget requests, liquidation reports, news releases, templates, notifications, and logs"| P0
    P0 -->|"Monitoring summaries; review queues; barangay budget reports; audit outputs; status updates"| E2
```

## Figure 2. Data Flow Diagram Level 1

```mermaid
%%{init: {"flowchart": {"curve": "stepBefore"}} }%%
flowchart LR
    subgraph LEFT["External Entities"]
        direction TB
        E1[/"E1 Organization User / Authenticated User"/]
        E2[/"E2 LYDO Admin / Staff / LYDO Personnel"/]
    end

    subgraph CORE["Core Processes"]
        direction TB
        P1([1.0 Manage User Access])
        P2([2.0 Manage Organization Profile and Documents])
        P3([3.0 Manage Budget Requests and Liquidation])
        P4([4.0 Manage News, Notifications, and Records])
        P5([5.0 Admin Monitoring and Reports])
    end

    subgraph STORES["Data Stores"]
        direction TB
        D1[(D1 User Accounts and Roles)]
        D2[(D2 Policy Versions and Acceptance)]
        D3[(D3 Organization Profiles)]
        D4[(D4 Required Document Types)]
        D5[(D5 Document Submissions and Files)]
        D6[(D6 Budget Requests and Attachments)]
        D7[(D7 Liquidation Reports and Files)]
        D8[(D8 News Releases and Transparency Posts)]
        D9[(D9 Notifications and Activity Logs)]
    end

    E1 -->|"Account details / login"| P1
    P1 -->|"Store / verify account data"| D1
    P1 -->|"Load active policy and acceptance status"| D2
    P1 -->|"Access result / policy prompt"| E1

    E1 -->|"Organization profile details / document files"| P2
    P2 -->|"Retrieve required document types"| D4
    P2 -->|"Store / update organization profile"| D3
    P2 -->|"Store submission files and document status"| D5
    P2 -->|"Registration and document status"| E1

    E1 -->|"Budget request details / supporting file"| P3
    P3 -->|"Store / update budget request records"| D6
    P3 -->|"Create or update liquidation record after approval"| D7
    P3 -->|"Write workflow log"| D9
    P3 -->|"Budget and liquidation updates"| E1

    E1 -->|"News preview / notification check"| P4
    P4 -->|"Retrieve published news and transparency records"| D8
    P4 -->|"Read notifications"| D9
    P4 -->|"Preview and alert updates"| E1

    E2 -->|"Review and update records"| P5
    P5 -->|"Update organization profiles"| D3
    P5 -->|"Review document submissions"| D5
    P5 -->|"Review budget requests"| D6
    P5 -->|"Review liquidation reports"| D7
    P5 -->|"Maintain required document types"| D4
    P5 -->|"Manage news and transparency records"| D8
    P5 -->|"Store monitoring results and audit logs"| D9
    P5 -->|"Reports, summaries, and monitoring results"| E2
```

## Figure 3. Data Flow Diagram Level 2 of Process 2.0 Organization Profile and Document Submission

```mermaid
%%{init: {"flowchart": {"curve": "stepBefore"}} }%%
flowchart LR
    subgraph LEFT["External Entities"]
        direction TB
        E1[/"E1 Organization User / Authenticated User"/]
        E2[/"E2 LYDO Admin / Staff / LYDO Personnel"/]
    end

    subgraph CORE["Process 2.0 Decomposition"]
        direction LR
        P21([2.1 Submit Organization Profile])
        P22([2.2 Validate Profile and Requirements])
        P23([2.3 Save Profile and Document Records])
        P24([2.4 Manage and Monitor Organization Registrations])
    end

    subgraph STORES["Data Stores"]
        direction TB
        D1[(D1 User Accounts and Roles)]
        D2[(D2 Policy Versions and Acceptance)]
        D3[(D3 Organization Profiles)]
        D4[(D4 Required Document Types)]
        D5[(D5 Document Submissions and Files)]
        D6[(D6 Notifications and Activity Logs)]
    end

    E1 -->|"Organization details and required document files"| P21
    P21 -->|"Submitted profile and document package"| P22

    P22 -->|"Check user account details"| D1
    D1 -->|"Account details"| P22

    P22 -->|"Check policy acceptance"| D2
    D2 -->|"Policy acceptance status"| P22

    P22 -->|"Check required document list"| D4
    D4 -->|"Required document rules"| P22

    P22 -->|"Validated profile and document package"| P23
    P23 -->|"New or updated organization profile"| D3
    P23 -->|"Document submission records"| D5
    P23 -->|"Activity log / status update"| D6
    P23 -->|"Registration confirmation / status"| E1

    E2 -->|"Review or update registration records"| P24
    P24 -->|"Retrieve and update profile records"| D3
    P24 -->|"Retrieve and review document files"| D5
    P24 -->|"Store review activity log"| D6
    P24 -->|"Profile summary / monitoring results"| E2
```

## Data Flow Summary

1. Organization users enter the system through authentication, policy acceptance, and role-based access.
2. Organization profile data and required documents are validated before being stored and reviewed.
3. Budget requests and liquidation reports are handled as linked workflow records after the profile and document stage.
4. Published news releases, transparency posts, and notifications are retrieved for preview and alert purposes.
5. Admin staff review records, maintain reference data, and generate monitoring outputs and audit logs.

## Scope Note

The DFD matches the current LYDO Connect workflow and intentionally excludes legacy program/event registration and other earlier-draft public-visitor flows.
