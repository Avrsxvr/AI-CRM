import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const supabase = await createClient();
    
    let query = supabase
      .from('leads')
      .select(`
        *,
        recordings (id, audio_url, transcript, status),
        card_scans (id, image_url, extracted_fields, confidence),
        followups (id, sequence_position, channel, status, scheduled_for, sent_at, opened_at),
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
    
    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const newLead = {
      ...body,
      organization_id: userData.organization_id,
      captured_by: user.id,
      source: body.source || 'manual',
      status: body.status || 'new',
    };

    const { data, error } = await supabase.from('leads').insert(newLead).select().single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST leads API route:', error);
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('leads').update(updateFields).eq('id', id).select().single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PUT leads API route:', error);
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Lead IDs array is required' }, { status: 400 });
    }

    const { error } = await supabase.from('leads').delete().in('id', ids);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error('Error in DELETE leads API route:', error);
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
