import { supabaseAdmin } from '@/lib/supabase';
import { Client } from '@upstash/qstash';

const qstashClient = process.env.QSTASH_TOKEN 
  ? new Client({ token: process.env.QSTASH_TOKEN })
  : null;

export interface EnqueueOptions {
  organizationId: string;
  leadId: string;
  followupId?: string;
  scheduledFor?: Date;
}

export class QueueService {
  /**
   * Adds a job to the email queue and pushes to Upstash QStash if configured.
   */
  public static async enqueue(options: EnqueueOptions) {
    const { data, error } = await supabaseAdmin
      .from('email_queue')
      .insert({
        organization_id: options.organizationId,
        lead_id: options.leadId,
        followup_id: options.followupId || null,
        scheduled_for: options.scheduledFor ? options.scheduledFor.toISOString() : new Date().toISOString(),
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to enqueue job:', error);
      throw new Error(`Queue enqueue error: ${error.message}`);
    }

    if (qstashClient && process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const delaySeconds = options.scheduledFor 
          ? Math.max(0, Math.floor((options.scheduledFor.getTime() - Date.now()) / 1000))
          : 0;

        await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/process-followups`,
          body: { jobId: data.id },
          delay: delaySeconds > 0 ? delaySeconds : undefined,
        });
      } catch (qstashError) {
        console.error('Failed to publish to QStash:', qstashError);
        // Do not throw; gracefully fallback to Postgres queue processing via standard Cron
      }
    }

    return data;
  }

  /**
   * Polls the queue for pending jobs, locking them to prevent concurrent processing.
   */
  public static async pollPendingJobs(limit: number = 20) {
    // We use a Postgres CTE (Common Table Expression) via RPC or just an update lock if possible.
    // Supabase JS doesn't support raw CTE updates natively, so we fetch then lock (optimistic locking).
    // In a high concurrency environment, we should write an RPC function. For now, this suffices.
    
    const now = new Date().toISOString();
    
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('email_queue')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_for', now)
      .is('locked_at', null)
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('Queue poll error:', fetchError);
      return [];
    }

    if (!jobs || jobs.length === 0) return [];

    const jobIds = jobs.map(j => j.id);

    // Lock the fetched jobs
    const { data: lockedJobs, error: lockError } = await supabaseAdmin
      .from('email_queue')
      .update({ 
        status: 'processing', 
        locked_at: now,
        updated_at: now 
      })
      .in('id', jobIds)
      .select();

    if (lockError) {
      console.error('Queue lock error:', lockError);
      return [];
    }

    return lockedJobs || [];
  }

  /**
   * Marks a job as completed.
   */
  public static async completeJob(jobId: string) {
    await supabaseAdmin
      .from('email_queue')
      .update({
        status: 'completed',
        locked_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  /**
   * Fails a job, scheduling a retry if max_retries hasn't been reached.
   */
  public static async failJob(jobId: string, currentRetryCount: number, maxRetries: number, errorMessage: string) {
    const nextRetryCount = currentRetryCount + 1;
    const shouldRetry = nextRetryCount < maxRetries;
    
    // Exponential backoff for retry: 5 mins, 15 mins, 60 mins...
    const backoffMinutes = shouldRetry ? Math.pow(3, nextRetryCount) * 5 : 0;
    const nextScheduledFor = new Date(Date.now() + backoffMinutes * 60000).toISOString();

    await supabaseAdmin
      .from('email_queue')
      .update({
        status: shouldRetry ? 'queued' : 'failed',
        retry_count: nextRetryCount,
        error_log: errorMessage,
        locked_at: null,
        scheduled_for: shouldRetry ? nextScheduledFor : new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}
