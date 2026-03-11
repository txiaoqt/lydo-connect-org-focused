begin;

-- Optional Template Pack B
-- Adds another reusable dataset (different from 09_template_seed_data.sql).
-- Safe to re-run: uses on conflict upserts.

-- Programs
insert into public.programs (
  slug,
  title,
  sector,
  description,
  start_date,
  end_date,
  schedule_text,
  location,
  status,
  source_post_url,
  published_at
)
values
  (
    'youth-digital-skills-bootcamp-2026',
    'Youth Digital Skills Bootcamp 2026',
    'LYDO',
    'Hands-on training on productivity tools, basic web skills, and digital career pathways.',
    date '2026-04-10',
    date '2026-04-12',
    null,
    'San Mateo Youth Center',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'barangay-innovation-microgrants-2026',
    'Barangay Innovation Microgrants Program',
    'LYDO',
    'Seed support for barangay-led youth projects in livelihood, environment, and community service.',
    date '2026-05-01',
    date '2026-08-31',
    null,
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'siklab-sports-wellness-caravan-2026',
    'SIKLAB Sports and Wellness Caravan',
    'SK',
    'Multi-barangay youth wellness, sports, and mental health engagement caravan.',
    date '2026-05-15',
    date '2026-07-15',
    null,
    'Multiple Barangays, San Mateo',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'kabataan-disaster-readiness-labs-2026',
    'Kabataan Disaster Readiness Labs',
    'YDAC',
    'Youth preparedness sessions with drills, risk mapping, and local volunteer mobilization.',
    date '2026-06-05',
    date '2026-06-30',
    null,
    'San Mateo MDRRMO Grounds',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  )
on conflict (slug) do update set
  title = excluded.title,
  sector = excluded.sector,
  description = excluded.description,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  schedule_text = excluded.schedule_text,
  location = excluded.location,
  status = excluded.status,
  source_post_url = excluded.source_post_url,
  published_at = excluded.published_at,
  updated_at = now();

-- Events
insert into public.events (
  slug,
  title,
  sector,
  description,
  event_date,
  location,
  status,
  source_post_url,
  published_at
)
values
  (
    'youth-digital-skills-demo-day-2026',
    'Youth Digital Skills Demo Day',
    'LYDO',
    'Showcase of outputs from the digital skills bootcamp.',
    date '2026-04-20',
    'San Mateo Youth Center',
    'upcoming',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'siklab-opening-games-2026',
    'SIKLAB Opening Games',
    'SK',
    'Kickoff event for the sports and wellness caravan.',
    date '2026-05-05',
    'Municipal Covered Court',
    'upcoming',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'municipal-youth-policy-consultation-2026',
    'Municipal Youth Policy Consultation',
    'LYDC',
    'Open consultation on municipal youth policy priorities for FY 2027.',
    date '2026-06-02',
    'Sangguniang Bayan Hall',
    'upcoming',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'climate-action-volunteer-day-2026',
    'Climate Action Volunteer Day',
    'YDAC',
    'Tree planting and clean-up drive led by youth volunteers.',
    date '2026-02-24',
    'Barangay Banaba',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  )
on conflict (slug) do update set
  title = excluded.title,
  sector = excluded.sector,
  description = excluded.description,
  event_date = excluded.event_date,
  location = excluded.location,
  status = excluded.status,
  source_post_url = excluded.source_post_url,
  published_at = excluded.published_at,
  updated_at = now();

-- Organizations
insert into public.organizations (
  slug,
  name,
  type,
  focus,
  source_tag,
  status,
  source_post_url
)
values
  (
    'san-mateo-youth-tech-club',
    'San Mateo Youth Tech Club',
    'Youth Interest Group',
    'Digital literacy, coding circles, and career readiness',
    'Template Pack B',
    'active',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'rizal-green-youth-coalition',
    'Rizal Green Youth Coalition',
    'Advocacy Network',
    'Climate action and environmental stewardship',
    'Template Pack B',
    'partner',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'kabataang-lingkod-bayan-san-mateo',
    'Kabataang Lingkod Bayan - San Mateo',
    'Civic Volunteer Group',
    'Community service and civic volunteerism',
    'Template Pack B',
    'active',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'young-creative-media-circle',
    'Young Creative Media Circle',
    'Campus Youth Partner',
    'Youth communications, media production, and storytelling',
    'Template Pack B',
    'active',
    'https://www.facebook.com/sanmateolydo/'
  )
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  focus = excluded.focus,
  source_tag = excluded.source_tag,
  status = excluded.status,
  source_post_url = excluded.source_post_url,
  updated_at = now();

