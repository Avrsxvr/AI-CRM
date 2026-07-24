import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        recordings (id, audio_url, transcript, status),
        card_scans (id, image_url, extracted_fields, confidence),
        followups (id, sequence_position, channel, status, scheduled_for, sent_at),
        crm_sync_log (id, target_system, status, error_message, synced_at)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: leads, error } = await query;

    if (error) {
      throw new Error(`Database error fetching leads: ${error.message}`);
    }

    return NextResponse.json({
      data: leads || [],
      error: null,
    });
  } catch (error: any) {
    console.error('Error in GET leads API route:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'FETCH_LEADS_FAILED',
          message: error.message || 'An error occurred while fetching leads.',
        },
      },
      { status: 500 }
    );
  }
}
