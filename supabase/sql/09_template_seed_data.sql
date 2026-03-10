begin;

-- Seed youth programs currently shown in the portal.
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
    'hirayang-kabataan-yep',
    'Hirayang Kabataan Youth Empowerment Program',
    'LYDO',
    'Core empowerment program for civic participation, youth engagement, and leadership development.',
    null,
    null,
    '2025-2026 Cycle',
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'simula-youth-leadership',
    'Simula Youth Leadership Program',
    'LYDO',
    'Leadership and governance pathway for emerging youth leaders in barangays and organizations.',
    null,
    null,
    '2025-2026 Cycle',
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-ready-to-serve-2025',
    'Project Ready to Serve',
    'LYDO',
    'Volunteer-oriented youth initiative highlighted by LYDO San Mateo as part of active community engagement efforts.',
    date '2025-02-19',
    date '2025-02-19',
    null,
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-ka-art-ihan-program',
    'Project Ka-ART-ihan',
    'YDAC',
    'Hataw Na beginner dance workshop under the Youth Development Advocate Circle for Arts and Culture.',
    date '2025-07-12',
    date '2025-07-13',
    null,
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-sibol-program',
    'Project Sibol',
    'YDAC',
    'Tinig ng Kabataang Bayan para sa Kalikasan, a two-day environmental youth program.',
    null,
    null,
    'July 2025',
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-tuklas-program',
    'Project Tuklas',
    'LYDO',
    'Youth-led leadership training and workshop designed to develop local youth leaders.',
    date '2025-08-16',
    date '2025-08-17',
    null,
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-bigkis-kabataan-program',
    'Project Bigkis Kabataan',
    'LYDO',
    'Youth leaders and organizations assembly focused on alignment, collaboration, and strengthening youth participation.',
    date '2025-10-12',
    date '2025-10-12',
    null,
    'San Mateo, Rizal',
    'published',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'sk-capacity-compliance-sessions-2025',
    'SK Capacity and Compliance Sessions',
    'SK',
    'Barangay SK-focused sessions and monitoring activities connected to LYDO accountability and governance support.',
    null,
    null,
    'September 2025',
    'San Mateo, Rizal',
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

-- Seed events currently shown in the portal.
insert into public.events (
  slug,
  title,
  sector,
  description,
  event_date,
  time_text,
  location,
  status,
  source_post_url,
  published_at
)
values
  (
    'project-ka-art-ihan-2025',
    'Project Ka-ART-ihan: Hataw Na Beginner''s Dance Workshop',
    'YDAC',
    'Youth arts and culture workshop for beginner dancers.',
    date '2025-07-12',
    'Workshop Sessions',
    'San Mateo, Rizal',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-sibol-2025',
    'Project Sibol: Tinig ng Kabataang Bayan para sa Kalikasan',
    'YDAC',
    'Two-day youth environmental learning and engagement event.',
    date '2025-07-01',
    'Two-day Activity',
    'San Mateo, Rizal',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-tuklas-2025',
    'Project Tuklas: Youth-led Leadership Training and Workshop',
    'LYDO',
    'Leadership development training for local youth participants.',
    date '2025-08-16',
    'Training Program',
    'San Mateo, Rizal',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'smmc-seb-partnership-2025',
    'SMMC Student Executive Board Partnership Event',
    'LYDO',
    'Campus youth partnership activity recognized by LYDO San Mateo.',
    date '2025-08-20',
    'Youth Session',
    'San Mateo Municipal College',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'sk-san-mateo-activity-2025',
    'Sangguniang Kabataan ng San Mateo Activity Highlight',
    'SK',
    'Municipal-level youth governance activity with barangay SK participation.',
    date '2025-09-01',
    'Community Event',
    'San Mateo, Rizal',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  ),
  (
    'project-bigkis-kabataan-2025',
    'Project Bigkis Kabataan: Youth Leaders and Organizations Assembly',
    'LYDO',
    'Assembly focused on youth organizations alignment and collaboration.',
    date '2025-10-12',
    'Assembly Program',
    'San Mateo, Rizal',
    'past',
    'https://www.facebook.com/sanmateolydo/',
    now()
  )
on conflict (slug) do update set
  title = excluded.title,
  sector = excluded.sector,
  description = excluded.description,
  event_date = excluded.event_date,
  time_text = excluded.time_text,
  location = excluded.location,
  status = excluded.status,
  source_post_url = excluded.source_post_url,
  published_at = excluded.published_at,
  updated_at = now();

