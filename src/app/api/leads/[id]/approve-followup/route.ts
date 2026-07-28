import { NextRequest, NextResponse } from 'next/server';
import { LeadsRepository } from '@/lib/repositories/leads';
import { ZohoService } from '@/lib/services/zoho';
import { SheetsService } from '@/lib/services/sheets';
import { SchedulerAgent } from '@/lib/agents/scheduler';
import { EmailService } from '@/lib/services/email';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { subject, body: emailBody } = body;

    if (!subject || !emailBody) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required parameters: subject or body',
          },
        },
        { status: 400 }
      );
    }

    // 1. Fetch the current lead details from the database
    const lead = await LeadsRepository.getLeadById(id);
    if (!lead) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: `Lead with ID ${id} not found.`,
          },
        },
        { status: 404 }
      );
    }

    const contactFields = lead.contact_fields || {};
    const contextSummary = lead.context_summary || {};

    // Format CRM record notes/description
    const crmDescription = `
--- MEETING TRANSCRIPT SUMMARY ---
Stated Problem: ${contextSummary.problem || 'Not specified'}
Expressed Needs: ${contextSummary.needs || 'Not specified'}
Verbatim Quotes: ${contextSummary.notable_quotes?.join(' | ') || 'None'}
Sentiment: ${contextSummary.sentiment || 'Neutral'}

--- APPROVED FIRST FOLLOWUP EMAIL ---
Subject: ${subject}

${emailBody}
`.trim();

    const crmPayload = {
      firstName: contactFields.name || '',
      lastName: '', // mapped automatically inside ZohoService
      email: contactFields.email || '',
      phone: contactFields.phone || '',
      company: contactFields.company || 'Unknown',
      title: contactFields.title || '',
      description: crmDescription,
    };

    let syncedTo: 'zoho' | 'sheets' | 'none' = 'none';
    let crmRecordId = '';
    let syncError: string | undefined = undefined;

    // 2. Try Zoho CRM sync
    try {
      const zohoResult = await ZohoService.createLead(crmPayload);
      crmRecordId = zohoResult.crmRecordId;
      syncedTo = 'zoho';
      await LeadsRepository.logCrmSyncAttempt(id, 'zoho', 'success');
    } catch (zohoError: any) {
      console.warn('Zoho CRM sync failed. Details:', zohoError);
      syncError = zohoError.message || String(zohoError);
      await LeadsRepository.logCrmSyncAttempt(id, 'zoho', 'failed', syncError);
      
      // 3. Fallback to Google Sheets
      try {
        const sheetPayload = {
          ...crmPayload,
          leadId: id,
        };
        const sheetResult = await SheetsService.appendLead(sheetPayload);
        crmRecordId = sheetResult.crmRecordId;
        syncedTo = 'sheets';
        await LeadsRepository.logCrmSyncAttempt(id, 'sheets', 'success');
      } catch (sheetError: any) {
        console.error('Google Sheets fallback also failed. Details:', sheetError);
        await LeadsRepository.logCrmSyncAttempt(
          id,
          'sheets',
          'failed',
          sheetError.message || String(sheetError)
        );
      }
    }

    // 4. Update lead record and trigger scheduling on success
    if (syncedTo !== 'none') {
      // Mark lead as synced and record the sync location
      await LeadsRepository.markAsSynced(id, crmRecordId);

      // Queue the follow-up sequences (1-hour follow-up + bi-weekly drip)
      try {
        // Generate base app URL dynamically from request headers for seamless localhost/Vercel tracking
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const dynamicAppUrl = `${protocol}://${host}`;

        // Send the first email immediately instead of waiting for the cron job
        await EmailService.sendEmail(contactFields.email || 'avrsmain@gmail.com', subject, emailBody, id, 1, dynamicAppUrl);
        
        // Queue the remaining bi-weekly drip sequence starting at touch 2
        await SchedulerAgent.scheduleSequence(id, { subject, body: emailBody });
        await LeadsRepository.updateStatus(id, 'synced'); // Ensure status is correctly tracked
      } catch (schedError) {
        console.error('Sequence scheduling failed:', schedError);
        // Do not fail the request if scheduling fails, but log it
      }

      return NextResponse.json({
        data: {
          leadId: id,
          syncedTo,
          crmRecordId,
        },
        error: null,
      });
    } else {
      // Both channels failed, flag lead as needs manual review
      await LeadsRepository.updateStatus(id, 'needs_attention');
      
      return NextResponse.json(
        {
          data: {
            leadId: id,
            syncedTo: 'none',
          },
          error: {
            code: 'CRM_SYNC_FAILED',
            message: `CRM Sync failed for both Zoho and Google Sheets. Details: ${syncError}`,
          },
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Error in approve-followup API route:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'APPROVE_FOLLOWUP_FAILED',
          message: error.message || 'An error occurred during draft approval and sync.',
        },
      },
      { status: 500 }
    );
  }
}
