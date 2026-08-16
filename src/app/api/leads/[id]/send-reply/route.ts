import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/services/email';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { subject, message, notificationId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // 1. Fetch Lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('contact_fields')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const toEmail = lead.contact_fields?.email;
    if (!toEmail) {
      return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 });
    }

    // 2. Send the Email
    await EmailService.sendEmail(
      toEmail,
      subject,
      message,
      id
    );

    // 3. Mark notification as read
    if (notificationId) {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    }

    // Optional: We can unpause the sequence here if we want them back on the drip,
    // but usually after a manual reply, you take over manually or put them in a different sequence.
    // Let's keep them paused for now.

    return NextResponse.json({ message: 'Reply sent successfully' });
  } catch (error: any) {
    console.error('Error sending reply:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
