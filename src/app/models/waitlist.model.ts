export interface WaitlistEntry {
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