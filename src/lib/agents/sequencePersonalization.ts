import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
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
    apiKey: string,
    leadDetails: { name?: string | null; company?: string | null; title?: string | null; context_summary?: any },
    emailLevel: number,
    subjectLevel: number,
    senderName: string = 'Sales Rep'
  ): Promise<SequencePersonalizationOutput> {
    if (!apiKey) {
      throw new Error('Gemini API key is required but was not provided.');
    }

    // Determine the template or dynamically fall back to a generative prompt if we exceed pre-written templates (Infinite Drip Engine)
    let template = DRIP_TEMPLATES.find(t => t.position === emailLevel);
    if (!template) {
      template = {
        position: emailLevel,
        subject: `[Dynamic Follow-up ${emailLevel}]`,
        body: `Dear [Name] ji,\n\nI wanted to share another quick update regarding [Needs/Problem Topic] and how [Company] might benefit.\n\nBest,\n[Sender]`
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        subject: {
          type: SchemaType.STRING,
          description: "The personalized email subject line",
        },
        body: {
          type: SchemaType.STRING,
          description: "The full email body text, appropriately formatted",
        },
      },
      required: ["subject", "body"],
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
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

    const prompt = `Generate Email Touch Level ${emailLevel} based on this lead data:\n\n${payload}\n\nIMPORTANT INSTRUCTION for Subject Variation Level ${subjectLevel}:\nIf Subject Variation Level is > 1, you MUST write a completely new, catchier subject line than the original template, because the user did NOT open the previous emails.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as SequencePersonalizationOutput;
    } catch (error) {
      console.error(`Error in Sequence Personalization Agent (Email ${emailLevel} Subject ${subjectLevel}):`, error);
      return {
        subject: `Checking in - ${leadDetails.company || 'Update'}`,
        body: `Hi ${leadDetails.name || 'there'},\n\nI wanted to follow up and see how things are going at ${leadDetails.company || 'your company'}.\n\nBest regards,\n${senderName}`,
      };
    }
  }
}
