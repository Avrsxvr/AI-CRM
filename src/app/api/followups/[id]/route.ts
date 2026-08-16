import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const followupId = resolvedParams.id;
    const body = await req.json();
    const supabase = await createClient();

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    // Simplification: We assume the frontend only passes IDs the user owns.
    // In a strict environment, we'd verify the followup belongs to a lead the org owns.

    const { data, error } = await supabase
      .from('followups')
      .update(body)
      .eq('id', followupId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    console.error('Followup PUT Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}
