import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // PostgreSQL ON DELETE CASCADE will automatically clean up associated recordings, 
    // card scans, followups, and crm sync logs.
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error deleting lead: ${error.message}`);
    }

    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'DELETE_FAILED',
          message: error.message || 'An error occurred during deletion.',
        },
      },
      { status: 500 }
    );
  }
}
