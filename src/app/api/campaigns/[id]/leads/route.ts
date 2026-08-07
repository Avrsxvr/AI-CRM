import { NextRequest, NextResponse } from 'next/server';
import { CampaignsRepository } from '@/lib/repositories/campaigns';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const body = await req.json();
    const { lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { data: null, error: { message: 'lead_id is required' } },
        { status: 400 }
      );
    }

    await CampaignsRepository.addLeadToCampaign(campaignId, lead_id);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error(`Failed to add lead to campaign:`, error);
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
    // We expect lead_id in the URL search params: ?lead_id=123
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('lead_id');

    if (!leadId) {
       return NextResponse.json(
        { data: null, error: { message: 'lead_id is required as a query parameter' } },
        { status: 400 }
      );
    }

    await CampaignsRepository.removeLeadFromCampaign(campaignId, leadId);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error(`Failed to remove lead from campaign:`, error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}
