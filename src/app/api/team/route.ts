import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: orgUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    if (!orgUser?.organization_id) throw new Error('Organization not found');

    const { data: teamMembers, error } = await supabase
      .from('users')
      .select('id, email, name, role, avatar_url, created_at')
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: teamMembers, error: null });
  } catch (error: any) {
    console.error('Team GET Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: orgUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!orgUser?.organization_id) throw new Error('Organization not found');
    if (orgUser.role !== 'admin' && orgUser.role !== 'superadmin') {
      throw new Error('Only admins can invite members');
    }

    const { email, role } = await req.json();
    if (!email) throw new Error('Email is required');

    // Create a service role client to invite the user
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Invite the user via Supabase Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        role: role || 'member',
        organization_id: orgUser.organization_id
      }
    });

    if (inviteError) throw inviteError;

    // The database trigger should automatically handle inserting them into the `users` table
    // But since they might already exist or the trigger handles it, we can just return success.
    // Wait, the trigger 'on_auth_user_created' might create a new organization if we aren't careful.
    // We passed `organization_id` in raw_user_meta_data. We need to make sure the trigger handles this correctly.
    // Alternatively, if the trigger doesn't, we can explicitly update the users table after they accept, or right now.
    // Let's explicitly insert/update the user record using service role just in case.

    if (inviteData.user) {
      await supabaseAdmin.from('users').upsert({
        id: inviteData.user.id,
        email: email,
        role: role || 'member',
        organization_id: orgUser.organization_id
      }, { onConflict: 'id' });
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error('Team POST Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}
