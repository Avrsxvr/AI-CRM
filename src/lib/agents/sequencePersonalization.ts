import { GoogleGenerativeAI, Schema, Type } from '@google/generative-ai';
import { SEQUENCE_PERSONALIZATION_SYSTEM_PROMPT, DRIP_TEMPLATES } from '@/lib/prompts/sequencePersonalization.prompt';

export interface SequencePersonalizationOutput {
  subject: string;
  body: string;
}

export class SequencePersonalizationAgent {
  /**
   * Generates a personalized drip sequence touch using Gemini Flash.
   */
  public static async personalizeTouch(
    leadDetails: { name?: string | null; company?: string | null; title?: string | null; context_summary?: any },
    sequencePosition: number,
    senderName: string = 'Sales Rep'
  ): Promise<SequencePersonalizationOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key (GEMINI_API_KEY) is missing in environment variables.');
    }

    const template = DRIP_TEMPLATES.find(t => t.position === sequencePosition);
    if (!template) {
      throw new Error(`No sequence template found for position: ${sequencePosition}`);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.STRING,
          description: "The personalized email subject line",
        },
        body: {
          type: Type.STRING,
          description: "The full email body text, appropriately formatted",
        },
      },
      required: ["subject", "body"],
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: SEQUENCE_PERSONALIZATION_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const payload = JSON.stringify({
      lead: leadDetails,
      sender_name: senderName,
      touch_instructions: `Adapt the following template:\nSubject: ${template.subject}\nBody:\n${template.body}`,
    }, null, 2);

    const prompt = `Generate Touch ${sequencePosition} based on this lead data:\n\n${payload}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as SequencePersonalizationOutput;
    } catch (error) {
      console.error(`Error in Sequence Personalization Agent (Position ${sequencePosition}):`, error);
      return {
        subject: `Checking in - ${leadDetails.company || 'Update'}`,
        body: `Hi ${leadDetails.name || 'there'},\n\nI wanted to follow up and see how things are going at ${leadDetails.company || 'your company'}.\n\nBest regards,\n${senderName}`,
      };
    }
  }
}
