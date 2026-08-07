import { supabaseAdmin } from '@/lib/supabase';

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
  public static async createCampaign(campaignData: CampaignInsert) {
    const { data, error } = await supabaseAdmin
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

    if (error) {
      throw new Error(`Database error creating campaign: ${error.message}`);
    }

    return data;
  }

  /**
   * Retrieves all campaigns for an organization, including lead counts.
   */
  public static async getCampaigns(organizationId: string) {
    // We can fetch campaigns and join on campaign_leads to get counts
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        campaign_leads(count)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching campaigns: ${error.message}`);
    }

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
  public static async getCampaignById(campaignId: string) {
    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      throw new Error(`Database error fetching campaign: ${campaignError.message}`);
    }

    // 2. Get the leads in this campaign (Joining campaign_leads with leads)
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('campaign_leads')
      .select(`
        lead_id,
        added_at,
        leads (*)
      `)
      .eq('campaign_id', campaignId)
      .order('added_at', { ascending: false });

    if (leadsError) {
      throw new Error(`Database error fetching campaign leads: ${leadsError.message}`);
    }

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
  public static async addLeadToCampaign(campaignId: string, leadId: string) {
    const { data, error } = await supabaseAdmin
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
  public static async removeLeadFromCampaign(campaignId: string, leadId: string) {
    const { error } = await supabaseAdmin
      .from('campaign_leads')
      .delete()
      .match({ campaign_id: campaignId, lead_id: leadId });

    if (error) {
      throw new Error(`Database error removing lead from campaign: ${error.message}`);
    }
    return true;
  }

  /**
   * Archives a campaign.
   */
  public static async archiveCampaign(campaignId: string) {
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'archived' })
      .eq('id', campaignId);

    if (error) {
      throw new Error(`Database error archiving campaign: ${error.message}`);
    }
    return true;
  }
}
