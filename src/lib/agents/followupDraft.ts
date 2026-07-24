import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { FOLLOWUP_DRAFT_SYSTEM_PROMPT } from '@/lib/prompts/followupDraft.prompt';

export interface FollowupDraftOutput {
  subject: string;
  body: string;
}

export class FollowupDraftAgent {
  /**
   * Generates a highly personalized Touch 1 email based on extracted context.
   */
  public static async generateDraft(
    contactFields: { name?: string | null; company?: string | null; title?: string | null },
    contextSummary: { problem?: string | null; needs?: string | null; action_items?: string[]; notable_quotes?: string[] },
    senderName: string = 'Sales Rep'
  ): Promise<FollowupDraftOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key (GEMINI_API_KEY) is missing in environment variables.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        subject: {
          type: SchemaType.STRING,
          description: "The email subject line, catchy and personalized",
        },
        body: {
          type: SchemaType.STRING,
          description: "The full email body text, formatted with appropriate line breaks",
        },
      },
      required: ["subject", "body"],
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: FOLLOWUP_DRAFT_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const payload = JSON.stringify({
      contact: contactFields,
      context: contextSummary,
      sender_name: senderName,
    }, null, 2);

    const prompt = `Generate the follow-up draft for the following lead:\n\n${payload}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as FollowupDraftOutput;
    } catch (error) {
      console.error('Error in Follow-up Draft Agent:', error);
      return {
        subject: 'Following up on our conversation',
        body: `Hi ${contactFields.name || 'there'},\n\nIt was great speaking with you. I wanted to follow up on our discussion and see how we can assist you.\n\nBest regards,\n${senderName}`,
      };
    }
  }
}
