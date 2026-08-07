import { NextRequest, NextResponse } from 'next/server';
import { CampaignsRepository } from '@/lib/repositories/campaigns';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const campaign = await CampaignsRepository.getCampaignById(campaignId);

    // Get analytics for this campaign (Emails sent vs opened)
    // We query the followups table for leads that are in this campaign
    const leadIds = campaign.leads.map((l: any) => l.id);
    
    let analytics = { sent: 0, opened: 0 };
    if (leadIds.length > 0) {
      // Get all followups for these leads
      const { data: followups } = await supabaseAdmin
        .from('followups')
        .select('status, opened') // assuming we added 'opened' or track it
        .in('lead_id', leadIds);

      if (followups) {
        analytics.sent = followups.filter(f => f.status === 'sent').length;
        // If we don't have an opened column yet, we just default to 0 for now until tracking is fully hooked up
        analytics.opened = followups.filter(f => f.opened === true).length || 0; 
      }
    }

    return NextResponse.json({ 
      data: {
        ...campaign,
        analytics
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    await CampaignsRepository.archiveCampaign(campaignId);
    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error(`Failed to archive campaign:`, error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}
