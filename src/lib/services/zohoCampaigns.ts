export class ZohoCampaignsService {
  private static getApiUrl(): string {
    return process.env.ZOHO_CAMPAIGNS_API_URL || 'https://campaigns.zoho.com/api/v1.1';
  }

  /**
   * Refreshes the Zoho token (reuses logic or needs a different scope).
   * For this implementation, we assume the token is fetched similarly to CRM or provided directly.
   */
  private static async getAccessToken(): Promise<string> {
    // In a real scenario, this would use the refresh token with the campaigns scope
    // 'ZohoCampaigns.campaign.ALL'
    // We will simulate the token retrieval for now, or use the CRM token if it shares scopes.
    const token = process.env.ZOHO_CAMPAIGNS_TOKEN || 'dummy-campaigns-token';
    return token;
  }

  /**
   * Pushes lead engagement data to Zoho Campaigns.
   */
  public static async pushEngagement(
    email: string,
    campaignName: string,
    action: 'opened' | 'clicked',
    details: string
  ): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const apiUrl = `${this.getApiUrl()}/updateContactActivity`;

      const params = new URLSearchParams({
        resfmt: 'JSON',
        contactinfo: JSON.stringify({
          'Contact Email': email,
          'Campaign Name': campaignName,
          'Action': action,
          'Details': details
        })
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.warn('Failed to sync with Zoho Campaigns:', await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error syncing with Zoho Campaigns:', error);
      return false;
    }
  }

  /**
   * Triggers an email dispatch using Zoho Campaigns Transmission API
   */
  public static async triggerEmail(
    campaignKey: string,
    recipientEmail: string,
    recipientName: string,
    customBody: string
  ): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const apiUrl = `${this.getApiUrl()}/json/transmission`;

      // Structure for Zoho Campaigns transmission
      const payload = {
        campaign_key: campaignKey,
        recipients: [
          {
            email: recipientEmail,
            first_name: recipientName,
            merge_data: {
              AI_Email_Body: customBody
            }
          }
        ]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('Failed to trigger Zoho Campaigns email:', await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error triggering Zoho Campaigns email:', error);
      return false;
    }
  }

  /**
   * Fetches aggregate campaign statistics (sent, opened, clicked) from Zoho Campaigns.
   */
  public static async fetchCampaignAnalytics(campaignName: string) {
    try {
      const token = await this.getAccessToken();
      // Zoho Campaigns API to get campaign summary. 
      // First we need to search for the campaign to get its key, then get its summary.
      // We assume ZOHO_CAMPAIGNS_API_URL is the base v1.1 API
      
      const searchUrl = `${this.getApiUrl()}/getCampaigns?resfmt=JSON&status=sent`;
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`
        },
      });

      if (!searchResponse.ok) {
        console.warn('Failed to fetch campaigns from Zoho Campaigns:', await searchResponse.text());
        return null;
      }

      const searchData = await searchResponse.json();
      
      // The API returns recent campaigns. Find the one matching our name.
      const campaignsList = searchData.recent_campaigns || [];
      const matchedCampaign = campaignsList.find((c: any) => c.campaign_name === campaignName);

      if (!matchedCampaign) {
        console.warn(`Campaign ${campaignName} not found in Zoho Campaigns or has not been sent yet.`);
        return {
          totalSent: 0,
          totalOpened: 0,
          openRate: 0,
          totalClicked: 0,
          campaignKey: null
        };
      }

      const campaignKey = matchedCampaign.campaign_key;

      // Now fetch the specific summary for this campaign
      const summaryUrl = `${this.getApiUrl()}/getCampaignSummary?resfmt=JSON&campaign_key=${campaignKey}`;
      const summaryResponse = await fetch(summaryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`
        },
      });

      if (!summaryResponse.ok) {
        console.warn('Failed to fetch campaign summary:', await summaryResponse.text());
        return null;
      }

      const summaryData = await summaryResponse.json();
      const details = summaryData.campaign_details || {};

      const totalSent = parseInt(details.emails_sent, 10) || 0;
      const totalOpened = parseInt(details.unique_opens, 10) || 0;
      const totalClicked = parseInt(details.unique_clicks, 10) || 0;
      
      const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

      return {
        totalSent,
        totalOpened,
        openRate,
        totalClicked,
        campaignKey
      };
    } catch (error) {
      console.error('Error fetching Zoho Campaigns analytics:', error);
      return null;
    }
  }

  /**
   * Fetches granular recipient data (opens or clicks) for a specific campaign.
   */
  public static async fetchCampaignRecipients(campaignKey: string, type: 'open' | 'click') {
    try {
      const token = await this.getAccessToken();
      const url = `${this.getApiUrl()}/getcampaignrecipientsdata?resfmt=JSON&campaignkey=${campaignKey}&type=${type}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${type} data for campaign ${campaignKey}:`, await response.text());
        return [];
      }

      const data = await response.json();
      
      // Zoho typically returns the list of contacts under something like `campaign_recipients` or `recent_activities`
      // We will parse the response robustly
      if (data && data.response && data.response.result && data.response.result.campaign_recipients) {
        return data.response.result.campaign_recipients;
      }
      
      // Alternative fallback if structure varies
      if (data.campaign_recipients) {
        return data.campaign_recipients;
      }

      // If data is an array directly
      if (Array.isArray(data)) {
        return data;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching Zoho Campaigns ${type} recipients:`, error);
      return [];
    }
  }
}
