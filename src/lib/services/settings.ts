import { supabaseAdmin } from '@/lib/supabase';

export interface OrganizationSettings {
  gemini_api_key?: string;
  email_provider?: string;
  email_user?: string;
  email_password?: string;
  email_from_name?: string;
  zoho_client_id?: string;
  zoho_client_secret?: string;
  zoho_refresh_token?: string;
  zoho_api_url?: string;
  zoho_accounts_url?: string;
}

export class SettingsService {
  /**
   * Retrieves the settings for a specific organization using the admin key.
   * This is safe for background jobs.
   */
  public static async getSettings(organizationId: string): Promise<OrganizationSettings> {
    if (!organizationId) {
      throw new Error('organizationId is required to fetch settings.');
    }

    const { data, error } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      // If no settings exist yet, return an empty object rather than crashing
      if (error.code === 'PGRST116') {
        return {};
      }
      throw new Error(`Failed to fetch organization settings: ${error.message}`);
    }

    return data || {};
  }
}
