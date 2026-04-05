export type YouthEvent = {
  id: string;
  title: string;
  sector: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationLatitude?: number;
  locationLongitude?: number;
  status: "past" | "upcoming";
  sourcePostUrl?: string;
  registrationFormUrl?: string;
  registrationSheetUrl?: string;
  externalAttendanceEnabled?: boolean;
  capacity?: number;
  recordKind?: "event" | "program";
};

export type YouthProgram = {
  id: string;
  title: string;
  sector: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  locationLatitude?: number;
  locationLongitude?: number;
  type: "program" | "event" | "organization";
  sourcePostUrl?: string;
};

export type YouthOrganization = {
  id: string;
  name: string;
  type: string;
  focus: string;
  sourceTag: string;
  status: "active" | "partner";
  sourcePostUrl?: string;
};

export const youthEvents: YouthEvent[] = [
  {
    id: "project-ka-art-ihan-2025",
    title: "Project Ka-ART-ihan: Hataw Na Beginner's Dance Workshop",
    sector: "YDAC",
    description: "Youth arts and culture workshop for beginner dancers.",
    date: "July 12-13, 2025",
    time: "Workshop Sessions",
    location: "Metro Manila",
    status: "past",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-sibol-2025",
    title: "Project Sibol: Tinig ng Kabataang Bayan para sa Kalikasan",
    sector: "YDAC",
    description: "Two-day youth environmental learning and engagement event.",
    date: "July 2025",
    time: "Two-day Activity",
    location: "Metro Manila",
    status: "past",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-tuklas-2025",
    title: "Project Tuklas: Youth-led Leadership Training and Workshop",
    sector: "LYDO",
    description: "Leadership development training for local youth participants.",
    date: "August 16-17, 2025",
    time: "Training Program",
    location: "Metro Manila",
    status: "past",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "metro-manila-seb-partnership-2025",
    title: "Metro Manila Student Executive Board Partnership Event",
    sector: "LYDO",
    description: "Campus youth partnership activity recognized by Metro Manila LYDO.",
    date: "August 20, 2025",
    time: "Youth Session",
    location: "Metro Manila Municipal College",
    status: "past",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "metro-manila-sk-activity-2025",
    title: "Sangguniang Kabataan ng Metro Manila Activity Highlight",
    sector: "SK",
    description: "Municipal-level youth governance activity with barangay SK participation.",
    date: "September 1, 2025",
    time: "Community Event",
    location: "Metro Manila",
    status: "past",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-bigkis-kabataan-2025",
    title: "Project Bigkis Kabataan: Youth Leaders and Organizations Assembly",
    sector: "LYDO",
    description: "Assembly focused on youth organizations alignment and collaboration.",
    date: "October 12, 2025",
    time: "Assembly Program",
    location: "Metro Manila",
    status: "past",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
];

export const youthPrograms: YouthProgram[] = [
  {
    id: "hirayang-kabataan-yep",
    title: "Hirayang Kabataan Youth Empowerment Program",
    sector: "LYDO",
    description: "Core empowerment program for civic participation, youth engagement, and leadership development.",
    date: "2025-2026 Cycle",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "simula-youth-leadership",
    title: "Simula Youth Leadership Program",
    sector: "LYDO",
    description: "Leadership and governance pathway for emerging youth leaders in barangays and organizations.",
    date: "2025-2026 Cycle",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-ready-to-serve-2025",
    title: "Project Ready to Serve",
    sector: "LYDO",
    description: "Volunteer-oriented youth initiative highlighted by Metro Manila LYDO as part of active community engagement efforts.",
    date: "February 19, 2025",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-ka-art-ihan-program",
    title: "Project Ka-ART-ihan",
    sector: "YDAC",
    description: "Hataw Na beginner dance workshop under the Youth Development Advocate Circle for Arts and Culture.",
    date: "July 12-13, 2025",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-sibol-program",
    title: "Project Sibol",
    sector: "YDAC",
    description: "Tinig ng Kabataang Bayan para sa Kalikasan, a two-day environmental youth program.",
    date: "July 2025",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-tuklas-program",
    title: "Project Tuklas",
    sector: "LYDO",
    description: "Youth-led leadership training and workshop designed to develop local youth leaders.",
    date: "August 16-17, 2025",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "project-bigkis-kabataan-program",
    title: "Project Bigkis Kabataan",
    sector: "LYDO",
    description: "Youth leaders and organizations assembly focused on alignment, collaboration, and strengthening youth participation.",
    date: "October 12, 2025",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "sk-capacity-compliance-sessions-2025",
    title: "SK Capacity and Compliance Sessions",
    sector: "SK",
    description: "Barangay SK-focused sessions and monitoring activities connected to LYDO accountability and governance support.",
    date: "September 2025",
    location: "Metro Manila",
    type: "program",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
];

export const youthOrganizations: YouthOrganization[] = [
  {
    id: "ydac-arts-culture",
    name: "Youth Development Advocate Circle (YDAC) for Arts and Culture",
    type: "Advocacy Group",
    focus: "Arts, culture, and youth creative engagement",
    sourceTag: "Metro Manila Gov announcement, July 13, 2025",
    status: "active",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "ydac-agri-envi",
    name: "Youth Development Advocate Circle (YDAC) for Agriculture and Environment",
    type: "Advocacy Group",
    focus: "Environment and agriculture initiatives for youth",
    sourceTag: "Metro Manila Gov announcement, July 18, 2025",
    status: "active",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "metro-manila-sk-network",
    name: "Sangguniang Kabataan ng Metro Manila (Barangay SK network)",
    type: "Youth Governance",
    focus: "Barangay youth governance and leadership",
    sourceTag: "Metro Manila Gov announcement, September 1, 2025",
    status: "active",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "metro-manila-seb",
    name: "SMMC Student Executive Board (SEB)",
    type: "Campus Youth Partner",
    focus: "Campus-led youth representation and programs",
    sourceTag: "Metro Manila Gov announcement, August 20, 2025",
    status: "partner",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
  {
    id: "metro-manila-youth-org-assembly",
    name: "Metro Manila LYDO Youth Organizations Assembly Network",
    type: "Multi-organization Network",
    focus: "Municipal youth organizations coordination and dialogue",
    sourceTag: "Metro Manila Project Bigkis Kabataan, October 12, 2025",
    status: "active",
    sourcePostUrl: "https://www.facebook.com/metrolydo/",
  },
];

export const getEventById = (eventId: string) =>
  youthEvents.find((event) => event.id === eventId);
