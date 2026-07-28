import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/services/email';
import { SequencePersonalizationAgent } from '@/lib/agents/sequencePersonalization';
import { FollowupDraftAgent } from '@/lib/agents/followupDraft';
import { ZohoService } from '@/lib/services/zoho';

export async function GET(req: NextRequest) {
  // Enforce CRON security check (check header or secret key to prevent unauthorized GET trigger)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Cron authentication failed.' } },
      { status: 401 }
    );
  }

  try {
    const now = new Date().toISOString();

    // 1. Fetch all followups that are due for delivery
    const { data: dueFollowups, error: fetchError } = await supabaseAdmin
      .from('followups')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_for', now);

    if (fetchError) {
      throw new Error(`Database error fetching due followups: ${fetchError.message}`);
    }

    if (!dueFollowups || dueFollowups.length === 0) {
      return NextResponse.json({
        data: { processed: 0, successes: 0, failures: 0 },
        error: null,
      });
    }

    let successes = 0;
    let failures = 0;

    for (const followup of dueFollowups) {
      // 2. Lock record by changing status to 'sending' to prevent duplicate cron runs from catching it
      await supabaseAdmin
        .from('followups')
        .update({ status: 'sending' })
        .eq('id', followup.id);

      try {
        // 3. Fetch lead details
        const { data: lead, error: leadError } = await supabaseAdmin
          .from('leads')
          .select('*')
          .eq('id', followup.lead_id)
          .single();

        if (leadError || !lead) {
          throw new Error(`Failed to retrieve associated lead record: ${leadError?.message || 'Lead not found'}`);
        }

        const contactFields = lead.contact_fields || {};
        const email = contactFields.email;

        if (!email) {
          // No email to send to, skip
          await supabaseAdmin
            .from('followups')
            .update({ status: 'skipped' })
            .eq('id', followup.id);
          successes++;
          continue;
        }

        let subject = '';
        let body = '';

        if (followup.sequence_position === 1) {
          // Position 1: Send the approved email text stored in followups table
          if (followup.subject && followup.body) {
            subject = followup.subject;
            body = followup.body;
          } else {
            // Fallback generation if approved draft is missing
            const context = lead.context_summary || {};
            const draft = await FollowupDraftAgent.generateDraft(
              {
                name: contactFields.name,
                company: contactFields.company,
                title: contactFields.title,
              },
              {
                problem: context.problem || null,
                needs: context.needs || null,
                action_items: context.action_items || [],
                notable_quotes: context.notable_quotes || [],
              },
              'Sales Team'
            );
            subject = draft.subject;
            body = draft.body;
          }
        } else {
          // Positions 2-6: Dynamic personalization based on touch templates
          const leadDetails = {
            name: contactFields.name,
            company: contactFields.company,
            title: contactFields.title,
            context_summary: lead.context_summary,
          };
          const personalizedTouch = await SequencePersonalizationAgent.personalizeTouch(
            leadDetails,
            followup.sequence_position,
            'Sales Team'
          );
          subject = personalizedTouch.subject;
          body = personalizedTouch.body;
        }

        // Generate base app URL dynamically from request headers for seamless localhost/Vercel tracking
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const dynamicAppUrl = `${protocol}://${host}`;

        // 4. Send Email
        await EmailService.sendEmail(email, subject, body, followup.lead_id, followup.sequence_position, dynamicAppUrl);

        // 5. Update followup to 'sent' and log actual content sent
        await supabaseAdmin
          .from('followups')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            subject,
            body,
          })
          .eq('id', followup.id);

        // 6. Update Zoho CRM Lead Status & Add Note (if synced to Zoho)
        if (lead.crm_record_id && !lead.crm_record_id.startsWith('sheets:')) {
          try {
            const currentProblem = lead.context_summary?.problem || 'Not specified';
            const currentNeeds = lead.context_summary?.needs || 'Not specified';
            const baseDescription = `Prospect captured from Trade Show recording. Problem: ${currentProblem}. Needs: ${currentNeeds}`;
            
            await ZohoService.updateLead(lead.crm_record_id, {
              Lead_Status: 'Attempted to Contact',
              Description: `${baseDescription}\n\n[System Log] Touch ${followup.sequence_position} follow-up email sent on ${new Date().toLocaleString()}.`
            });

            await ZohoService.addNote(
              lead.crm_record_id,
              `Follow-up Touch ${followup.sequence_position} Sent`,
              `Subject: ${subject}\n\nSent at: ${new Date().toLocaleString()}\n\nBody:\n${body}`
            );
          } catch (zohoErr) {
            console.error('Failed to sync email dispatch note/status to Zoho CRM:', zohoErr);
          }
        }

        successes++;
      } catch (fError: any) {
        console.error(`Error processing followup ID ${followup.id}:`, fError);
        failures++;

        // Update status to failed
        await supabaseAdmin
          .from('followups')
          .update({ status: 'send_failed' })
          .eq('id', followup.id);
      }
    }

    return NextResponse.json({
      data: {
        processed: dueFollowups.length,
        successes,
        failures,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Error running cron processor:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'CRON_EXECUTION_FAILED',
          message: error.message || 'An error occurred during queue processing.',
        },
      },
      { status: 500 }
    );
  }
}
