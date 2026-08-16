import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: orgUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    if (!orgUser?.organization_id) throw new Error('Organization not found');

    const orgId = orgUser.organization_id;

    // Fetch followups for this organization
    // Since followups don't have org_id directly, we join through leads
    const { data: followups, error } = await supabase
      .from('followups')
      .select(`
        *,
        lead:leads!inner (
          id,
          organization_id,
          contact_fields,
          campaign_id,
          campaigns (
            name
          )
        )
      `)
      .eq('leads.organization_id', orgId)
      .order('scheduled_for', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: followups, error: null });
  } catch (error: any) {
    console.error('Followups GET Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}