-- Disclosure documents
with docs as (
  select * from (values
    (
      'doc-101',
      'SK Midyear Budget Utilization Statement',
      'financial_statement',
      2026,
      'Q2',
      null,
      true,
      'LYDO',
      date '2026-06-15',
      1887437::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-102',
      'Youth Digital Skills Bootcamp Outcome Report',
      'program_outcome',
      2026,
      'Q2',
      null,
      true,
      'LYDO',
      date '2026-06-20',
      1468006::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-103',
      'BAC Invitation to Bid - Youth Hub Equipment',
      'bac_document',
      2026,
      'Q2',
      null,
      true,
      'MUNICIPAL_BAC',
      date '2026-06-08',
      811008::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-104',
      'Executive Order - Youth Volunteer Mobilization',
      'executive_order',
      2026,
      'Q2',
      null,
      true,
      'MAYOR_OFFICE',
      date '2026-05-28',
      503808::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-105',
      'LYDC Resolution on Career Readiness Hubs',
      'resolution',
      2026,
      'Q2',
      null,
      true,
      'LYDC',
      date '2026-06-12',
      752640::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-106',
      'Ordinance on Barangay Youth Safety Protocol',
      'ordinance',
      2026,
      'Q2',
      'San Jose',
      false,
      'SANGGUNIANG_BAYAN',
      date '2026-06-18',
      992256::bigint,
      '/disclosure-registry-test.pdf'
    )
  ) as v(
    doc_code,
    title,
    document_type,
    fiscal_year,
    quarter,
    barangay_name,
    applies_to_all_barangays,
    office_code,
    published_date,
    file_size_bytes,
    public_url
  )
)
insert into public.disclosure_documents (
  doc_code,
  title,
  document_type,
  fiscal_year,
  quarter,
  barangay_id,
  applies_to_all_barangays,
  office_id,
  published_date,
  file_size_bytes,
  file_mime_type,
  public_url,
  source_post_url
)
select
  d.doc_code,
  d.title,
  d.document_type::public.disclosure_doc_type,
  d.fiscal_year,
  d.quarter::public.quarter_code,
  case when d.applies_to_all_barangays then null else b.id end,
  d.applies_to_all_barangays,
  o.id,
  d.published_date,
  d.file_size_bytes,
  'application/pdf',
  d.public_url,
  'https://www.facebook.com/sanmateolydo/'
from docs d
left join public.barangays b on b.name = d.barangay_name
left join public.offices o on o.code = d.office_code
on conflict (doc_code) do update set
  title = excluded.title,
  document_type = excluded.document_type,
  fiscal_year = excluded.fiscal_year,
  quarter = excluded.quarter,
  barangay_id = excluded.barangay_id,
  applies_to_all_barangays = excluded.applies_to_all_barangays,
  office_id = excluded.office_id,
  published_date = excluded.published_date,
  file_size_bytes = excluded.file_size_bytes,
  file_mime_type = excluded.file_mime_type,
  public_url = excluded.public_url,
  source_post_url = excluded.source_post_url,
  updated_at = now();

-- Service advisories
insert into public.service_advisories (
  id,
  office_id,
  title,
  status,
  message,
  created_at,
  updated_at
)
select
  v.id::uuid,
  o.id,
  v.title,
  v.status::public.service_status,
  v.message,
  v.updated_at::timestamptz,
  v.updated_at::timestamptz
