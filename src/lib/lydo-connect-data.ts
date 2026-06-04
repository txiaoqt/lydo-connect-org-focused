import { Bell, CalendarDays, ClipboardList, FileCheck2, FileText, Megaphone, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { ComponentType } from "react";

export type ProfileStatus =
  | "incomplete"
  | "pending_review"
  | "verified"
  | "needs_update"
  | "suspended_inactive";

export type DocumentSubmissionStatus =
  | "not_started"
  | "draft"
  | "uploaded"
  | "ocr_processing"
  | "ready_for_review"
  | "submitted"
  | "under_admin_review"
  | "needs_revision"
  | "approved_green"
  | "rejected_red";

export type BudgetRequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "approved_for_ftf_green"
  | "rejected_red"
  | "hard_copy_submitted"
  | "budget_released"
  | "completed";

export type LiquidationStatus =
  | "pending_activity_completion"
  | "not_started"
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "approved_for_ftf_green"
  | "rejected_red"
  | "hard_copy_submitted"
  | "completed_liquidated"
  | "overdue";

export type VisibilityStatus = "draft" | "published" | "hidden";

export type RequiredDocumentType = {
  id: string;
  name: string;
  description: string;
  templateUrl: string;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
};

export const createTemplateLocalId = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "template";

export const legacyRemovedTemplateNames = new Set([
  "Additional Requirement 1 / Supporting Document",
  "Additional Requirement 2 / Supporting Document",
]);

export type PortalNavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type PortalNavGroup = {
  id: string;
  label: string;
  items: PortalNavItem[];
};

export const requiredDocumentTypes: RequiredDocumentType[] = [
  {
    id: "constitution-bylaws",
    name: "Constitution and By-Laws",
    description: "Upload the signed constitution and by-laws in PDF format.",
    templateUrl: "#constitution-bylaws-template",
    sortOrder: 1,
    isRequired: true,
    isActive: true,
  },
  {
    id: "yorp-form-b",
    name: "2026 NYC YORP Registration Form (Form B)",
    description: "Use the current Form B template for the organization registration packet.",
    templateUrl: "#form-b-template",
    sortOrder: 2,
    isRequired: true,
    isActive: true,
  },
  {
    id: "yorp-officers-adviser",
    name: "2026 YORP Directory of Officers and Adviser",
    description: "List all officers and the organization adviser.",
    templateUrl: "#officers-adviser-template",
    sortOrder: 3,
    isRequired: true,
    isActive: true,
  },
  {
    id: "yorp-members",
    name: "2026 YORP List of Members in Good Standing",
    description: "Upload the current membership list in good standing.",
    templateUrl: "#members-template",
    sortOrder: 4,
    isRequired: true,
    isActive: true,
  },
  {
    id: "pcydo-form-a",
    name: "Pasig City YORP Registration Form (Form A)",
    description: "Official Pasig City Form A requirement.",
    templateUrl: "#form-a-template",
    sortOrder: 5,
    isRequired: true,
    isActive: true,
  },
  {
    id: "pcydo-data-request",
    name: "PCYDO YORP Data Request Form",
    description: "Current PCYDO data request form for the organization.",
    templateUrl: "#data-request-template",
    sortOrder: 6,
    isRequired: true,
    isActive: true,
  },
];

export const userNavigationGroups: PortalNavGroup[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Sparkles },
      { id: "organization-profile", label: "Organization Profile", icon: Users },
    ],
  },
  {
    id: "compliance-workflow",
    label: "Compliance Workflow",
    items: [
      { id: "document-submission", label: "Document Submission", icon: FileText },
      { id: "validation-review", label: "Validation and Review", icon: FileCheck2 },
      { id: "budget-request", label: "Budget Request", icon: ClipboardList },
      { id: "liquidation-reporting", label: "Liquidation and Reporting", icon: CalendarDays },
    ],
  },
  {
    id: "updates",
    label: "Updates",
    items: [
      { id: "news-releases", label: "News Releases", icon: Megaphone },
      { id: "public-transparency", label: "Public Transparency Posting", icon: ShieldCheck },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "status",
    label: "Status",
    items: [{ id: "compliance-status", label: "Compliance Status", icon: FileCheck2 }],
  },
];

export const userNavigation = userNavigationGroups.flatMap((group) => group.items);

