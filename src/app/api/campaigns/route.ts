import { NextRequest, NextResponse } from 'next/server';
import { CampaignsRepository } from '@/lib/repositories/campaigns';
import { getCurrentUserOrgId } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ data: null, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createClient();
    const campaigns = await CampaignsRepository.getCampaigns(supabase, orgId);
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
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ data: null, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { data: null, error: { message: 'Campaign name is required' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const campaign = await CampaignsRepository.createCampaign(supabase, {
      organization_id: orgId,
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
