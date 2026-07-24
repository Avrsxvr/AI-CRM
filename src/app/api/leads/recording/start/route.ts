import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId, userId } = body;

    if (!organizationId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required parameter: organizationId',
          },
        },
        { status: 400 }
      );
    }

    // Insert a new lead record in 'capturing' state
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        organization_id: organizationId,
        captured_by: userId || null,
        status: 'capturing',
        contact_fields: {},
        context_summary: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to initialize lead in database: ${error.message}`);
    }

    return NextResponse.json({
      data: {
        leadId: lead.id,
        status: lead.status,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Error starting recording session:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'START_RECORDING_FAILED',
          message: error.message || 'An error occurred while starting the recording session.',
        },
      },
      { status: 500 }
    );
  }
}
