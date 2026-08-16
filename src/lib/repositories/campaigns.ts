import { SupabaseClient } from '@supabase/supabase-js';

export interface CampaignInsert {
  organization_id: string;
  name: string;
  description?: string;
  created_by?: string;
}

export class CampaignsRepository {
  /**
   * Creates a new campaign.
   */
  public static async createCampaign(supabase: SupabaseClient<any, "public", any>, campaignData: CampaignInsert) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        organization_id: campaignData.organization_id,
        name: campaignData.name,
        description: campaignData.description || null,
        created_by: campaignData.created_by || null,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`Database error creating campaign: ${error.message}`);
    return data;
  }

  /**
   * Retrieves all campaigns for an organization, including lead counts.
   */
  public static async getCampaigns(supabase: SupabaseClient<any, "public", any>, organizationId: string) {
    // We can fetch campaigns and join on campaign_leads to get counts
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_leads(
          lead:leads(context_summary)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Database error fetching campaigns: ${error.message}`);

    // Map the Supabase count object to a flat number
    return data.map((campaign: any) => ({
      ...campaign,
      lead_count: campaign.campaign_leads[0]?.count || 0,
      campaign_leads: undefined // clean up response
    }));
  }

  /**
   * Retrieves a single campaign with all its associated leads.
   */
  public static async getCampaignById(supabase: SupabaseClient<any, "public", any>, campaignId: string) {
    // Execute campaign details and leads queries concurrently to improve speed
    const [campaignRes, leadsRes] = await Promise.all([
      supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single(),
      supabase
        .from('campaign_leads')
        .select(`
          lead_id,
          added_at,
          leads (*)
        `)
        .eq('campaign_id', campaignId)
        .order('added_at', { ascending: false })
    ]);

    if (campaignRes.error) throw new Error(`Database error fetching campaign: ${campaignRes.error.message}`);
    if (leadsRes.error) throw new Error(`Database error fetching campaign leads: ${leadsRes.error.message}`);

    const campaign = campaignRes.data;
    const leads = leadsRes.data;

    return {
      ...campaign,
      leads: leads.map(cl => ({
        ...cl.leads,
        campaign_added_at: cl.added_at
      }))
    };
  }

  /**
   * Adds a single lead to a campaign.
   */
  public static async addLeadToCampaign(supabase: SupabaseClient<any, "public", any>, campaignId: string, leadId: string) {
    const { data, error } = await supabase
      .from('campaign_leads')
      .insert({
        campaign_id: campaignId,
        lead_id: leadId,
      })
      .select()
      .single();

    if (error) {
      // Ignore unique constraint violations (if lead is already in campaign)
      if (error.code === '23505') {
        return null; 
      }
      throw new Error(`Database error adding lead to campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * Removes a single lead from a campaign.
   */
  public static async removeLeadFromCampaign(supabase: SupabaseClient<any, "public", any>, campaignId: string, leadId: string) {
    const { error } = await supabase
      .from('campaign_leads')
      .delete()
      .match({ campaign_id: campaignId, lead_id: leadId });

    if (error) throw new Error(`Database error removing lead from campaign: ${error.message}`);
    return true;
  }

  /**
   * Archives a campaign.
   */
  public static async archiveCampaign(supabase: SupabaseClient<any, "public", any>, campaignId: string) {
    const { error } = await supabase
      .from('campaigns')
      .update({ status: 'archived' })
      .eq('id', campaignId);

    if (error) throw new Error(`Database error archiving campaign: ${error.message}`);
    return true;
  }
  /**
   * Updates a campaign.
   */
  public static async updateCampaign(supabase: SupabaseClient<any, "public", any>, campaignId: string, updates: any) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw new Error(`Database error updating campaign: ${error.message}`);
    return data;
  }
}
