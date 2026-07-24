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
  public static async sendEmail(to: string, subject: string, body: string): Promise<string> {
    const resend = this.getClient();
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'leads@yourdomain.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Sales Team';

    if (!resend) {
      // Mock sending by logging to output console
      console.log(`
==================================================
[MOCK EMAIL DISPATCH]
To: ${to}
From: "${fromName}" <${fromAddress}>
Subject: ${subject}
--------------------------------------------------
${body}
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
        text: body, // plain text email body
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
