
export type ProgramStatus = 'published' | 'draft' | 'archived';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type OrganizationStatus = 'active' | 'inactive';
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';
export type DisclosureDocType = 'cbydp' | 'abyip' | 'annual_budget' | 'rcb' | 'mil';
export type QuarterCode = 'q1' | 'q2' | 'q3' | 'q4';

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
