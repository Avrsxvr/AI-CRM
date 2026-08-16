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
      .select('id, created_at, context_summary, status')
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
        .select('status, opened')
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

      if (lead.status === 'hot') totalHotLeads++;
    });

    const leadsByDate = Object.entries(dateCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      }));

    // 2. Email Stats
    const emailsSent = followups.filter((f: any) => f.status === 'sent').length;
    const emailsOpened = followups.filter((f: any) => f.opened === true).length;
    const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;

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
