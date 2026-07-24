interface ZohoLeadFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  description?: string;
}

export class ZohoService {
  private static accessToken: string | null = null;
  private static tokenExpiry: number | null = null;

  private static getAccountsUrl(): string {
    return process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
  }

  private static getApiUrl(): string {
    return process.env.ZOHO_API_URL || 'https://www.zohoapis.com';
  }

  /**
   * Refreshes the Zoho access token if it is expired or not yet fetched.
   */
  private static async refreshAccessToken(): Promise<string> {
    const now = Date.now();
    // Use cached token if it has more than 1 minute of validity remaining
    if (this.accessToken && this.tokenExpiry && now < this.tokenExpiry - 60000) {
      return this.accessToken!;
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Zoho credentials ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN are missing in environment.');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    const tokenUrl = `${this.getAccountsUrl()}/oauth/v2/token?${params.toString()}`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh Zoho access token: ${response.statusText}. Details: ${errorText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error(`Zoho token response did not contain access_token: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.access_token;
    // expires_in is in seconds, convert to absolute ms timestamp
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken!;
  }

  /**
   * Creates a lead record in Zoho CRM.
   * Maps properties and ensures the mandatory Last_Name field is populated.
   */
  public static async createLead(fields: ZohoLeadFields): Promise<{ crmRecordId: string }> {
    const accessToken = await this.refreshAccessToken();

    // Zoho CRM requires Last_Name. If missing, attempt splitting or assign a fallback.
    let firstName = (fields.firstName || '').trim();
    let lastName = (fields.lastName || '').trim();

    if (!lastName && firstName) {
      const parts = firstName.split(/\s+/);
      if (parts.length > 1) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        lastName = firstName;
        firstName = '';
      }
    }

    if (!lastName) {
      lastName = 'Unknown';
    }

    const leadData = {
      First_Name: firstName || null,
      Last_Name: lastName,
      Email: fields.email || null,
      Phone: fields.phone || null,
      Company: fields.company || 'Unknown',
      Designation: fields.title || null,
      Description: fields.description || '',
    };

    const apiUrl = `${this.getApiUrl()}/crm/v2/Leads`;

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: [leadData] }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Zoho CRM API returned error: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }

        const resData = await response.json();
        
        if (!resData.data || resData.data.length === 0) {
          throw new Error(`Invalid response structure from Zoho CRM: ${JSON.stringify(resData)}`);
        }

        const leadResult = resData.data[0];
        if (leadResult.status !== 'success') {
          throw new Error(`Zoho CRM lead creation status failed: ${JSON.stringify(leadResult.details || leadResult)}`);
        }

        return { crmRecordId: leadResult.details.id };
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        // Wait with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error('Failed to create Zoho CRM lead after 3 retries.');
  }
}
