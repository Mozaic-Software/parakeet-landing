import { Injectable } from '@angular/core';

export interface WorkflowData {
  caseId: string;
  caseType: string;
  filingDate: string;
  charges: Array<{
    id: string;
    code: string;
    description: string;
    severity: string;
  }>;
  parties: Array<{
    id: string;
    type: string;
    name: string;
    email: string;
  }>;
  documents: Array<{
    id: string;
    type: string;
    url: string;
    status: string;
  }>;
  metadata: Record<string, any>;
}

export const DATA_SCHEMA = {
  type: 'object',
  required: ['caseId', 'caseType', 'filingDate', 'charges', 'parties'],
  properties: {
    caseId: { type: 'string', pattern: '^CASE-\\d{8}$' },
    caseType: { type: 'string', enum: ['CRIMINAL', 'CIVIL', 'FAMILY', 'TRAFFIC'] },
    filingDate: { type: 'string', format: 'date-time' },
    charges: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'code', 'description', 'severity'],
        properties: {
          id: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['FELONY', 'MISDEMEANOR', 'INFRACTION'] }
        }
      }
    },
    parties: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'name', 'email'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['DEFENDANT', 'PLAINTIFF', 'ATTORNEY', 'JUDGE'] },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  constructor() {}

  getInitialWorkflowData(): WorkflowData {
    return {
      caseId: 'CASE-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      caseType: 'CRIMINAL',
      filingDate: new Date().toISOString(),
      charges: [],
      parties: [],
      documents: [],
      metadata: {}
    };
  }
} 