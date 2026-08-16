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
  private static tokenCache: Record<string, { accessToken: string; tokenExpiry: number }> = {};

  /**
   * Refreshes the Zoho access token if it is expired or not yet fetched.
   */
  private static async refreshAccessToken(
    orgId: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    accountsUrl: string = 'https://accounts.zoho.com'
  ): Promise<string> {
    const now = Date.now();
    const cached = this.tokenCache[orgId];
    if (cached && now < cached.tokenExpiry - 60000) {
      return cached.accessToken;
    }

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Zoho credentials clientId, clientSecret, or refreshToken are missing for this organization.');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    const tokenUrl = `${accountsUrl}/oauth/v2/token?${params.toString()}`;

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

    this.tokenCache[orgId] = {
      accessToken: data.access_token,
      tokenExpiry: Date.now() + (data.expires_in * 1000)
    };

    return data.access_token;
  }

  /**
   * Creates a lead record in Zoho CRM.
   * Maps properties and ensures the mandatory Last_Name field is populated.
   */
  public static async createLead(
    credentials: { orgId: string; clientId: string; clientSecret: string; refreshToken: string; apiUrl?: string; accountsUrl?: string },
    fields: ZohoLeadFields
  ): Promise<{ crmRecordId: string }> {
    const accessToken = await this.refreshAccessToken(
      credentials.orgId,
      credentials.clientId,
      credentials.clientSecret,
      credentials.refreshToken,
      credentials.accountsUrl
    );

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

    const apiUrl = credentials.apiUrl || 'https://www.zohoapis.com';

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await fetch(`${apiUrl}/crm/v3/Leads`, {
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

  /**
   * Updates fields of an existing lead in Zoho CRM.
   */
  public static async searchLeadByEmail(
    credentials: { orgId: string; clientId: string; clientSecret: string; refreshToken: string; apiUrl?: string; accountsUrl?: string },
    email: string
  ): Promise<{ crmRecordId: string | null }> {
    const accessToken = await this.refreshAccessToken(
      credentials.orgId,
      credentials.clientId,
      credentials.clientSecret,
      credentials.refreshToken,
      credentials.accountsUrl
    );

    const apiUrl = credentials.apiUrl || 'https://www.zohoapis.com';
    const params = new URLSearchParams({ email });
    const response = await fetch(`${apiUrl}/crm/v3/Leads/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) return { crmRecordId: null };
    const data = await response.json();
    return { crmRecordId: data.data?.[0]?.id || null };
  }

  public static async updateLead(
    credentials: { orgId: string; clientId: string; clientSecret: string; refreshToken: string; apiUrl?: string; accountsUrl?: string },
    crmRecordId: string, 
    fields: any
  ): Promise<boolean> {
    try {
      const accessToken = await this.refreshAccessToken(
        credentials.orgId,
        credentials.clientId,
        credentials.clientSecret,
        credentials.refreshToken,
        credentials.accountsUrl
      );
      const apiUrl = (credentials.apiUrl || 'https://www.zohoapis.com') + `/crm/v3/Leads/${crmRecordId}`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [fields] }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('Failed to update Zoho CRM lead:', errText);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Error updating Zoho CRM lead:', error);
      return false;
    }
  }

  /**
   * Adds a Note timeline entry under a Lead in Zoho CRM.
   */
  public static async addNote(
    credentials: { orgId: string; clientId: string; clientSecret: string; refreshToken: string; apiUrl?: string; accountsUrl?: string },
    crmRecordId: string, 
    title: string, 
    content: string
  ): Promise<boolean> {
    try {
      const accessToken = await this.refreshAccessToken(
        credentials.orgId,
        credentials.clientId,
        credentials.clientSecret,
        credentials.refreshToken,
        credentials.accountsUrl
      );
      const apiUrl = (credentials.apiUrl || 'https://www.zohoapis.com') + '/crm/v3/Notes';

      const noteData = {
        Note_Title: title,
        Note_Content: content,
        Parent_Id: crmRecordId,
        $se_module: 'Leads',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [noteData] }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('Failed to add note in Zoho CRM:', errText);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Error adding note in Zoho CRM:', error);
      return false;
    }
  }

}
