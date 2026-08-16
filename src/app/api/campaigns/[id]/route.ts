import { NextRequest, NextResponse } from 'next/server';
import { CampaignsRepository } from '@/lib/repositories/campaigns';
import { createClient } from '@/utils/supabase/server';
import { ZohoCampaignsService } from '@/lib/services/zohoCampaigns';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const supabase = await createClient();
    const campaign = await CampaignsRepository.getCampaignById(supabase, campaignId);

    // Get analytics for this campaign (Emails sent vs opened)
    // We query the followups table for leads that are in this campaign
    const leadIds = campaign.leads.map((l: any) => l.id);
    
    let analytics = { sent: 0, opened: 0, openDetails: [] as any[] };
    if (leadIds.length > 0) {
      // Get all followups for these leads, joining with leads to get contact profile
      const { data: followups } = await supabase
        .from('followups')
        .select(`
          status,
          opened,
          opened_at,
          sent_at,
          sequence_position,
          subject,
          leads (
            contact_fields
          )
        `)
        .in('lead_id', leadIds);

      if (followups) {
        analytics.sent = followups.filter(f => f.status === 'sent').length;
        const openedFollowups = followups.filter(f => f.opened === true);
        analytics.opened = openedFollowups.length;

        analytics.openDetails = openedFollowups.map(f => {
          const leadContact = (f.leads as any)?.contact_fields || {};
          return {
            leadName: leadContact.name || 'Unknown Prospect',
            leadEmail: leadContact.email || 'No Email',
            leadCompany: leadContact.company || 'No Company',
            subject: f.subject || `Follow-up #${f.sequence_position}`,
            sequencePosition: f.sequence_position,
            openedAt: f.opened_at || f.sent_at || new Date().toISOString()
          };
        }).sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      }
    }

    // Fetch real metrics from Zoho Campaigns API
    const zohoAnalytics = await ZohoCampaignsService.fetchCampaignAnalytics(campaign.name);

    let zohoOpens: any[] = [];
    let zohoClicks: any[] = [];

    if (zohoAnalytics?.campaignKey) {
      const [opens, clicks] = await Promise.all([
        ZohoCampaignsService.fetchCampaignRecipients(zohoAnalytics.campaignKey, 'open'),
        ZohoCampaignsService.fetchCampaignRecipients(zohoAnalytics.campaignKey, 'click')
      ]);
      zohoOpens = opens;
      zohoClicks = clicks;
    }

    const zohoAnalyticsByEmail: Record<string, any> = {};

    const processRecipients = (recipients: any[], type: 'open' | 'click') => {
      if (!Array.isArray(recipients)) return;
      recipients.forEach(r => {
        const email = (r.contact_email || r.email || '').toLowerCase();
        if (!email) return;

        if (!zohoAnalyticsByEmail[email]) {
          zohoAnalyticsByEmail[email] = { opens: 0, lastOpenTime: null, openDetails: [], clicks: 0, lastClickTime: null, clickDetails: [] };
        }

        if (type === 'open') {
          zohoAnalyticsByEmail[email].opens += r.open_count ? parseInt(r.open_count, 10) : 1;
          zohoAnalyticsByEmail[email].lastOpenTime = r.open_time || r.activity_time || zohoAnalyticsByEmail[email].lastOpenTime;
          zohoAnalyticsByEmail[email].openDetails.push(r);
        } else {
          zohoAnalyticsByEmail[email].clicks += r.click_count ? parseInt(r.click_count, 10) : 1;
          zohoAnalyticsByEmail[email].lastClickTime = r.click_time || r.activity_time || zohoAnalyticsByEmail[email].lastClickTime;
          zohoAnalyticsByEmail[email].clickDetails.push(r);
        }
      });
    };

    processRecipients(zohoOpens, 'open');
    processRecipients(zohoClicks, 'click');

    // Attach to campaign leads
    campaign.leads = campaign.leads.map((lead: any) => {
      const email = lead.contact_fields?.email?.toLowerCase();
      if (email && zohoAnalyticsByEmail[email]) {
        return {
          ...lead,
          zoho_analytics: zohoAnalyticsByEmail[email]
        };
      }
      return lead;
    });

    // Merge logic: Prefer Zoho Campaigns data for aggregate stats, fallback to local DB if Zoho fails/empty
    const mergedAnalytics = {
      ...analytics,
      totalLeads: leadIds.length,
      contacted: zohoAnalytics ? Math.max(zohoAnalytics.totalSent, analytics.sent) : analytics.sent,
      hotLeads: zohoAnalytics ? Math.max(zohoAnalytics.totalOpened, analytics.opened) : analytics.opened,
      openRate: zohoAnalytics ? zohoAnalytics.openRate : (analytics.sent > 0 ? Math.round((analytics.opened / analytics.sent) * 100) : 0),
      conversionRate: 0,
    };

    return NextResponse.json({ 
      data: {
        ...campaign,
        analytics: mergedAnalytics
      }, 
      error: null 
    });
  } catch (error: any) {
    console.error(`Failed to fetch campaign:`, error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const body = await req.json();
    const supabase = await createClient();
    const updatedCampaign = await CampaignsRepository.updateCampaign(supabase, campaignId, body);
    return NextResponse.json({ data: updatedCampaign, error: null });
  } catch (error: any) {
    console.error(`Failed to update campaign:`, error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const supabase = await createClient();
    await CampaignsRepository.archiveCampaign(supabase, campaignId);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error(`Failed to archive campaign:`, error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}
