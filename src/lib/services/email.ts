import nodemailer from 'nodemailer';

export class EmailService {
  /**
   * Initializes and returns the Nodemailer Gmail transporter.
   * Returns null if credentials are not configured, triggering console fallback.
   */
  private static getTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.warn('GMAIL_USER or GMAIL_APP_PASSWORD is missing. Email service is running in Console Log fallback mode.');
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Sends an email using Nodemailer via Gmail SMTP, or mocks the output to the console if unconfigured.
   */
  public static async sendEmail(
    to: string, 
    subject: string, 
    body: string, 
    leadId?: string, 
    touchPosition?: number,
    appUrl?: string
  ): Promise<string> {
    const transporter = this.getTransporter();
    const fromAddress = process.env.GMAIL_USER || 'test@gmail.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Sales Team';

    // Format plain text breaks to HTML breaks
    let htmlBody = body.replace(/\n/g, '<br />');

    // Append 1x1 transparent tracking pixel if leadId is provided
    if (leadId) {
      const finalAppUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://amma.vercel.app';
      const trackingUrl = `${finalAppUrl}/api/leads/${leadId}/track-open${touchPosition ? `?touch=${touchPosition}` : ''}`;
      htmlBody += `<br /><br /><img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
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
        to: to,
        subject: subject,
        html: htmlBody,
      });

      return info.messageId || 'nodemailer-success-id';
    } catch (error: any) {
      throw new Error(`Nodemailer API error: ${error.message || error}`);
    }
  }
}
