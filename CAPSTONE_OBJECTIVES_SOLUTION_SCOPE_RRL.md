# Capstone Draft (Updated to Current System)

## 1. Objectives of the Study

### General Objective
To design and develop a web-based Youth Governance Transparency and Accountability System for the Municipality of San Mateo, Rizal that centralizes youth records, participation services, and public transparency processes in one role-based digital platform.

### Specific Objectives
1. Consolidate Programs, Events, Organizations, Transparency, Citizen Desk, and Profile services into a single web platform for youth users, citizens, and administrators.
2. Implement validated participation workflows where users register or cancel for events and programs, and join or leave organizations, with corresponding status updates in user profiles and admin records.
3. Automate registration data flow by synchronizing portal registrations to attendance pipelines (Supabase and Google Form/Sheet-linked outputs) with trackable sync statuses and retry controls.
4. Publish and maintain transparency datasets through disclosure documents, quarterly board entries, monthly compliance records, and barangay-level financial and mapping views with user-facing filters.
5. Enforce governance accountability by recording auditable create/update/delete changes and deploying the platform with Progressive Web App (PWA) capability for installable admin operations and continuous web access.

## 2. Proposed System Solution

The proposed solution is an integrated web platform that addresses fragmented youth governance processes by combining youth engagement services and transparency services in one environment. Instead of handling announcements, registrations, compliance records, and citizen concerns in separate channels, the system provides a single digital workflow from content publication to public participation and administrative monitoring.

The intended users are: (1) youth residents and general citizens who need access to programs, events, organizations, transparency information, and service ticketing; and (2) LYDO administrators and authorized personnel who manage records, compliance entries, financial datasets, and governance logs. The system supports both public consumption and administrative control through role-based interfaces.

Major features include source-linked event/program records, participation registration flows, transparency document registry, full disclosure board and monthly compliance management, financial disclosure views, barangay map data, citizen desk ticketing and tracking, and admin audit logs. The platform is implemented as a modern responsive web system with cloud-backed data storage and policy-based access control.

## 3. Scope and Limitations

### Scope
1. The system covers youth governance and transparency processes for San Mateo, Rizal.
2. Users covered include youth/public users and authorized admin-side personnel.
3. Included public modules are Programs, Events, Organizations, Profile, Transparency Reports, Transparency Board, Financial Disclosure, Barangay Map, Citizen Desk, and Service Advisories.
4. Included admin modules are Dashboard, Programs, Events, Organizations, Barangays, Documents, Transparency Board Config, Financial DSS, Citizen Desk Admin, Users, Roles, and Audit Logs.
5. Included process scope covers record publishing, user registration/join workflows, compliance encoding, ticket submission and tracking, and change auditing.
6. Included data scope covers tables for youth records, registrations, transparency records, financial/compliance records, ticketing records, and audit records.

### Limitations
1. The system depends on stable internet connectivity for all online operations.
2. Facebook source-post embedding depends on the original post's permalink format and privacy/embeddability settings.
3. Source-post ingestion is not automatic scraping; official links are encoded and managed through admin workflows.
4. The platform does not include native Android/iOS apps; access is via responsive web interfaces (admin has installable web app behavior).
5. The system does not include payment processing workflows.
6. The system does not include SMS gateway notifications by default.
7. Analytics are operational dashboards and summaries; advanced predictive modeling is outside the current scope.
8. Data accuracy for records and disclosures depends on authorized user encoding and maintenance.

## 4. Review of Related Literature (RRL)

### 4.1 Thematic Synthesis

Prior studies show that e-government success is not driven by technology alone but by trust, transparency, service quality, and governance design. DeLone and McLean (2003) provide a foundational success model emphasizing system quality, information quality, service quality, usage, user satisfaction, and net benefits. This aligns with the need for measurable quality and outcomes in an integrated governance platform.

Citizen adoption literature emphasizes trust and risk. Carter and Belanger (2005) and Belanger and Carter (2008) found that citizen trust in both government and the internet is a major determinant of e-government use. For this study, trust-linked workflows are reflected in transparent records, trackable transactions, and readable accountability logs.

On transparency, Bertot et al. (2010), Meijer et al. (2012), and Janssen et al. (2012) highlight that openness requires both information disclosure and citizen-facing interaction, while implementation barriers include institutional and organizational constraints. This supports combining disclosure publication, compliance tracking, and citizen-facing access in one system rather than isolated pages.

On participation and coproduction, Medaglia (2012), Nam (2012), and Linders (2012) show that digital participation requires structured channels and clear interaction modes. These findings support integrated registration workflows, citizen desk submission, and feedback visibility.

Service quality and operational measurement literature, including Papadomichelaki and Mentzas (2012) and Papadomichelaki and Mentzas (2006), supports defining concrete quality and performance dimensions for one-stop government services. This is consistent with using module-level workflows, dashboard indicators, and auditable updates.

Social media and government transparency studies (Bonson et al., 2012; Song and Lee, 2016) support the role of digital channels in strengthening transparency perception and trust, which is relevant to source-post-linked official records. CRM-based public service studies (Wu, 2021) further support structured ticketing workflows for citizen-government interaction quality.