export const userRouteMap: Record<string, string> = {
  dashboard: "/dashboard",
  "organization-profile": "/organization-profile",
  "document-submission": "/document-submission",
  "validation-review": "/validation-review",
  "budget-request": "/budget-request",
  "liquidation-reporting": "/liquidation-reporting",
  "news-releases": "/news-releases",
  "public-transparency": "/public-transparency",
  "compliance-status": "/compliance-status",
  notifications: "/notifications",
};

export const adminNavigationGroups: PortalNavGroup[] = [
  {
    id: "monitoring",
    label: "Monitoring",
    items: [
      { id: "overview", label: "Overview", icon: Sparkles },
      { id: "registrations", label: "Registrations", icon: Users },
      { id: "users", label: "Users", icon: Users },
    ],
  },
  {
    id: "review",
    label: "Review",
    items: [
      { id: "budget-utilization", label: "Budget Utilization", icon: ClipboardList },
      { id: "liquidation-monitoring", label: "Liquidation Monitoring", icon: CalendarDays },
      { id: "remarks-consequences", label: "Remarks and Consequences", icon: ShieldCheck },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { id: "news-releases", label: "News Releases", icon: Megaphone },
      { id: "public-transparency-posts", label: "Public Transparency Posts", icon: ShieldCheck },
      { id: "templates", label: "Templates", icon: FileText },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [{ id: "notifications-activity", label: "Notifications / Activity Logs", icon: Bell }],
  },
];

export const adminNavigation = adminNavigationGroups.flatMap((group) => group.items);

export type OrganizationProfile = {
  id: string;
  userId: string;
  organizationName: string;
  organizationEmail: string;
  contactNumber: string;
  barangay: string;
  organizationType: string;
  adviserName: string;
  representativeName: string;
  address: string;
  facebookPageUrl: string;
  profileStatus: ProfileStatus;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionFile = {
  id: string;
  submissionId: string;
  documentTypeId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  ocrText: string;
  ocrStatus: "pending" | "processing" | "completed" | "failed";
  ocrConfidence: number;
  validationStatus: "correct" | "needs_reupload" | "missing" | "mismatch";
  adminStatus: "draft" | "under_review" | "green" | "needs_revision" | "red";
  adminRemarks: string;
  uploadedAt: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSubmission = {
  id: string;
  organizationId: string;
  submittedBy: string;
  status: DocumentSubmissionStatus;
  userConfirmed: boolean;
  submittedAt: string;
  reviewedBy: string;
  reviewedAt: string;
  overallRemarks: string;
  createdAt: string;
  updatedAt: string;
};

export type BudgetRequestFile = {
  id: string;
  budgetRequestId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  createdAt: string;
};

export type BudgetRequest = {
  id: string;
  organizationId: string;
  submittedBy: string;
  activityTitle: string;
  activityDescription: string;
  activityDate: string;
  venue: string;
  requestedAmount: number;
  approvedAmount: number;
  releasedAmount: number;
  releaseDate: string;
  purposeCategory: string;
  status: BudgetRequestStatus;
  remarks: string;
  goSignalAt: string;
  hardCopySubmittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LiquidationReportFile = {
  id: string;
  liquidationReportId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  createdAt: string;
};

export type LiquidationReport = {
  id: string;
  budgetRequestId: string;
  organizationId: string;
  submittedBy: string;
  status: LiquidationStatus;
  remarks: string;
  goSignalAt: string;
  deadlineAt: string;
  hardCopySubmittedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type NewsRelease = {
  id: string;
  title: string;
  description: string;
  facebookPostUrl: string;
  datePosted: string;
  visibilityStatus: VisibilityStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TransparencyPost = {
  id: string;
  title: string;
  description: string;
  category: string;
  attachmentUrl: string;
  visibilityStatus: VisibilityStatus;
  postDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ComplianceRemark = {
  id: string;
  organizationId: string;
  relatedType: string;
  relatedId: string;
  remarkType: string;
  consequenceType: string;
  message: string;
  status: string;
  createdBy: string;
  resolvedBy: string;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: string;
  relatedType: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
};

export type ActivityLog = {
  id: string;
  actorUserId: string;
  organizationId: string;
  action: string;
  relatedType: string;
  relatedId: string;
  description: string;
  createdAt: string;
};

export type TemplateRecord = RequiredDocumentType & {
  databaseId: string;
  templateDescription: string;
  templateActive: boolean;
  templateFileName: string;
  templateFileUrl: string;
  templateFileType: string;
  templateUploadedAt: string;
};

export type LydoSeedState = {
  organizationProfiles: OrganizationProfile[];
  documentSubmissions: DocumentSubmission[];
  documentSubmissionFiles: SubmissionFile[];
  budgetRequests: BudgetRequest[];
  budgetRequestFiles: BudgetRequestFile[];
  liquidationReports: LiquidationReport[];
  liquidationReportFiles: LiquidationReportFile[];
  newsReleases: NewsRelease[];
  transparencyPosts: TransparencyPost[];
  complianceRemarks: ComplianceRemark[];
  notifications: NotificationRecord[];
  activityLogs: ActivityLog[];
  templates: TemplateRecord[];
};

const nowIso = new Date().toISOString();

export const seedState: LydoSeedState = {
  organizationProfiles: [
    {
      id: "org-lydo-001",
      userId: "demo-user",
      organizationName: "Barangay Youth Alliance of LYDO",
      organizationEmail: "lydo.youth@example.com",
      contactNumber: "09123456789",
      barangay: "San Antonio",
      organizationType: "Barangay-based Youth Organization",
      adviserName: "Ms. Carla Reyes",
      representativeName: "Jasper Dela Cruz",
      address: "San Antonio, Pasig City",
      facebookPageUrl: "https://facebook.com/lydo.connect.demo",
      profileStatus: "pending_review",
      internalNotes: "Profile queued for initial verification.",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  documentSubmissions: [
    {
      id: "docsub-001",
      organizationId: "org-lydo-001",
      submittedBy: "demo-user",
      status: "under_admin_review",
      userConfirmed: true,
      submittedAt: nowIso,
      reviewedBy: "admin-demo",
      reviewedAt: "",
      overallRemarks: "Waiting for final validation of the remaining supporting document.",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  documentSubmissionFiles: requiredDocumentTypes.map((documentType, index) => ({
    id: `docfile-${index + 1}`,
    submissionId: "docsub-001",
    documentTypeId: documentType.id,
    fileName: `${documentType.id}.pdf`,
    fileUrl: "#",
    fileType: "application/pdf",
    fileSize: 124000 + index * 8000,
    ocrText: index < 6 ? `Extracted OCR text for ${documentType.name}.` : "",
    ocrStatus: index < 6 ? "completed" : "pending",
    ocrConfidence: index < 6 ? 92 : 0,
    validationStatus: index < 6 ? "correct" : "missing",
    adminStatus: "draft",
    adminRemarks: index < 6 ? "Looks good." : "Please upload the supporting file.",
    uploadedAt: nowIso,
    reviewedAt: "",
    createdAt: nowIso,
    updatedAt: nowIso,
  })),
  budgetRequests: [
    {
      id: "budget-001",
      organizationId: "org-lydo-001",
      submittedBy: "demo-user",
      activityTitle: "Youth Leadership Training",
      activityDescription: "Training and workshop for organization officers and members.",
      activityDate: "2026-06-18",
      venue: "LYDO Hall",
      requestedAmount: 15000,
      approvedAmount: 15000,
      releasedAmount: 15000,
      releaseDate: "2026-06-10",
      purposeCategory: "Capacity Building",
      status: "approved_for_ftf_green",
      remarks: "Soft copy pre-checked. Hard copies may now be submitted face-to-face.",
      goSignalAt: "2026-06-09T08:00:00.000Z",
      hardCopySubmittedAt: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  budgetRequestFiles: [
    {
      id: "budget-file-001",
      budgetRequestId: "budget-001",
      fileName: "budget-justification.pdf",
      fileUrl: "#",
      fileType: "application/pdf",
      fileSize: 188000,
      uploadedAt: nowIso,
      createdAt: nowIso,
    },
  ],
  liquidationReports: [
    {
      id: "liq-001",
      budgetRequestId: "budget-001",
      organizationId: "org-lydo-001",
      submittedBy: "demo-user",
      status: "under_review",
      remarks: "Please upload the signed attendance sheet and liquidation form.",
      goSignalAt: "2026-06-12T08:00:00.000Z",
      deadlineAt: "2026-07-12T08:00:00.000Z",
      hardCopySubmittedAt: "",
      completedAt: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  liquidationReportFiles: [
    {
      id: "liq-file-001",
      liquidationReportId: "liq-001",
      fileName: "liquidation-summary.pdf",
      fileUrl: "#",
      fileType: "application/pdf",
      fileSize: 141000,
      uploadedAt: nowIso,
      createdAt: nowIso,
    },
  ],
  newsReleases: [
    {
      id: "news-001",
      title: "LYDO Connect Compliance Drive Launch",
      description: "Reminder for youth organizations to complete profile setup and document submission.",
      facebookPostUrl: "https://facebook.com/example-post",
      datePosted: "2026-06-01",
      visibilityStatus: "published",
      createdBy: "admin-demo",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  transparencyPosts: [
    {
      id: "transparency-001",
      title: "Approved Registrations Summary",
      description: "A simplified transparency note showing approved organizations for the quarter.",
      category: "Approved Registrations",
      attachmentUrl: "#",
      visibilityStatus: "published",
      postDate: "2026-06-02",
      createdBy: "admin-demo",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  complianceRemarks: [
    {
      id: "remark-001",
      organizationId: "org-lydo-001",
      relatedType: "document_submission",
      relatedId: "docsub-001",
      remarkType: "warning",
      consequenceType: "needs_revision",
      message: "The last supporting requirement still needs a clean PDF upload.",
      status: "open",
      createdBy: "admin-demo",
      resolvedBy: "",
      resolvedAt: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  notifications: [
    {
      id: "notif-001",
      userId: "demo-user",
      organizationId: "org-lydo-001",
      title: "Budget request pre-checked",
      message: "Your soft copy requirements have been pre-checked. You may now submit the hard copies face-to-face.",
      type: "budget_go_signal",
      relatedType: "budget_request",
      relatedId: "budget-001",
      isRead: false,
      createdAt: nowIso,
    },
  ],
  activityLogs: [
    {
      id: "log-001",
      actorUserId: "admin-demo",
      organizationId: "org-lydo-001",
      action: "marked_budget_green",
      relatedType: "budget_request",
      relatedId: "budget-001",
      description: "Budget request marked green and ready for face-to-face submission.",
      createdAt: nowIso,
    },
  ],
  templates: requiredDocumentTypes.map((documentType) => ({
    ...documentType,
    databaseId: documentType.id,
    templateDescription: `Template for ${documentType.name}.`,
    templateActive: true,
    templateFileName: "",
    templateFileUrl: "",
    templateFileType: "",
    templateUploadedAt: "",
  })),
};

export const statusToneMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  incomplete: "destructive",
  pending_review: "secondary",
  verified: "default",
  needs_update: "outline",
  suspended_inactive: "destructive",
  not_started: "outline",
  draft: "secondary",
  uploaded: "secondary",
  ocr_processing: "outline",
  ready_for_review: "secondary",
  submitted: "secondary",
  under_admin_review: "outline",
  needs_revision: "destructive",
  approved_green: "default",
  rejected_red: "destructive",
  under_review: "outline",
  approved_for_ftf_green: "default",
  hard_copy_submitted: "secondary",
  budget_released: "default",
  completed: "default",
  pending_activity_completion: "secondary",
  completed_liquidated: "default",
  overdue: "destructive",
  published: "default",
  hidden: "outline",
};

export const statusLabelMap: Record<string, string> = {
  incomplete: "Incomplete Profile",
  pending_review: "Pending Review",
  verified: "Verified",
  needs_update: "Needs Update",
  suspended_inactive: "Suspended/Inactive",
  not_started: "Not Started",
  draft: "Draft",
  uploaded: "Uploaded",
  ocr_processing: "OCR Processing",
  ready_for_review: "Ready for Review",
  submitted: "Submitted",
  under_admin_review: "Under Admin Review",
  needs_revision: "Needs Revision",
  approved_green: "Approved / Green",
  rejected_red: "Rejected / Red",
  under_review: "Under Review",
  approved_for_ftf_green: "Green / Approved for FTF Submission",
  hard_copy_submitted: "Hard Copy Submitted",
  budget_released: "Budget Released",
  completed: "Completed",
  pending_activity_completion: "Pending Activity Completion",
  completed_liquidated: "Completed / Liquidated",
  overdue: "Overdue",
  published: "Published",
  hidden: "Hidden",
  draft_visibility: "Draft",
};

export const complianceSummaryHighlights = [
  "Profile completion",
  "Document submission progress",
  "Budget request status",
  "Liquidation deadlines",
  "Admin remarks and consequences",
];