-- Seed organizations currently shown in the portal.
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
    'ydac-arts-culture',
    'Youth Development Advocate Circle (YDAC) for Arts and Culture',
    'Advocacy Group',
    'Arts, culture, and youth creative engagement',
    'San Mateo Gov announcement, July 13, 2025',
    'active',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'ydac-agri-envi',
    'Youth Development Advocate Circle (YDAC) for Agriculture and Environment',
    'Advocacy Group',
    'Environment and agriculture initiatives for youth',
    'San Mateo Gov announcement, July 18, 2025',
    'active',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'sk-san-mateo-network',
    'Sangguniang Kabataan ng San Mateo (Barangay SK network)',
    'Youth Governance',
    'Barangay youth governance and leadership',
    'San Mateo Gov announcement, September 1, 2025',
    'active',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'smmc-seb',
    'SMMC Student Executive Board (SEB)',
    'Campus Youth Partner',
    'Campus-led youth representation and programs',
    'San Mateo Gov announcement, August 20, 2025',
    'partner',
    'https://www.facebook.com/sanmateolydo/'
  ),
  (
    'lydo-youth-org-assembly',
    'San Mateo LYDO Youth Organizations Assembly Network',
    'Multi-organization Network',
    'Municipal youth organizations coordination and dialogue',
    'Project Bigkis Kabataan, October 12, 2025',
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

-- Seed disclosure registry documents currently shown in the portal.
with docs as (
  select * from (values
    (
      'doc-001',
      'SK Budget Utilization and Disbursement Summary',
      'financial_statement',
      2026,
      'Q1',
      'Malanday',
      false,
      'LYDO',
      date '2026-03-01',
      1572864::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-002',
      'Hirayang Kabataan Program Outcome Report',
      'program_outcome',
      2026,
      'Q1',
      null,
      true,
      'LYDO',
      date '2026-03-03',
      2202009::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-003',
      'Quarterly Procurement Posting',
      'bac_document',
      2026,
      'Q1',
      null,
      true,
      'MUNICIPAL_BAC',
      date '2026-02-22',
      552960::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-004',
      'Executive Order on Youth Program Monitoring',
      'executive_order',
      2025,
      'Q4',
      null,
      true,
      'MAYOR_OFFICE',
      date '2025-11-10',
      501760::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-005',
      'Resolution Adopting Quarterly LYDC Monitoring Matrix',
      'resolution',
      2025,
      'Q4',
      null,
      true,
      'LYDC',
      date '2025-12-02',
      829440::bigint,
      '/disclosure-registry-test.pdf'
    ),
    (
      'doc-006',
      'Barangay Youth Activity Appropriations Ordinance',
      'ordinance',
      2025,
      'Q3',
      'Santa Ana',
      false,
      'SANGGUNIANG_BAYAN',
      date '2025-09-20',
      962560::bigint,
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

-- Seed service advisories currently shown in the portal.
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
      '00000000-0000-0000-0000-000000000901',
      'LYDO',
      'Scheduled Maintenance Window',
      'maintenance',
      'Transparency uploads and issue tracking may be temporarily unavailable for 30 minutes.',
      '2026-03-06T20:00:00+08:00'
    ),
    (
      '00000000-0000-0000-0000-000000000902',
      'LYDO',
      'Daily Data Sync Complete',
      'operational',
      'Event registrations and disclosure registry data are fully synchronized.',
      '2026-03-07T08:10:00+08:00'
    ),
    (
      '00000000-0000-0000-0000-000000000903',
      'LYDO',
      'Facebook-to-Portal Sync Reminder',
      'notice',
      'Please link source Facebook post URLs for newly encoded events and programs.',
      '2026-03-07T09:15:00+08:00'
    )
) as v(id, office_code, title, status, message, updated_at)
left join public.offices o on o.code = v.office_code
on conflict (id) do update set
  office_id = excluded.office_id,
  title = excluded.title,
  status = excluded.status,
  message = excluded.message,
  updated_at = excluded.updated_at;

-- Seed barangay metrics and financial rows currently shown in the portal.
with source_data as (
  select * from (values
    ('Ampid I', 500000::numeric, 385000::numeric, 12, 890, 4, 'compliant'),
    ('Ampid II', 450000::numeric, 320000::numeric, 8, 560, 3, 'compliant'),
    ('Banaba', 600000::numeric, 410000::numeric, 15, 1200, 6, 'compliant'),
    ('Dulong Bayan I', 380000::numeric, 290000::numeric, 6, 420, 2, 'pending'),
    ('Dulong Bayan II', 350000::numeric, 180000::numeric, 5, 310, 2, 'overdue'),
    ('Guinayang', 520000::numeric, 460000::numeric, 14, 980, 5, 'compliant'),
    ('Guitnang Bayan I', 480000::numeric, 350000::numeric, 10, 720, 4, 'compliant'),
    ('Guitnang Bayan II', 460000::numeric, 390000::numeric, 9, 650, 3, 'pending'),
    ('Gulod Malaya', 510000::numeric, 420000::numeric, 11, 830, 4, 'compliant'),
    ('Malanday', 650000::numeric, 520000::numeric, 18, 1500, 7, 'compliant'),
    ('Maly', 400000::numeric, 280000::numeric, 7, 480, 3, 'pending'),
    ('Pintong Bocaue', 320000::numeric, 210000::numeric, 4, 280, 2, 'overdue'),
    ('San Jose', 490000::numeric, 380000::numeric, 13, 760, 5, 'compliant'),
    ('San Rafael', 440000::numeric, 310000::numeric, 9, 590, 3, 'compliant'),
    ('Santa Ana', 550000::numeric, 470000::numeric, 16, 1100, 5, 'compliant'),
    ('Santo Nino', 420000::numeric, 340000::numeric, 8, 520, 3, 'compliant')
  ) as v(name, sk_budget, utilized_budget, activities, participants, organizations, compliance_status)
),
ratios as (
  select * from (values
    (1, 0.772727::numeric, 0.696629::numeric),
    (2, 0.836364::numeric, 0.876404::numeric),
    (3, 1.000000::numeric, 1.000000::numeric)
  ) as r(month_no, allocated_ratio, utilized_ratio)
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
    (1, 0.772727::numeric, 0.696629::numeric),
    (2, 0.836364::numeric, 0.876404::numeric),
    (3, 1.000000::numeric, 1.000000::numeric)
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

-- Seed SK full disclosure board rows currently shown in the portal.
with board_rows as (
  select * from (values
    ('Ampid I', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (1/20/2026)'),
    ('Ampid II', 'ok', 'ok', 'ok', 'issue', 'partial', 'Partially Compliant'),
    ('Banaba', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Dulong Bayan I', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Dulong Bayan II', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Guinayang', 'ok', 'ok', 'ok', 'ok', 'partial', 'Partially Compliant'),
    ('Gulod Malaya', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Guitnang Bayan I', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (1/20/2026)'),
    ('Guitnang Bayan II', 'partial', 'ok', 'ok', 'issue', 'issue', 'Partially Compliant'),
    ('Malanday', 'ok', 'ok', 'ok', 'issue', 'issue', 'Partially Compliant'),
    ('Maly', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Pintong Bocaue', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant (1/19/2026)'),
    ('San Jose', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('San Rafael', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Santa Ana', 'ok', 'ok', 'ok', 'ok', 'ok', 'Fully Compliant'),
    ('Santo Nino', 'ok', 'ok', 'ok', 'ok', 'partial', 'Partially Compliant')
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
  2025,
  'Q4'::public.quarter_code,
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

-- Seed monthly compliance rows for Jan-March 2026 using the same deterministic pattern
-- that previously powered the local fallback data.
with ordered_barangays as (
  select id, row_number() over (order by name) as b_index
  from public.barangays
),
month_series as (
  select generate_series(1, 3) as month_no
),
generated as (
  select
    ob.id as barangay_id,
    2026 as fiscal_year,
    ms.month_no,
    make_date(2026, ms.month_no, 5) as due_date,
    (case
      when mod(ob.b_index * 13 + ms.month_no * 7, 11) = 0 then 'missing'
      when mod(ob.b_index * 13 + ms.month_no * 7, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as mfr_status,
    (case
      when mod(ob.b_index * 13 + ms.month_no * 7 + 5, 11) = 0 then 'missing'
      when mod(ob.b_index * 13 + ms.month_no * 7 + 5, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as mil_status,
    (case
      when mod(ob.b_index * 13 + ms.month_no * 7 + 10, 11) = 0 then 'missing'
      when mod(ob.b_index * 13 + ms.month_no * 7 + 10, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as rcb_status,
    (case
      when mod(ob.b_index * 13 + ms.month_no * 7 + 15, 11) = 0 then 'missing'
      when mod(ob.b_index * 13 + ms.month_no * 7 + 15, 7) = 0 then 'late'
      else 'submitted'
    end)::public.submission_state as accomplishment_status,
    (case
      when mod(ob.b_index * 13 + ms.month_no * 7 + 20, 11) = 0 then 'missing'
      when mod(ob.b_index * 13 + ms.month_no * 7 + 20, 7) = 0 then 'late'
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
  (select id from public.disclosure_documents where doc_code = 'doc-002' limit 1) as report_document_id
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
