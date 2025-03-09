import { app } from "@azure/functions";

interface WaitlistEntry {
  email: string;
  caseManagementSystem: string;
  otherCms?: string;
  agencyType: string;
  otherAgency?: string;
  submittedAt: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate the waitlist entry
function validateEntry(entry: any): entry is WaitlistEntry {
  if (!entry || typeof entry !== 'object') return false;
  
  if (!entry.email || !isValidEmail(entry.email)) return false;
  if (!entry.caseManagementSystem || typeof entry.caseManagementSystem !== 'string') return false;
  if (!entry.agencyType || typeof entry.agencyType !== 'string') return false;
  if (!entry.submittedAt || typeof entry.submittedAt !== 'string') return false;
  
  if (entry.otherCms && typeof entry.otherCms !== 'string') return false;
  if (entry.otherAgency && typeof entry.otherAgency !== 'string') return false;
  
  return true;
}

app.http('submitWaitlist', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log(`Http function processed request for url "${request.url}"`);

    // Only allow POST requests
    if (request.method !== 'POST') {
      return {
        status: 405,
        body: 'Method not allowed'
      };
    }

    try {
      const body = await request.json();
      
      // Validate the request body
      if (!validateEntry(body)) {
        return {
          status: 400,
          body: 'Invalid request body format'
        };
      }

      // For now, just log and return success
      context.log('Received valid waitlist entry:', body);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Successfully added to waitlist",
          data: {
            id: new Date().getTime().toString(),
            email: body.email
          }
        }
      };
    } catch (error) {
      context.error('Error processing waitlist submission:', error);
      return {
        status: 500,
        body: 'Internal server error'
      };
    }
  }
}); 