import { google } from 'googleapis';

interface SheetLeadFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  description?: string;
  leadId?: string;
}

export class SheetsService {
  /**
   * Initializes and returns an authenticated Google Sheets client.
   */
  private static async getSheetsClient() {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || '';

    if (!serviceAccountJson || !spreadsheetId) {
      throw new Error('Google Sheets configuration (GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEET_ID) is missing.');
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch {
      // Handle base64 encoded service account JSON string if provided
      try {
        const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
        credentials = JSON.parse(decoded);
      } catch {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be a valid JSON string or a base64 encoded JSON string.');
      }
    }

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Google service account credentials must contain client_email and private_key.');
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'), // replace escaped newlines with literal newlines
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return {
      sheets: google.sheets({ version: 'v4', auth }),
      spreadsheetId,
    };
  }

  /**
   * Appends lead fields to the Google Sheet as a fallback CRM mechanism.
   * Runs up to 3 retries on transient errors.
   */
  public static async appendLead(fields: SheetLeadFields): Promise<{ crmRecordId: string }> {
    const { sheets, spreadsheetId } = await this.getSheetsClient();
    
    const timestamp = new Date().toISOString();
    const rowValues = [
      fields.leadId || '',
      timestamp,
      fields.firstName || '',
      fields.lastName || '',
      fields.email || '',
      fields.phone || '',
      fields.company || '',
      fields.title || '',
      fields.description || '',
    ];

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A:I',
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [rowValues],
          },
        });

        const updatedRange = response.data.updates?.updatedRange || 'unknown-range';
        return { crmRecordId: `sheets:${updatedRange}` };
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('Failed to append lead to Google Sheet after 3 retries.');
  }
}
