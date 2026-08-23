import nodemailer from 'nodemailer';

export class EmailService {
  /**
   * Initializes and returns the Nodemailer Gmail transporter.
   * Returns null if credentials are not configured, triggering console fallback.
   */
  private static getTransporter(user?: string, pass?: string) {
    const finalUser = user || process.env.GMAIL_USER;
    const finalPass = pass || process.env.GMAIL_APP_PASSWORD;

    if (!finalUser || !finalPass) {
      console.warn('Email credentials missing. Email service is running in Console Log fallback mode.');
      return null;
    }

    if (finalPass.startsWith('re_')) {
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: finalPass,
        },
      });
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: finalUser,
        pass: finalPass,
      },
    });
  }

  /**
   * Sends an email using Nodemailer via Gmail SMTP, or mocks the output to the console if unconfigured.
   */
  public static async sendEmail(
    credentials: { user?: string; pass?: string; fromName?: string },
    to: string, 
    subject: string, 
    body: string, 
    leadId?: string, 
    touchPosition?: number,
    appUrl?: string,
    attachments?: { filename: string; content: string; encoding: string }[]
  ): Promise<string> {
    let finalUser = credentials.user || process.env.GMAIL_USER;
    let finalPass = credentials.pass || process.env.GMAIL_APP_PASSWORD;

    // Force Gmail override if the provided custom pass is a Resend API key and a Gmail app password exists in .env
    if (credentials.pass?.startsWith('re_') && process.env.GMAIL_APP_PASSWORD) {
      finalUser = process.env.GMAIL_USER;
      finalPass = process.env.GMAIL_APP_PASSWORD;
    }
    const transporter = this.getTransporter(finalUser, finalPass);
    let fromAddress = finalUser || 'test@gmail.com';
    const fromName = credentials.fromName || 'Sales Team';
    let finalTo = to;

    if (finalPass?.startsWith('re_')) {
      // Resend free tier restrictions
      fromAddress = 'onboarding@resend.dev';
      finalTo = 'avrsmain@gmail.com';
    }

    // Format plain text breaks to HTML breaks
    let htmlBody = body.replace(/\n/g, '<br />');

    // Append 1x1 transparent tracking pixel if leadId is provided (Spam-filter safe)
    if (leadId) {
      const finalAppUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://amma.vercel.app';
      const trackingUrl = `${finalAppUrl}/api/leads/${leadId}/track-open${touchPosition ? `?touch=${touchPosition}` : ''}`;
      htmlBody += `<br /><img src="${trackingUrl}" width="1" height="1" alt="" border="0" style="display:block; opacity:0.01;" />`;
    }

    if (!transporter) {
      // Mock sending by logging to output console
      console.log(`
==================================================
[MOCK EMAIL DISPATCH]
To: ${to}
From: "${fromName}" <${fromAddress}>
Subject: ${subject}
Tracking Enabled: ${!!leadId} (Touch: ${touchPosition || 'Immediate'})
--------------------------------------------------
HTML Body:
${htmlBody}
==================================================
      `);
      return `mock-email-id-${Date.now()}`;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to: finalTo,
        subject: subject,
        html: htmlBody,
        attachments: attachments || [],
      });

      return info.messageId || 'nodemailer-success-id';
    } catch (error: any) {
      throw new Error(`Nodemailer API error: ${error.message || error}`);
    }
  }
}
