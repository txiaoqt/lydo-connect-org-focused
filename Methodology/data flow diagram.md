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
    P0 -->|"Authentication result; policy prompts; organization profile and document status; budget and liquidation updates; published news preview; notifications"| E1

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
    P2 -->|"Profile and document status"| E1

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

### Process 2.0 Organization Profile and Document Submission

The Level 1 DFD shows how authenticated organization users complete their organization profile and submit the required documents in LYDO Connect. The process uses the organization profile records, required document types, document submission files, and notification or activity log data to save updates and track submission status.

- Organization users enter profile details and upload required documents through the protected portal.
- The system checks the linked account, required document list, and profile completeness before saving records.
- Profile updates and submitted files are stored in the organization profile and document submission data stores.
- Submission activity and status changes are recorded in the notifications and activity log store.
- Admin or staff users can review the saved profile and submitted documents for monitoring and follow-up.

### Level 1 Process Breakdown

The Level 1 DFD presents the main LYDO Connect workflow in five core processes. It shows how user access, public information viewing, profile and document submission, budget and liquidation handling, and admin monitoring are connected to the appropriate data stores.

- `1.0 Manage User Access`
  - Youth or public users submit account details or login information to enter the system.
  - The process verifies the account data and stores it in the user account records before returning the access result to the user.

- `2.0 View Public Information and Transparency`
  - Youth or public users browse programs, events, and transparency information available in the system.
  - The process retrieves the published transparency and organization records needed for public viewing.

- `3.0 Program and Event Registration`
  - Youth or public users submit registration details for available programs and events.
  - The process stores registration data in the registration records and can retrieve public registration-related information when needed.

- `4.0 Youth Service Request`
  - Youth or public users submit request or concern details through the system.
  - The process stores and updates the request records so the submitted concerns can be tracked and reviewed.

- `5.0 Manage Records and Generate Reports`
  - Admin or staff users manage programs, events, records, and content in the system.
  - The process updates the stored records, monitors service requests, and generates reports and audit outputs for review and monitoring.

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
        P21([2.1 Complete Organization Profile])
        P22([2.2 Validate Profile and Document Requirements])
        P23([2.3 Save Profile and Submission Records])
        P24([2.4 Review and Monitor Profile and Document Status])
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
    P21 -->|"Profile data and selected file submission"| P22

    P22 -->|"Check user account details"| D1
    D1 -->|"Account record"| P22

    P22 -->|"Check required document list"| D4
    D4 -->|"Document requirements"| P22

    P22 -->|"Validated profile and document package"| P23
    P23 -->|"New or updated organization profile"| D3
    P23 -->|"Document submission records"| D5
    P23 -->|"Activity log / status update"| D6
    P23 -->|"Profile save confirmation / submission status"| E1

    E2 -->|"Review or update profile and document records"| P24
    P24 -->|"Retrieve and update profile records"| D3
    P24 -->|"Retrieve and review document files"| D5
    P24 -->|"Store review activity log"| D6
    P24 -->|"Profile and submission summary / monitoring results"| E2
```

### Process 2.0 Decomposition

The Level 2 DFD breaks Process 2.0 into smaller actions that reflect the actual organization profile and document submission workflow in the system.

- `2.1 Complete Organization Profile`
  - The organization user enters or updates the profile details linked to the account, including the organization name, contact information, address, classification, adviser, representative, and other required profile fields.

- `2.2 Validate Profile and Document Requirements`
  - The system validates the account-linked profile data and checks the required document list before allowing the submission to proceed.
  - This step helps ensure that the profile is complete and that the selected file matches the expected document type.

- `2.3 Save Profile and Submission Records`
  - The system stores the updated organization profile, saves the uploaded document record, and records the submission activity.
  - After saving, the system returns a confirmation or status update to the organization user.

- `2.4 Review and Monitor Profile and Document Status`
  - Admin or staff users review the saved organization profile and submitted documents.
  - They update review status when needed and monitor the results through the stored profile, submission, and activity log records.

## Data Flow Summary

1. Organization users enter the system through authentication, policy acceptance, and role-based access.
2. Organization profile data and required documents are validated before being stored and reviewed.
3. Budget requests and liquidation reports are handled as linked workflow records after the profile and document stage.
4. Published news releases, transparency posts, and notifications are retrieved for preview and alert purposes.
5. Admin staff review records, maintain reference data, and generate monitoring outputs and audit logs.

## Scope Note

The DFD matches the current LYDO Connect workflow and intentionally excludes legacy program/event registration and other earlier-draft public-visitor flows.
