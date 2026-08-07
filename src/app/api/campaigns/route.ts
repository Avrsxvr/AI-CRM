import { NextRequest, NextResponse } from 'next/server';
import { CampaignsRepository } from '@/lib/repositories/campaigns';

// MOCK ORG ID FOR DEVELOPMENT (Replace with auth context in SaaS)
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000000';

export async function GET(req: NextRequest) {
  try {
    const campaigns = await CampaignsRepository.getCampaigns(MOCK_ORG_ID);
    return NextResponse.json({ data: campaigns, error: null });
  } catch (error: any) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { data: null, error: { message: 'Campaign name is required' } },
        { status: 400 }
      );
    }

    const campaign = await CampaignsRepository.createCampaign({
      organization_id: MOCK_ORG_ID,
      name,
      description
    });

    return NextResponse.json({ data: campaign, error: null });
  } catch (error: any) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { data: null, error: { message: error.message } },
      { status: 500 }
    );
  }
}
