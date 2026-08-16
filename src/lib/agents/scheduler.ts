import { supabaseAdmin } from '@/lib/supabase';
import { QueueService } from '@/lib/services/queue';

export class SchedulerAgent {
  /**
   * Schedules the initial email for the adaptive sequence (E1 S1).
   * Inserts the queue row into 'followups' and registers it with the email_queue.
   */
  public static async scheduleSequence(
    leadId: string,
    firstTouch?: { subject: string; body: string }
  ): Promise<void> {
    const now = Date.now();

    // 1. Fetch organization ID to place into the queue
    const { data: lead } = await supabaseAdmin.from('leads').select('organization_id').eq('id', leadId).single();
    if (!lead) throw new Error('Lead not found when scheduling sequence.');

    // 2. First follow-up (E1 S1): Sent immediately if firstTouch is provided, otherwise queued for 1 hour
    const followup = {
      lead_id: leadId,
      sequence_position: 1,
      channel: 'email',
      status: firstTouch ? 'sent' : 'queued',
      sent_at: firstTouch ? new Date(now).toISOString() : null,
      subject: firstTouch?.subject || null,
      body: firstTouch?.body || null,
      scheduled_for: new Date(now + (firstTouch ? 0 : 60 * 60 * 1000)).toISOString(),
    };

    const { data: insertedFollowup, error } = await supabaseAdmin
      .from('followups')
      .insert([followup])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to schedule initial sequence: ${error.message}`);
    }

    // 3. Register the followup in the robust email_queue if it's pending
    if (!firstTouch) {
      await QueueService.enqueue({
        organizationId: lead.organization_id,
        leadId,
        followupId: insertedFollowup.id,
        scheduledFor: new Date(followup.scheduled_for),
      });
    }
  }
}
