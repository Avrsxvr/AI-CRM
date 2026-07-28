import { Resend } from 'resend';

export class EmailService {
  /**
   * Initializes and returns the Resend client.
   * Returns null if the RESEND_API_KEY is not configured, triggering sandbox fallback.
   */
  private static getClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('Resend API key (RESEND_API_KEY) is missing. Email service is running in Console Log fallback mode.');
      return null;
    }
    return new Resend(apiKey);
  }

  /**
   * Sends an email using the Resend SDK, or mocks the output to the console if unconfigured.
   */
  public static async sendEmail(
    to: string, 
    subject: string, 
    body: string, 
    leadId?: string, 
    touchPosition?: number,
    appUrl?: string
  ): Promise<string> {
    const resend = this.getClient();
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'leads@yourdomain.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Sales Team';

    // Format plain text breaks to HTML breaks
    let htmlBody = body.replace(/\n/g, '<br />');

    // Append 1x1 transparent tracking pixel if leadId is provided
    if (leadId) {
      const finalAppUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://amma.vercel.app';
      const trackingUrl = `${finalAppUrl}/api/leads/${leadId}/track-open${touchPosition ? `?touch=${touchPosition}` : ''}`;
      htmlBody += `<br /><br /><img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
    }

    if (!resend) {
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
      // Safety override for Resend free tier testing
      const finalTo = fromAddress === 'onboarding@resend.dev' ? ['avrsmain@gmail.com'] : [to];

      const response = await resend.emails.send({
        from: `"${fromName}" <${fromAddress}>`,
        to: finalTo,
        subject: subject,
        html: htmlBody,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data?.id || 'resend-success-id';
    } catch (error: any) {
      throw new Error(`Resend API error: ${error.message || error}`);
    }
  }
}
