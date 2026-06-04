import type { LydoSeedState, OrganizationProfile, SubmissionFile, TemplateRecord } from "./lydo-connect-data";
import { createTemplateLocalId, legacyRemovedTemplateNames, requiredDocumentTypes } from "./lydo-connect-data";
import { readAdminSession } from "./admin-auth";
import { supabase } from "./supabase";

const ORGANIZATION_DOCUMENTS_BUCKET = "organization-documents";
const TEMPLATE_FILES_BUCKET = "template-files";
const STORAGE_URI_PREFIX = "storage://";

type RequiredDocumentTypeRow = {
  id: string;
  name: string;
  description: string | null;
  template_url: string | null;
  template_description: string | null;
  sort_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
  updated_at?: string | null;
};

type OrganizationProfileRow = {
  id: string;
  user_id: string;
  organization_name: string;
  organization_email: string;
  contact_number: string;
  barangay: string;
  major_classification: string | null;
  sub_classification: string | null;
  advocacies: string[] | null;
  adviser_name: string | null;
  representative_name: string | null;
  address: string | null;
  facebook_page_url: string | null;
  profile_status: OrganizationProfile["profileStatus"];
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentSubmissionRow = {
  id: string;
  organization_id: string;
  submitted_by: string;
  status: LydoSeedState["documentSubmissions"][number]["status"];
  user_confirmed: boolean;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  overall_remarks: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentSubmissionFileRow = {
  id: string;
  submission_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  ocr_text: string | null;
  ocr_status: SubmissionFile["ocrStatus"];
  ocr_confidence: number | string | null;
  validation_status: SubmissionFile["validationStatus"];
  admin_status: SubmissionFile["adminStatus"];
  admin_remarks: string | null;
  uploaded_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  required_document_types?: {
    id?: string | null;
    name?: string | null;
  } | Array<{ id?: string | null; name?: string | null }> | null;
};

const localDocumentTypeByName = new Map(requiredDocumentTypes.map((documentType) => [documentType.name, documentType]));

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "-");

const buildStorageUri = (bucket: string, path: string) => `${STORAGE_URI_PREFIX}${bucket}/${path}`;

const parseStorageUri = (value: string) => {
  if (!value.startsWith(STORAGE_URI_PREFIX)) return null;
  const remainder = value.slice(STORAGE_URI_PREFIX.length);
  const separatorIndex = remainder.indexOf("/");
  if (separatorIndex < 0) return null;
  return {
    bucket: remainder.slice(0, separatorIndex),
    path: remainder.slice(separatorIndex + 1),
  };
};

const getFileNameFromReference = (value: string) => {
  const source = parseStorageUri(value)?.path ?? value;
  const segments = source.split("/");
  return segments[segments.length - 1] || "";
};

const mapOrganizationProfile = (row: OrganizationProfileRow): OrganizationProfile => ({
  id: row.id,
  userId: row.user_id,
  organizationName: row.organization_name,
  organizationEmail: row.organization_email,
  contactNumber: row.contact_number,
  barangay: row.barangay,
  majorClassification: (row.major_classification ?? "") as OrganizationProfile["majorClassification"],
  subClassification: (row.sub_classification ?? "") as OrganizationProfile["subClassification"],
  advocacies: (row.advocacies ?? []) as OrganizationProfile["advocacies"],
  adviserName: row.adviser_name ?? "",
  representativeName: row.representative_name ?? "",
  address: row.address ?? "",
  facebookPageUrl: row.facebook_page_url ?? "",
  profileStatus: row.profile_status,
  internalNotes: row.internal_notes ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTemplate = (row: RequiredDocumentTypeRow): TemplateRecord | null => {
  const localDocumentType = localDocumentTypeByName.get(row.name);
  const localId = localDocumentType?.id ?? createTemplateLocalId(row.name);

  return {
    id: localId,
    databaseId: row.id,
    name: row.name,
    description: row.description ?? localDocumentType?.description ?? "",
    templateUrl: row.template_url ?? localDocumentType?.templateUrl ?? "",
    sortOrder: row.sort_order ?? localDocumentType?.sortOrder ?? 0,
    isRequired: row.is_required ?? localDocumentType?.isRequired ?? true,
    isActive: row.is_active ?? localDocumentType?.isActive ?? true,
    templateDescription: row.template_description ?? `Template for ${row.name}.`,
    templateActive: row.is_active ?? true,
    templateFileName: row.template_url ? getFileNameFromReference(row.template_url) : "",
    templateFileUrl: row.template_url ?? "",
    templateFileType: "",
    templateUploadedAt: row.updated_at ?? "",
  };
};

const mapDocumentFile = (row: DocumentSubmissionFileRow): SubmissionFile | null => {
  const related = Array.isArray(row.required_document_types) ? row.required_document_types[0] : row.required_document_types;
  const documentName = related?.name ?? "";
  const localDocumentType = localDocumentTypeByName.get(documentName);
  const localDocumentTypeId = localDocumentType?.id ?? createTemplateLocalId(documentName);
  if (!localDocumentTypeId) return null;

  return {
    id: row.id,
    submissionId: row.submission_id,
    documentTypeId: localDocumentTypeId,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    ocrText: row.ocr_text ?? "",
    ocrStatus: row.ocr_status,
    ocrConfidence: Number(row.ocr_confidence ?? 0),
    validationStatus: row.validation_status,
    adminStatus: row.admin_status,
    adminRemarks: row.admin_remarks ?? "",
    uploadedAt: row.uploaded_at ?? "",
    reviewedAt: row.reviewed_at ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const fetchOrganizationProfile = async (userId: string) => {
  const { data, error } = await supabase!
    .from("organization_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as OrganizationProfileRow | null) ?? null;
};

const fetchLatestSubmission = async (organizationId: string) => {
  const { data, error } = await supabase!
    .from("document_submissions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return ((data as DocumentSubmissionRow[] | null) ?? [])[0] ?? null;
};

export const loadLydoConnectSupabaseState = async (): Promise<Partial<LydoSeedState> | null> => {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data: templateRows, error: templatesError } = await supabase!
    .from("required_document_types")
    .select("id,name,description,template_url,template_description,sort_order,is_required,is_active,updated_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (templatesError) throw new Error(templatesError.message);

  const mappedTemplates = ((templateRows as RequiredDocumentTypeRow[] | null) ?? [])
    .map(mapTemplate)
    .filter((template): template is TemplateRecord => Boolean(template) && !legacyRemovedTemplateNames.has(template.name));

  const organizationProfile = await fetchOrganizationProfile(session.user.id);
  if (!organizationProfile) {
    return mappedTemplates.length ? { templates: mappedTemplates } : null;
  }

  const latestSubmission = await fetchLatestSubmission(organizationProfile.id);
  const remoteState: Partial<LydoSeedState> = {
    organizationProfiles: [mapOrganizationProfile(organizationProfile)],
    templates: mappedTemplates,
  };

  if (!latestSubmission) {
    return remoteState;
  }

  remoteState.documentSubmissions = [
    {
      id: latestSubmission.id,
      organizationId: latestSubmission.organization_id,
      submittedBy: latestSubmission.submitted_by,
      status: latestSubmission.status,
      userConfirmed: latestSubmission.user_confirmed,
      submittedAt: latestSubmission.submitted_at ?? "",
      reviewedBy: latestSubmission.reviewed_by ?? "",
      reviewedAt: latestSubmission.reviewed_at ?? "",
      overallRemarks: latestSubmission.overall_remarks ?? "",
      createdAt: latestSubmission.created_at,
      updatedAt: latestSubmission.updated_at,
    },
  ];

  const { data: fileRows, error: filesError } = await supabase!
    .from("document_submission_files")
    .select("id,submission_id,file_url,file_name,file_type,file_size,ocr_text,ocr_status,ocr_confidence,validation_status,admin_status,admin_remarks,uploaded_at,reviewed_at,created_at,updated_at,required_document_types(id,name)")
    .eq("submission_id", latestSubmission.id);

  if (filesError) throw new Error(filesError.message);

  remoteState.documentSubmissionFiles = ((fileRows as DocumentSubmissionFileRow[] | null) ?? [])
    .map(mapDocumentFile)
    .filter((file): file is SubmissionFile => Boolean(file));

  return remoteState;
};

export const upsertOrganizationProfileInSupabase = async (profile: OrganizationProfile) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) throw new Error("Please sign in with your organization account first.");

  const payload = {
    user_id: session.user.id,
    organization_name: profile.organizationName.trim(),
    organization_email: profile.organizationEmail.trim(),
    contact_number: profile.contactNumber.trim(),
    barangay: profile.barangay.trim(),
    major_classification: profile.majorClassification || null,
    sub_classification: profile.subClassification || null,
    advocacies: profile.advocacies,
    adviser_name: profile.adviserName.trim() || null,
    representative_name: profile.representativeName.trim() || null,
    address: profile.address.trim() || null,
    facebook_page_url: profile.facebookPageUrl.trim() || null,
    profile_status: profile.profileStatus,
    internal_notes: profile.internalNotes.trim() || null,
  };

  const { data, error } = await supabase
    .from("organization_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("id,user_id,organization_name,organization_email,contact_number,barangay,major_classification,sub_classification,advocacies,adviser_name,representative_name,address,facebook_page_url,profile_status,internal_notes,created_at,updated_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save organization profile.");

  return mapOrganizationProfile(data as OrganizationProfileRow);
};

const ensureDocumentSubmission = async (organizationId: string, userId: string) => {
  const existingSubmission = await fetchLatestSubmission(organizationId);
  if (existingSubmission) return existingSubmission;

  const { data, error } = await supabase!
    .from("document_submissions")
    .insert({
      organization_id: organizationId,
      submitted_by: userId,
      status: "draft",
      user_confirmed: false,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create document submission.");
  return data as DocumentSubmissionRow;
};

const fetchRequiredDocumentTypeRowByName = async (name: string) => {
  const { data, error } = await supabase!
    .from("required_document_types")
    .select("id,name,description,template_url,template_description,sort_order,is_required,is_active,updated_at")
    .eq("name", name)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Required document type not found for ${name}.`);
  return data as RequiredDocumentTypeRow;
};

export const uploadOrganizationDocumentToSupabase = async (params: {
  documentTypeName: string;
  file: File;
}) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) throw new Error("Please sign in with your organization account first.");

  const [organizationProfile, documentTypeRow] = await Promise.all([
    fetchOrganizationProfile(session.user.id),
    fetchRequiredDocumentTypeRowByName(params.documentTypeName),
  ]);

  if (!organizationProfile) {
    throw new Error("No organization profile was found for this account.");
  }

  const submission = await ensureDocumentSubmission(organizationProfile.id, session.user.id);
  const safeFileName = sanitizeFileName(params.file.name);
  const objectPath = `${organizationProfile.id}/${documentTypeRow.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ORGANIZATION_DOCUMENTS_BUCKET)
    .upload(objectPath, params.file, {
      upsert: true,
      contentType: params.file.type || "application/octet-stream",
    });

  if (uploadError) throw new Error(uploadError.message);

  const storageUri = buildStorageUri(ORGANIZATION_DOCUMENTS_BUCKET, objectPath);
  const uploadedAt = new Date().toISOString();

  const { data, error } = await supabase!
    .from("document_submission_files")
    .upsert(
      {
        submission_id: submission.id,
        document_type_id: documentTypeRow.id,
        file_url: storageUri,
        file_name: params.file.name,
        file_type: params.file.type || "application/octet-stream",
        file_size: params.file.size,
        ocr_text: "",
        ocr_status: "pending",
        ocr_confidence: 0,
        validation_status: "correct",
        admin_status: "draft",
        admin_remarks: "",
        uploaded_at: uploadedAt,
      },
      {
        onConflict: "submission_id,document_type_id",
      },
    )
    .select("id,submission_id,file_url,file_name,file_type,file_size,ocr_text,ocr_status,ocr_confidence,validation_status,admin_status,admin_remarks,uploaded_at,reviewed_at,created_at,updated_at,required_document_types(id,name)")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save the uploaded document.");

  await supabase
    .from("document_submissions")
    .update({
      status: "uploaded",
      user_confirmed: false,
      updated_at: uploadedAt,
    })
    .eq("id", submission.id);

  const mappedFile = mapDocumentFile(data as DocumentSubmissionFileRow);
  if (!mappedFile) throw new Error("The uploaded document could not be mapped to the portal.");

  return {
    submissionId: submission.id,
    file: mappedFile,
  };
};

export const uploadTemplateDocumentToSupabase = async (params: {
  documentTypeName: string;
  file: File;
}) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const adminSession = readAdminSession();
  if (!adminSession) throw new Error("Please sign in with the seeded admin account first.");

  const documentTypeRow = await fetchRequiredDocumentTypeRowByName(params.documentTypeName);
  const safeFileName = sanitizeFileName(params.file.name);
  const objectPath = `${documentTypeRow.id}/${Date.now()}-${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(TEMPLATE_FILES_BUCKET)
    .upload(objectPath, params.file, {
      upsert: true,
      contentType: params.file.type || "application/octet-stream",
    });

  if (uploadError) throw new Error(uploadError.message);

  const templateStorageUri = buildStorageUri(TEMPLATE_FILES_BUCKET, objectPath);
  const { data, error } = await supabase.rpc("update_admin_template_file_url", {
    _session_token: adminSession.sessionToken,
    _template_id: documentTypeRow.id,
    _template_url: templateStorageUri,
  });

  const updatedRow = Array.isArray(data) ? data[0] : null;
  if (error || !updatedRow) throw new Error(error?.message ?? "Failed to update the template record.");

  const mappedTemplate = mapTemplate(updatedRow as RequiredDocumentTypeRow);
  if (!mappedTemplate) throw new Error("The uploaded template could not be mapped to the portal.");

  return mappedTemplate;
};

export const createTemplateRecordInSupabase = async (params: {
  name: string;
  description: string;
  templateDescription: string;
}) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const adminSession = readAdminSession();
  if (!adminSession) throw new Error("Please sign in with the seeded admin account first.");

  const { data, error } = await supabase.rpc("create_admin_template_document", {
    _session_token: adminSession.sessionToken,
    _name: params.name.trim(),
    _description: params.description.trim(),
    _template_description: params.templateDescription.trim(),
  });

  const createdRow = Array.isArray(data) ? data[0] : null;
  if (error || !createdRow) throw new Error(error?.message ?? "Failed to create the template.");

  const mappedTemplate = mapTemplate(createdRow as RequiredDocumentTypeRow);
  if (!mappedTemplate) throw new Error("The new template could not be mapped to the portal.");
  return mappedTemplate;
};

export const updateTemplateRecordInSupabase = async (params: {
  databaseId: string;
  name: string;
  description: string;
  templateDescription: string;
}) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const adminSession = readAdminSession();
  if (!adminSession) throw new Error("Please sign in with the seeded admin account first.");

  const { data, error } = await supabase.rpc("update_admin_template_document", {
    _session_token: adminSession.sessionToken,
    _template_id: params.databaseId,
    _name: params.name.trim(),
    _description: params.description.trim(),
    _template_description: params.templateDescription.trim(),
  });

  const updatedRow = Array.isArray(data) ? data[0] : null;
  if (error || !updatedRow) throw new Error(error?.message ?? "Failed to update the template.");

  const mappedTemplate = mapTemplate(updatedRow as RequiredDocumentTypeRow);
  if (!mappedTemplate) throw new Error("The updated template could not be mapped to the portal.");
  return mappedTemplate;
};

export const deleteTemplateRecordInSupabase = async (databaseId: string) => {
  if (!supabase) throw new Error("Supabase is not configured.");
  const adminSession = readAdminSession();
  if (!adminSession) throw new Error("Please sign in with the seeded admin account first.");

  const { error } = await supabase.rpc("deactivate_admin_template_document", {
    _session_token: adminSession.sessionToken,
    _template_id: databaseId,
  });

  if (error) throw new Error(error.message);
};

export const resolveSupabaseFileUrl = async (value: string) => {
  if (!supabase || !value) return value;

  const parsed = parseStorageUri(value);
  if (!parsed) return value;

  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 60);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Failed to create a file URL.");
  return data.signedUrl;
};
