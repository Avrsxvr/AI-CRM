import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ZohoService } from '@/lib/services/zoho';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const touch = searchParams.get('touch') || 'unknown';

    // 1. Fetch the lead record
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('context_summary, crm_record_id')
      .eq('id', id)
      .single();

    if (!fetchError && lead) {
      const contextSummary = lead.context_summary || {};
      
      // Update open stats in JSONB
      const currentOpens = typeof contextSummary.open_count === 'number' ? contextSummary.open_count : 0;
      const newOpens = currentOpens + 1;
      
      const emailOpens = contextSummary.email_opens || {};
      emailOpens[touch] = (emailOpens[touch] || 0) + 1;

      // Determine if lead is "HOT" based on multiple email opens
      const isHot = newOpens >= 2;

      const updatedContext = {
        ...contextSummary,
        open_count: newOpens,
        email_opens: emailOpens,
        is_hot: isHot,
      };

      // Save back to DB
      await supabaseAdmin
        .from('leads')
        .update({ context_summary: updatedContext })
        .eq('id', id);

      // Sync open tracking to Zoho CRM
      if (lead.crm_record_id && !lead.crm_record_id.startsWith('sheets:')) {
        try {
          const currentProblem = updatedContext.problem || 'Not specified';
          const currentNeeds = updatedContext.needs || 'Not specified';
          const baseDescription = `Prospect captured from Trade Show recording. Problem: ${currentProblem}. Needs: ${currentNeeds}`;
          
          await ZohoService.updateLead(lead.crm_record_id, {
            Lead_Status: isHot ? 'Contacted' : 'Attempted to Contact',
            Description: `${baseDescription}\n\n[System Log] Email Touch "${touch}" opened. Total opens: ${newOpens}. Lead Hot Status: ${isHot ? 'HOT' : 'Warm'}.`
          });

          await ZohoService.addNote(
            lead.crm_record_id,
            `Email Opened (Touch: ${touch})`,
            `The recipient opened the follow-up email.\nTotal Open Count: ${newOpens}\nTime: ${new Date().toLocaleString()}`
          );
        } catch (zohoErr) {
          console.error('Failed to sync open status/note to Zoho CRM:', zohoErr);
        }
      }
    }

    // 2. Return a 1x1 transparent GIF image
    const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const gifBuffer = Buffer.from(gifBase64, 'base64');

    return new NextResponse(gifBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': gifBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    const gifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const gifBuffer = Buffer.from(gifBase64, 'base64');
    return new NextResponse(gifBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': gifBuffer.length.toString(),
      },
    });
  }
}
