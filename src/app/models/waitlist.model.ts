export interface WaitlistEntry {
  firstName: string;
  lastName: string;
  email: string;
  caseManagementSystem: string;
  otherCms?: string;
  agencyType: string;
  otherAgency?: string;
  submittedAt: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
  };
} 