import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: orgUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
      
    if (!orgUser?.organization_id) throw new Error('Organization not found');

    const orgId = orgUser.organization_id;

    // Fetch leads for sentiment and volume
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at, context_summary, status, total_emails_sent, total_emails_opened')
      .eq('organization_id', orgId);

    if (leadsError) throw leadsError;

    // Fetch followups for email stats
    // We need to join with leads to ensure they belong to this org, 
    // but a simpler way is to just get followups where lead_id is in the leads we just fetched.
    const leadIds = leads.map(l => l.id);
    let followups: any[] = [];
    if (leadIds.length > 0) {
      const { data: fData } = await supabase
        .from('followups')
        .select('status, opened_at, lead_id')
        .in('lead_id', leadIds);
      if (fData) followups = fData;
    }

    // --- Data Processing ---

    // 1. Leads by Date (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dateCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateCounts[d.toISOString().split('T')[0]] = 0;
    }

    let positiveSentiment = 0;
    let neutralSentiment = 0;
    let negativeSentiment = 0;
    
    let totalHotLeads = 0;

    leads.forEach((lead: any) => {
      // Date grouping
      const dateStr = new Date(lead.created_at).toISOString().split('T')[0];
      if (dateCounts[dateStr] !== undefined) {
        dateCounts[dateStr]++;
      }

      // Sentiment
      const sentiment = (lead.context_summary?.sentiment || '').toLowerCase();
      if (sentiment.includes('positive') || sentiment.includes('interested') || sentiment.includes('hot')) {
        positiveSentiment++;
      } else if (sentiment.includes('negative') || sentiment.includes('not interested') || sentiment.includes('spam')) {
        negativeSentiment++;
      } else if (sentiment) {
        neutralSentiment++;
      }

      if (lead.context_summary?.is_hot === true) totalHotLeads++;
    });

    const leadsByDate = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      }));

    // 2. Email Stats
    // Sent: count followup rows with sent or opened status (most reliable source)
    const emailsSent = followups.filter((f: any) => ['sent', 'opened'].includes(f.status)).length;

    // Opened: sum total_emails_opened from leads — this is ALWAYS updated by the tracking pixel
    // regardless of whether the followup row gets updated (followups.opened_at is unreliable).
    // Also count unique leads that have any open_count > 0 as a cross-check.
    const emailsOpenedFromLeads = leads.reduce((sum: number, l: any) => sum + (l.total_emails_opened || 0), 0);
    const emailsOpenedFromFollowups = followups.filter((f: any) => f.opened_at != null || f.status === 'opened').length;
    // Use leads as primary source since total_emails_sent column is unreliable (sometimes 0)
    // Unique leads that opened at least one email
    const uniqueLeadsOpened = leads.filter((l: any) => (l.total_emails_opened || 0) > 0).length;
    const emailsOpened = Math.max(emailsOpenedFromLeads, emailsOpenedFromFollowups);
    // Open rate = unique leads that opened / total leads that received at least one email
    const leadsWithSentEmails = leads.filter((l: any) => (l.total_emails_sent || 0) > 0 || followups.some((f: any) => f.lead_id === l.id && ['sent', 'opened'].includes(f.status))).length;
    const openRate = emailsSent > 0 ? Math.round((uniqueLeadsOpened / Math.max(leadsWithSentEmails, 1)) * 100) : 0;

    return NextResponse.json({
      data: {
        totalLeads: leads.length,
        hotLeads: totalHotLeads,
        leadsByDate,
        sentiment: [
          { name: 'Positive', value: positiveSentiment, color: '#10b981' },
          { name: 'Neutral', value: neutralSentiment, color: '#94a3b8' },
          { name: 'Negative', value: negativeSentiment, color: '#ef4444' },
        ],
        emailStats: {
          sent: emailsSent,
          opened: emailsOpened,
          openRate
        }
      },
      error: null
    });
  } catch (error: any) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 });
  }
}
