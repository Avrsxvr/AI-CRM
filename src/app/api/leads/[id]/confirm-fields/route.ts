import { NextRequest, NextResponse } from 'next/server';
import { LeadsRepository } from '@/lib/repositories/leads';
import { FollowupDraftAgent } from '@/lib/agents/followupDraft';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { contactFields, senderName } = body;

    if (!contactFields) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required parameter: contactFields',
          },
        },
        { status: 400 }
      );
    }

    // 1. Update the contact fields in the database
    const updatedLead = await LeadsRepository.updateContactFields(id, contactFields, 'confirmed');

    // 2. Extract conversation context from database lead record
    const context = updatedLead.context_summary || {};
    const contextDetails = {
      problem: context.problem || null,
      needs: context.needs || null,
      action_items: context.action_items || [],
      notable_quotes: context.notable_quotes || [],
    };

    // 3. Generate Follow-up Draft
    const emailDetails = {
      name: contactFields.name || null,
      company: contactFields.company || null,
      title: contactFields.title || null,
    };

    const draft = await FollowupDraftAgent.generateDraft(
      emailDetails,
      contextDetails,
      senderName || 'Sales Representative'
    );

    return NextResponse.json({
      data: {
        lead: updatedLead,
        draft,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Error confirming lead fields or generating draft:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'CONFIRMATION_FAILED',
          message: error.message || 'An error occurred during fields confirmation.',
        },
      },
      { status: 500 }
    );
  }
}
