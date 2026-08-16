import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, name, role, avatar_url')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data: profile, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { name, password } = await req.json();

    // Update name in users table
    if (name !== undefined) {
      const { error: dbError } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id);
      if (dbError) throw dbError;
    }

    // Update password in Auth if provided
    if (password) {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error: any) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}
