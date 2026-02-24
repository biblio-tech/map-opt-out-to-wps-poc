export interface CSVRow {
  dateSent: string;
  term: string;
  crn: string;
  courseandsectioncode: string;
  studentid: string;
  firstname: string;
  lastname: string;
  email: string;
  ISBN: string;
  title: string;
  author: string;
  publisher: string;
  startdate: string;
  censusdate: string;
  enddate: string;
  coursetitle: string;
  coursecode: string;
  enrollmentstatus: string;
  optout: string;
  contenttype: string;
}

export interface OptInOptOutDTO {
  type?: string;
  termCode?: string;
  crn?: string;
  departmentCode?: string;
  courseCode?: string;
  sectionCode?: string;
  studentId?: string;
  firsName?: string; // Note: API typo - "firsName" not "firstName"
  lastName?: string;
  email?: string;
  itemScanCode?: string;
  title?: string;
  author?: string;
  publisher?: string;
  optOut?: boolean;
  contentType?: string;
  processed?: boolean;
  failedToProcessReason?: string;
}

export interface ApiResponse<T = unknown> {
  status: number;
  data?: T;
  error?: string;
}

export interface Adoption {
  termCode?: string;
  crn?: string;
  deptCode: string;
  courseCode: string;
  section: string;
  costToStore?: number;
  costToStudent: number;
  publisher?: string;
  itemScanCode: string;
  itemName: string;
  categories?: string[];
}

export interface AdoptionWrapper {
  adoptions: Adoption[];
}

export interface Enrollment {
  termCode?: string;
  deptCode?: string;
  courseCode?: string;
  section?: string;
  customer?: string;
  faLoad?: string;
  academicCareer?: string;
  createdAt?: number;
}

export interface EnrollmentWrapper {
  enrollments: Enrollment[];
}

export interface UploadMessage {
  entryNumber: number;
  messages: string[];
}

export interface UploadResult {
  uploadUuid?: string;
  filename?: string;
  result?: string;
  startedAt?: number;
  endedAt?: number;
  totalRecords: number;
  totalErrors: number;
  successfulRecords: number;
  warningRecords: number;
  errorRecords: number;
  warnings: UploadMessage[];
  errors: UploadMessage[];
}
