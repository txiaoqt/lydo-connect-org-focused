begin;

-- Removes rows inserted by 09_template_seed_data.sql.
-- This does NOT drop tables/types/functions. It only deletes template-seeded data.

-- 1) Remove monthly compliance template rows (Jan-Mar 2026, all seeded barangays)
delete from public.monthly_compliance mc
using public.barangays b
where mc.barangay_id = b.id
  and mc.fiscal_year = 2026
  and mc.month_no between 1 and 3
  and b.name in (
    'Ampid I',
    'Ampid II',
    'Banaba',
    'Dulong Bayan I',
    'Dulong Bayan II',
    'Guinayang',
    'Guitnang Bayan I',
    'Guitnang Bayan II',
    'Gulod Malaya',
    'Malanday',
    'Maly',
    'Pintong Bocaue',
    'San Jose',
    'San Rafael',
    'Santa Ana',
    'Santo Nino'
  );

-- 2) Remove SK full disclosure board template rows (Q4 2025)
delete from public.compliance_board_status c
using public.barangays b
where c.barangay_id = b.id
  and c.fiscal_year = 2025
  and c.quarter = 'Q4'
  and b.name in (
    'Ampid I',
    'Ampid II',
    'Banaba',
    'Dulong Bayan I',
    'Dulong Bayan II',
    'Guinayang',
    'Guitnang Bayan I',
    'Guitnang Bayan II',
    'Gulod Malaya',
    'Malanday',
    'Maly',
    'Pintong Bocaue',
    'San Jose',
    'San Rafael',
    'Santa Ana',
    'Santo Nino'
  );

-- 3) Remove barangay youth metric template rows (FY 2026)
delete from public.barangay_youth_metrics m
using public.barangays b
where m.barangay_id = b.id
  and m.fiscal_year = 2026
  and b.name in (
    'Ampid I',
    'Ampid II',
    'Banaba',
    'Dulong Bayan I',
    'Dulong Bayan II',
    'Guinayang',
    'Guitnang Bayan I',
    'Guitnang Bayan II',
    'Gulod Malaya',
    'Malanday',
    'Maly',
    'Pintong Bocaue',
    'San Jose',
    'San Rafael',
    'Santa Ana',
    'Santo Nino'
  );

-- 4) Remove barangay financial template rows (FY 2026, months 1-3)
delete from public.barangay_financials f
using public.barangays b
where f.barangay_id = b.id
  and f.fiscal_year = 2026
  and f.month_no between 1 and 3
  and b.name in (
    'Ampid I',
    'Ampid II',
    'Banaba',
    'Dulong Bayan I',
    'Dulong Bayan II',
    'Guinayang',
    'Guitnang Bayan I',
    'Guitnang Bayan II',
    'Gulod Malaya',
    'Malanday',
    'Maly',
    'Pintong Bocaue',
    'San Jose',
    'San Rafael',
    'Santa Ana',
    'Santo Nino'
  );

-- 5) Remove template service advisories
delete from public.service_advisories
where id in (
  '00000000-0000-0000-0000-000000000901'::uuid,
  '00000000-0000-0000-0000-000000000902'::uuid,
  '00000000-0000-0000-0000-000000000903'::uuid
);

-- 6) Remove template disclosure documents
delete from public.disclosure_documents
where doc_code in (
  'doc-001',
  'doc-002',
  'doc-003',
  'doc-004',
  'doc-005',
  'doc-006'
);

-- 7) Remove template organizations
delete from public.organizations
where slug in (
  'ydac-arts-culture',
  'ydac-agri-envi',
  'sk-san-mateo-network',
  'smmc-seb',
  'lydo-youth-org-assembly'
);

-- 8) Remove template events
delete from public.events
where slug in (
  'project-ka-art-ihan-2025',
  'project-sibol-2025',
  'project-tuklas-2025',
  'smmc-seb-partnership-2025',
  'sk-san-mateo-activity-2025',
  'project-bigkis-kabataan-2025'
);

-- 9) Remove template programs
delete from public.programs
where slug in (
  'hirayang-kabataan-yep',
  'simula-youth-leadership',
  'project-ready-to-serve-2025',
  'project-ka-art-ihan-program',
  'project-sibol-program',
  'project-tuklas-program',
  'project-bigkis-kabataan-program',
  'sk-capacity-compliance-sessions-2025'
);

commit;
