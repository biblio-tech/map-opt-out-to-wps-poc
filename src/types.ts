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