from (
  values
    (
      '00000000-0000-0000-0000-000000000911',
      'LYDO',
      'Data Validation Window',
      'maintenance',
      'Dashboard aggregates may refresh slowly while compliance data is validated.',
      '2026-06-21T19:30:00+08:00'
    ),
    (
      '00000000-0000-0000-0000-000000000912',
      'LYDO',
      'Public Reports Published',
      'operational',
      'Q2 transparency disclosures have been posted successfully.',
      '2026-06-22T08:20:00+08:00'
    ),
    (
      '00000000-0000-0000-0000-000000000913',
      'LYDO',
      'Reminder: Attach Source URLs',
      'notice',
      'Please include source links when encoding events and organizations.',
      '2026-06-22T09:10:00+08:00'
    )
) as v(id, office_code, title, status, message, updated_at)
left join public.offices o on o.code = v.office_code
on conflict (id) do update set
  office_id = excluded.office_id,
  title = excluded.title,
  status = excluded.status,
  message = excluded.message,
  updated_at = excluded.updated_at;

-- Ticket samples for KPI/testing
with ticket_rows as (
  select * from (values
    (
      'LYDO-TPL2-0001',
      'Information Request',
      'Request for SK budget breakdown',
      'Please provide the detailed SK budget utilization per activity for Q2 2026.',
      'citizen1@example.com',
      'resolved',
      2,
      '2026-06-10T09:00:00+08:00',
      '2026-06-11T15:20:00+08:00',
      '2026-06-11T15:20:00+08:00'
    ),
    (
      'LYDO-TPL2-0002',
      'Complaint / Grievance',
      'Delayed posting of barangay report',
      'The monthly compliance report for our barangay appears delayed.',
      'citizen2@example.com',
      'in_progress',
      3,
      '2026-06-12T14:00:00+08:00',
      '2026-06-13T10:00:00+08:00',
      null
    ),
    (
      'LYDO-TPL2-0003',
      'Suggestion',
      'Add downloadable CSV for board table',
      'A CSV export for the board page would improve accessibility.',
      'citizen3@example.com',
      'received',
      3,
      '2026-06-14T08:30:00+08:00',
      '2026-06-14T08:30:00+08:00',
      null
    ),
    (
      'LYDO-TPL2-0004',
      'Service Request',
      'Assistance with event registration',
      'Unable to complete event registration due to form validation issue.',
      'citizen4@example.com',
      'closed',
      2,
      '2026-06-15T11:15:00+08:00',
      '2026-06-16T09:05:00+08:00',
      '2026-06-16T09:05:00+08:00'
    )
  ) as v(reference_no, type_name, subject, message, requester_email, status, priority, created_at, updated_at, resolved_at)
)
insert into public.citizen_tickets (
  reference_no,
  type_id,
  subject,
  message,
  requester_email,
  status,
  priority,
  created_at,
  updated_at,
  resolved_at
)
select
  tr.reference_no,
  tt.id,
  tr.subject,
  tr.message,
  tr.requester_email::citext,
  tr.status::public.ticket_status,
  tr.priority,
  tr.created_at::timestamptz,
  tr.updated_at::timestamptz,
  tr.resolved_at::timestamptz
from ticket_rows tr
join public.ticket_types tt on tt.name = tr.type_name
on conflict (reference_no) do update set
  type_id = excluded.type_id,
  subject = excluded.subject,
  message = excluded.message,
  requester_email = excluded.requester_email,
  status = excluded.status,
  priority = excluded.priority,
  updated_at = excluded.updated_at,
  resolved_at = excluded.resolved_at;

-- Barangay youth metrics (FY 2026)
with source_data as (
  select * from (values
    ('Ampid I', 14, 940, 4, 'compliant'),
    ('Ampid II', 9, 610, 3, 'pending'),
    ('Banaba', 17, 1320, 6, 'compliant'),
    ('Dulong Bayan I', 8, 470, 2, 'pending'),
    ('Dulong Bayan II', 6, 340, 2, 'overdue'),
    ('Guinayang', 15, 1040, 5, 'compliant'),
    ('Guitnang Bayan I', 11, 760, 4, 'compliant'),
    ('Guitnang Bayan II', 10, 700, 3, 'pending'),
    ('Gulod Malaya', 12, 880, 4, 'compliant'),
    ('Malanday', 20, 1620, 7, 'compliant'),
    ('Maly', 8, 510, 3, 'pending'),
    ('Pintong Bocaue', 5, 300, 2, 'overdue'),
    ('San Jose', 14, 820, 5, 'compliant'),
    ('San Rafael', 10, 620, 3, 'compliant'),
    ('Santa Ana', 17, 1180, 5, 'compliant'),
    ('Santo Nino', 9, 560, 3, 'compliant')
  ) as v(name, activities, participants, organizations, compliance_status)
)
insert into public.barangay_youth_metrics (
  barangay_id,
  fiscal_year,
  activities,
  participants,
  organizations,
  compliance_status
)
select
  b.id,
  2026,
  s.activities,
  s.participants,
  s.organizations,
  s.compliance_status::public.barangay_compliance_status
