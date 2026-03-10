
export type ProgramStatus = 'published' | 'draft' | 'archived';
export type EventStatus = 'draft' | 'upcoming' | 'past' | 'cancelled';
export type OrganizationStatus = 'active' | 'partner' | 'inactive';
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';
export type DocState = 'ok' | 'partial' | 'issue';
export type SubmissionState = 'submitted' | 'late' | 'missing';
export type BarangayComplianceStatus = 'compliant' | 'pending' | 'overdue';
export type DisclosureDocType =
  | 'ordinance'
  | 'resolution'
  | 'executive_order'
  | 'bac_document'
  | 'financial_statement'
  | 'program_outcome'
  | 'other';
export type QuarterCode = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Barangay {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  sk_chairperson?: string;
  youth_population: number;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  sector: string;
  description: string;
  start_date?: string;
  end_date?: string;
  schedule_text?: string;
  location: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  status: ProgramStatus;
  barangay_id?: string;
  source_post_url?: string;
  created_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  sector: string;
  description: string;
  event_date?: string;
  time_text?: string;
  location: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  status: EventStatus;
  barangay_id?: string;
  source_post_url?: string;
  capacity?: number;
  created_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  type: string;
  focus: string;
  source_tag?: string;
  status: OrganizationStatus;
  barangay_id?: string;
  source_post_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DisclosureDocument {
  id: string;
  doc_code: string;
  title: string;
  document_type: DisclosureDocType;
  document_type_other?: string;
  fiscal_year: number;
  quarter: QuarterCode;
  barangay_id?: string;
  applies_to_all_barangays: boolean;
  office_id?: string;
  published_date: string;
  file_size_bytes?: number;
  file_mime_type?: string;
  storage_path?: string;
  public_url?: string;
  source_post_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  contact_number?: string;
  municipality: string;
  barangay_id?: string;
  bio?: string;
  notifications: boolean;
  show_email_public: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceBoardStatusRow {
  id: string;
  barangay_id: string;
  fiscal_year: number;
  quarter: QuarterCode;
  cbydp: DocState;
  abyip: DocState;
  annual_budget: DocState;
  rcb: DocState;
  mil: DocState;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyComplianceRow {
  id: string;
  barangay_id: string;
  fiscal_year: number;
  month_no: number;
  due_date: string;
  mfr_status: SubmissionState;
  mil_status: SubmissionState;
  rcb_status: SubmissionState;
  accomplishment_status: SubmissionState;
  census_status: SubmissionState;
  completion_percent: number;
  report_document_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BarangayFinancialRow {
  id: string;
  barangay_id: string;
  fiscal_year: number;
  month_no: number;
  allocated_amount: number;
  utilized_amount: number;
  sk_budget: number;
  created_at: string;
  updated_at: string;
}

export interface BarangayYouthMetricRow {
  id: string;
  barangay_id: string;
  fiscal_year: number;
  activities: number;
  participants: number;
  organizations: number;
  compliance_status: BarangayComplianceStatus;
  created_at: string;
  updated_at: string;
}
