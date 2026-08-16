import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;
    const body = await req.json();
    const supabase = await createClient();

    // Verify ownership/admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: orgUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!orgUser?.organization_id) throw new Error('Organization not found');
    if (orgUser.role !== 'admin' && orgUser.role !== 'superadmin') {
      throw new Error('Only admins can modify roles');
    }

    // Verify target user is in same org
    const { data: targetUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', targetUserId)
      .single();
      
    if (targetUser?.organization_id !== orgUser.organization_id) {
      throw new Error('User not found in your organization');
    }

    // Use admin client to bypass RLS if necessary, though normal client might work if RLS allows admins to update
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: body.role })
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    console.error('Team PUT Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const targetUserId = resolvedParams.id;
    const supabase = await createClient();

    // Verify ownership/admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: orgUser } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!orgUser?.organization_id) throw new Error('Organization not found');
    if (orgUser.role !== 'admin' && orgUser.role !== 'superadmin') {
      throw new Error('Only admins can remove members');
    }

    const { data: targetUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', targetUserId)
      .single();
      
    if (targetUser?.organization_id !== orgUser.organization_id) {
      throw new Error('User not found in your organization');
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete from users table (auth user might still exist, but we remove them from the org by deleting the record or nullifying org_id)
    // Deleting auth user completely is safer if they are tied to this org strictly.
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authError) throw authError;
    
    // The cascade delete should remove them from 'users' table, but just in case:
    await supabaseAdmin.from('users').delete().eq('id', targetUserId);

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error('Team DELETE Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}