### 4.2 Selected Studies with DOI

| No. | Study | Key Contribution | Relevance to This System | DOI / Link |
|---|---|---|---|---|
| 1 | DeLone, W. H., & McLean, E. R. (2003). *The DeLone and McLean Model of Information Systems Success: A Ten-Year Update*. | Defines measurable IS success dimensions. | Basis for defining verifiable system outcomes and quality dimensions. | https://doi.org/10.1080/07421222.2003.11045748 |
| 2 | Carter, L., & Belanger, F. (2005). *The utilization of e-government services: citizen trust, innovation and acceptance factors*. | Identifies trust and compatibility drivers of adoption. | Supports trust-centered design for user participation modules. | https://doi.org/10.1111/j.1365-2575.2005.00183.x |
| 3 | Belanger, F., & Carter, L. (2008). *Trust and risk in e-government adoption*. | Explains trust-risk effects on intention to use. | Supports transparent and traceable workflows to reduce perceived risk. | https://doi.org/10.1016/j.jsis.2007.12.002 |
| 4 | Gil-Garcia, J. R., & Pardo, T. A. (2005). *E-government success factors: Mapping practical tools to theoretical foundations*. | Connects strategic and institutional factors to e-government success. | Supports integrated governance modules beyond pure technical implementation. | https://doi.org/10.1016/j.giq.2005.02.001 |
| 5 | Bertot, J. C., Jaeger, P. T., & Grimes, J. M. (2010). *Using ICTs to create a culture of transparency*. | Shows ICT and social media roles in openness and anti-corruption. | Supports transparency plus citizen interaction in a unified platform. | https://doi.org/10.1016/j.giq.2010.03.001 |
| 6 | Bonson, E., Torres, L., Royo, S., & Flores, F. (2012). *Local e-government 2.0: Social media and corporate transparency in municipalities*. | Demonstrates municipal transparency potential via social channels. | Supports source-post-linked publication and public-facing transparency content. | https://doi.org/10.1016/j.giq.2011.10.001 |
| 7 | Meijer, A. J., Curtin, D., & Hillebrandt, M. (2012). *Open government: connecting vision and voice*. | Frames open government as both information and participation. | Supports pairing disclosure modules with citizen interaction modules. | https://doi.org/10.1177/0020852311429533 |
| 8 | Janssen, M., Charalabidis, Y., & Zuiderwijk, A. (2012). *Benefits, Adoption Barriers and Myths of Open Data and Open Government*. | Identifies practical barriers and myths in open data initiatives. | Supports realistic scope-setting and phased transparency implementation. | https://doi.org/10.1080/10580530.2012.716740 |
| 9 | Medaglia, R. (2012). *eParticipation Research: Moving Characterization Forward (2006-2011)*. | Reviews the evolution and directions of eParticipation research. | Supports structured digital participation channels in the system. | https://doi.org/10.1016/j.giq.2012.02.010 |
| 10 | Nam, T. (2012). *Suggesting frameworks of citizen-sourcing via Government 2.0*. | Proposes frameworks for citizen contribution using digital platforms. | Supports citizen desk and participatory workflows. | https://doi.org/10.1016/j.giq.2011.07.005 |
| 11 | Linders, D. (2012). *From e-government to we-government*. | Defines typology for citizen coproduction in digital governance. | Supports user-government co-production through registrations and reporting. | https://doi.org/10.1016/j.giq.2012.06.003 |
| 12 | Papadomichelaki, X., & Mentzas, G. (2012). *e-GovQual: A multiple-item scale for assessing e-government service quality*. | Provides validated dimensions for e-government service quality. | Supports measurable quality criteria for portal services. | https://doi.org/10.1016/j.giq.2011.08.011 |
| 13 | Papadomichelaki, X., & Mentzas, G. (2006). *A general model of performance and quality for one-stop e-Government service offerings*. | Provides indicator-oriented one-stop service quality model. | Supports one-stop design logic of integrated modules. | https://doi.org/10.1016/j.giq.2006.07.016 |
| 14 | Song, C., & Lee, J. (2016). *Citizens' Use of Social Media in Government, Perceived Transparency, and Trust in Government*. | Shows social media use relates to transparency perception and trust. | Supports source-linked official content and transparency communication. | https://doi.org/10.1080/15309576.2015.1108798 |
| 15 | Wu, W.-N. (2021). *Does Citizens' 311 System Use Improve Satisfaction with Public Service Encounters?* | Links citizen CRM use with dimensions of public service satisfaction. | Supports citizen desk request-management workflow rationale. | https://doi.org/10.1080/01900692.2020.1744644 |

### 4.3 Research Gap Addressed by the Proposed Study

Most studies discuss transparency, participation, service quality, or trust as separate themes. The proposed study addresses the operational gap by integrating these themes in one municipal platform that combines: (1) youth engagement workflows, (2) transparency disclosure and compliance workflows, (3) citizen service request workflows, and (4) auditable governance controls. This integration is the primary contribution of the study.
