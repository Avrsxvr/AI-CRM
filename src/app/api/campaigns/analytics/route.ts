import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { getCurrentUserOrgId } from '@/lib/auth';
import { SettingsService } from '@/lib/services/settings';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await SettingsService.getSettings(orgId);
    const apiKey = settings.gemini_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured for this organization.' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Fetch leads and their context for this campaign
    const { data: campaignLeads, error: clError } = await supabase
      .from('campaign_leads')
      .select('lead_id')
      .eq('campaign_id', campaignId);

    if (clError || !campaignLeads || campaignLeads.length === 0) {
      return NextResponse.json({ data: { insights: "No leads found for this campaign.", metrics: null } });
    }

    const leadIds = campaignLeads.map(cl => cl.lead_id);

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, context_summary, score, contact_fields, total_emails_sent, total_emails_opened')
      .in('id', leadIds);

    if (leadsError) throw leadsError;

    // Compile macro data
    let totalSent = 0;
    let totalOpened = 0;
    let highIntentCount = 0;
    const problems = [];
    const titles = [];

    for (const lead of leads) {
      totalSent += lead.total_emails_sent || 0;
      totalOpened += lead.total_emails_opened || 0;
      if (lead.score && lead.score > 70) highIntentCount++;
      if (lead.context_summary?.problem) problems.push(lead.context_summary.problem);
      if (lead.contact_fields?.title) titles.push(lead.contact_fields.title);
    }

    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: 'You are an elite Marketing Operations AI. Analyze the provided campaign data and generate actionable insights.',
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            summary: { type: SchemaType.STRING, description: "A one paragraph summary of campaign health." },
            top_pain_point: { type: SchemaType.STRING, description: "The most common problem/pain point." },
            best_target_persona: { type: SchemaType.STRING, description: "The job title responding best to this campaign." },
            recommendations: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "3 highly actionable recommendations to improve conversion.",
            }
          },
          required: ["summary", "top_pain_point", "best_target_persona", "recommendations"]
        }
      }
    });

    const payload = JSON.stringify({
      metrics: { totalLeads: leads.length, totalSent, totalOpened, openRate, highIntentCount },
      sample_problems: problems.slice(0, 10),
      sample_titles: titles.slice(0, 10),
    });

    const prompt = `Analyze this campaign data:\n${payload}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const insights = JSON.parse(text);

    return NextResponse.json({
      data: {
        metrics: { totalLeads: leads.length, totalSent, totalOpened, openRate, highIntentCount },
        insights
      },
      error: null
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
