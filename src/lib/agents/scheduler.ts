import { supabaseAdmin } from '@/lib/supabase';

export class SchedulerAgent {
  /**
   * Schedules the 1-hour follow-up and a bi-weekly drip sequence of 5 additional nurture touches.
   * Inserts the queue rows directly into the 'followups' table.
   */
  public static async scheduleSequence(
    leadId: string,
    firstTouch?: { subject: string; body: string }
  ): Promise<void> {
    const followups = [];
    const now = Date.now();

    // 1. First follow-up: Sent immediately if firstTouch is provided, otherwise queued
    followups.push({
      lead_id: leadId,
      sequence_position: 1,
      channel: 'email',
      status: firstTouch ? 'sent' : 'queued',
      sent_at: firstTouch ? new Date(now).toISOString() : null,
      subject: firstTouch?.subject || null,
      body: firstTouch?.body || null,
      scheduled_for: new Date(now + (firstTouch ? 0 : 60 * 60 * 1000)).toISOString(), // 1 hour if queued, now if sent immediately
    });

    // 2. Drip sequence: 5 bi-weekly touches (e.g. Days 14, 28, 42, 56, 70)
    for (let pos = 2; pos <= 6; pos++) {
      const daysOffset = (pos - 1) * 14;
      const scheduledTime = now + daysOffset * 24 * 60 * 60 * 1000;
      
      followups.push({
        lead_id: leadId,
        sequence_position: pos,
        channel: 'email',
        status: 'queued',
        scheduled_for: new Date(scheduledTime).toISOString(),
      });
    }

    const { error } = await supabaseAdmin
      .from('followups')
      .insert(followups);

    if (error) {
      throw new Error(`Failed to schedule drip sequence: ${error.message}`);
    }
  }
}