from source_data s
join public.barangays b on b.name = s.name
on conflict (barangay_id, fiscal_year) do update set
  activities = excluded.activities,
  participants = excluded.participants,
  organizations = excluded.organizations,
  compliance_status = excluded.compliance_status,
  updated_at = now();

-- Financial rows for Apr-Jun 2026
with source_data as (
  select * from (values
    ('Ampid I', 500000::numeric, 385000::numeric),
    ('Ampid II', 450000::numeric, 320000::numeric),
    ('Banaba', 600000::numeric, 410000::numeric),
    ('Dulong Bayan I', 380000::numeric, 290000::numeric),
    ('Dulong Bayan II', 350000::numeric, 180000::numeric),
    ('Guinayang', 520000::numeric, 460000::numeric),
    ('Guitnang Bayan I', 480000::numeric, 350000::numeric),
    ('Guitnang Bayan II', 460000::numeric, 390000::numeric),
    ('Gulod Malaya', 510000::numeric, 420000::numeric),
    ('Malanday', 650000::numeric, 520000::numeric),
    ('Maly', 400000::numeric, 280000::numeric),
    ('Pintong Bocaue', 320000::numeric, 210000::numeric),
    ('San Jose', 490000::numeric, 380000::numeric),
    ('San Rafael', 440000::numeric, 310000::numeric),
    ('Santa Ana', 550000::numeric, 470000::numeric),
    ('Santo Nino', 420000::numeric, 340000::numeric)
  ) as v(name, sk_budget, utilized_budget)
),
ratios as (
  select * from (values
    (4, 0.74::numeric, 0.62::numeric),
    (5, 0.86::numeric, 0.74::numeric),
    (6, 0.94::numeric, 0.83::numeric)
  ) as r(month_no, allocated_ratio, utilized_ratio)
)
insert into public.barangay_financials (
  barangay_id,
  fiscal_year,
  month_no,
  allocated_amount,
  utilized_amount,
  sk_budget
)
select
  b.id,
  2026,
  r.month_no,
  round(s.sk_budget * r.allocated_ratio, 2),
  round(s.utilized_budget * r.utilized_ratio, 2),
  s.sk_budget
from source_data s
join public.barangays b on b.name = s.name
cross join ratios r
on conflict (barangay_id, fiscal_year, month_no) do update set
  allocated_amount = excluded.allocated_amount,
  utilized_amount = excluded.utilized_amount,
  sk_budget = excluded.sk_budget,
  updated_at = now();

