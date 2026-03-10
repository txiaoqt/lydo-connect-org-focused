begin;

insert into public.roles (code, label, description) values
  ('admin','Administrator','Full platform administration'),
  ('staff','LYDO Staff','Municipal/LYDO operations and moderation'),
  ('sk','Barangay SK','Barangay-level governance updates and submissions'),
  ('youth','Youth User','Standard youth participant account')
on conflict (code) do update set label = excluded.label, description = excluded.description;

insert into public.ticket_types (name) values
  ('Information Request'),
  ('Complaint / Grievance'),
  ('Suggestion'),
  ('Service Request')
on conflict (name) do nothing;

insert into public.offices (name, code) values
  ('Local Youth Development Office', 'LYDO'),
  ('Local Youth Development Council', 'LYDC'),
  ('Municipal Bids and Awards Committee', 'MUNICIPAL_BAC'),
  ('Office of the Mayor', 'MAYOR_OFFICE'),
  ('Sangguniang Bayan', 'SANGGUNIANG_BAYAN')
on conflict (code) do update set name = excluded.name;

insert into public.barangays (name, latitude, longitude, sk_chairperson, youth_population) values
  ('Ampid I', 14.724000, 121.153000, 'Maria Santos', 2340),
  ('Ampid II', 14.720000, 121.146000, 'Juan Dela Cruz', 1890),
  ('Banaba', 14.697000, 121.147000, 'Ana Reyes', 3100),
  ('Dulong Bayan I', 14.687000, 121.125000, 'Pedro Garcia', 1560),
  ('Dulong Bayan II', 14.689000, 121.130000, 'Rosa Mendoza', 1420),
  ('Guinayang', 14.705000, 121.101000, 'Carlos Bautista', 2780),
  ('Guitnang Bayan I', 14.683000, 121.118000, 'Luz Villanueva', 2100),
  ('Guitnang Bayan II', 14.685000, 121.121000, 'Miguel Torres', 1950),
  ('Gulod Malaya', 14.708000, 121.134000, 'Elena Cruz', 2450),
  ('Malanday', 14.678000, 121.102000, 'Roberto Aquino', 3500),
  ('Maly', 14.676000, 121.110000, 'Diana Ramos', 1680),
  ('Pintong Bocaue', 14.671000, 121.119000, 'Fernando Lopez', 1350),
  ('San Jose', 14.690000, 121.139000, 'Grace Tan', 2200),
  ('San Rafael', 14.668000, 121.097000, 'Mark Rivera', 1890),
  ('Santa Ana', 14.667000, 121.107000, 'Linda Pascual', 2650),
  ('Santo Nino', 14.674000, 121.115000, 'Antonio Diaz', 1780)
on conflict (name) do update
set latitude = excluded.latitude,
    longitude = excluded.longitude,
    sk_chairperson = excluded.sk_chairperson,
    youth_population = excluded.youth_population,
    updated_at = now();

commit;