-- Board rows for Q1 2026
with board_rows as (
  select * from (values
    ('Ampid I', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Ampid II', 'ok', 'ok', 'ok', 'partial', 'partial', 'Partially Compliant (Q1 2026)'),
    ('Banaba', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Dulong Bayan I', 'ok', 'ok', 'partial', 'ok', 'ok', 'Partially Compliant (Q1 2026)'),
    ('Dulong Bayan II', 'partial', 'partial', 'issue', 'issue', 'issue', 'Partially Compliant (Q1 2026)'),
    ('Guinayang', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Guitnang Bayan I', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Guitnang Bayan II', 'ok', 'ok', 'ok', 'partial', 'issue', 'Partially Compliant (Q1 2026)'),
    ('Gulod Malaya', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Malanday', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Maly', 'ok', 'ok', 'partial', 'partial', 'partial', 'Partially Compliant (Q1 2026)'),
    ('Pintong Bocaue', 'partial', 'issue', 'issue', 'issue', 'issue', 'Partially Compliant (Q1 2026)'),
    ('San Jose', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('San Rafael', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Santa Ana', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (Q1 2026)'),
    ('Santo Nino', 'ok', 'ok', 'ok', 'ok', 'partial', 'Partially Compliant (Q1 2026)')
  ) as v(barangay_name, cbydp, abyip, annual_budget, rcb, mil, remarks)
)
insert into public.compliance_board_status (
  barangay_id,
  fiscal_year,
  quarter,
  cbydp,
  abyip,
  annual_budget,
  rcb,
  mil,
  remarks
)
select
  b.id,
  2026,
  'Q1'::public.quarter_code,
  br.cbydp::public.doc_state,
  br.abyip::public.doc_state,
  br.annual_budget::public.doc_state,
  br.rcb::public.doc_state,
  br.mil::public.doc_state,
  br.remarks
from board_rows br
join public.barangays b on b.name = br.barangay_name
on conflict (barangay_id, fiscal_year, quarter) do update set
  cbydp = excluded.cbydp,
  abyip = excluded.abyip,
  annual_budget = excluded.annual_budget,
  rcb = excluded.rcb,
  mil = excluded.mil,
  remarks = excluded.remarks,
  updated_at = now();

-- Monthly compliance rows for Apr-Jun 2026
with ordered_barangays as (
  select id, row_number() over (order by name) as b_index
  from public.barangays
),
month_series as (
  select generate_series(4, 6) as month_no
),
generated as (
  select
    ob.id as barangay_id,
    2026 as fiscal_year,
    ms.month_no,
    make_date(2026, ms.month_no, 5) as due_date,
    (case
      when mod(ob.b_index * 17 + ms.month_no * 9, 11) = 0 then 'missing'
      when mod(ob.b_index * 17 + ms.month_no * 9, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as mfr_status,
    (case
      when mod(ob.b_index * 17 + ms.month_no * 9 + 5, 11) = 0 then 'missing'
      when mod(ob.b_index * 17 + ms.month_no * 9 + 5, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as mil_status,
    (case
      when mod(ob.b_index * 17 + ms.month_no * 9 + 10, 11) = 0 then 'missing'
      when mod(ob.b_index * 17 + ms.month_no * 9 + 10, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as rcb_status,
    (case
      when mod(ob.b_index * 17 + ms.month_no * 9 + 15, 11) = 0 then 'missing'
      when mod(ob.b_index * 17 + ms.month_no * 9 + 15, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as accomplishment_status,
    (case
      when mod(ob.b_index * 17 + ms.month_no * 9 + 20, 11) = 0 then 'missing'
      when mod(ob.b_index * 17 + ms.month_no * 9 + 20, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as census_status
  from ordered_barangays ob
  cross join month_series ms
)
insert into public.monthly_compliance (
  barangay_id,
  fiscal_year,
  month_no,
  due_date,
  mfr_status,
  mil_status,
  rcb_status,
  accomplishment_status,
  census_status,
  completion_percent,
  report_document_id
)
select
  g.barangay_id,
  g.fiscal_year,
  g.month_no,
  g.due_date,
  g.mfr_status,
  g.mil_status,
  g.rcb_status,
  g.accomplishment_status,
  g.census_status,
  (
    (
      (case when g.mfr_status <> 'missing' then 1 else 0 end) +
      (case when g.mil_status <> 'missing' then 1 else 0 end) +
      (case when g.rcb_status <> 'missing' then 1 else 0 end) +
      (case when g.accomplishment_status <> 'missing' then 1 else 0 end) +
      (case when g.census_status <> 'missing' then 1 else 0 end)
    ) * 20
  )::smallint as completion_percent,
  (select id from public.disclosure_documents where doc_code = 'doc-102' limit 1) as report_document_id
from generated g
on conflict (barangay_id, fiscal_year, month_no) do update set
  due_date = excluded.due_date,
  mfr_status = excluded.mfr_status,
  mil_status = excluded.mil_status,
  rcb_status = excluded.rcb_status,
  accomplishment_status = excluded.accomplishment_status,
  census_status = excluded.census_status,
  completion_percent = excluded.completion_percent,
  report_document_id = excluded.report_document_id,
  updated_at = now();

commit;
