import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface ReplyAnalysisOutput {
  sentiment: 'positive' | 'negative' | 'objection' | 'question' | 'neutral';
  draft_subject: string;
  draft_body: string;
}

export class ReplyHandlingAgent {
  /**
   * Analyzes an incoming reply and drafts an appropriate response using Gemini.
   */
  public static async analyzeAndDraft(
    apiKey: string,
    replyText: string,
    leadDetails: { name?: string | null; company?: string | null; context_summary?: any }
  ): Promise<ReplyAnalysisOutput> {
    if (!apiKey) {
      throw new Error('Gemini API key is required but was not provided.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are an elite SDR handling an incoming email reply from a prospect.
Your goal is to:
1. Analyze the sentiment of the reply (positive, negative, objection, question, neutral).
2. Write a highly empathetic, professional rebuttal or follow-up response.
- If it's an objection (e.g., "too expensive"), acknowledge it and pivot to value.
- If it's a question, answer it confidently based on typical B2B software norms.
- If it's positive, propose a quick 10-min intro call next Tuesday.
- Keep the draft body concise (max 4 sentences) and highly conversational. Start with "Dear [Name] ji,".`,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            sentiment: {
              type: SchemaType.STRING,
              description: "The categorized sentiment of the reply (positive, negative, objection, question, neutral)."
            },
            draft_subject: {
              type: SchemaType.STRING,
              description: "The subject line for the reply (usually 'Re: [Previous Subject]')."
            },
            draft_body: {
              type: SchemaType.STRING,
              description: "The drafted response body."
            }
          },
          required: ["sentiment", "draft_subject", "draft_body"]
        }
      }
    });

    const prompt = `Lead Context:
Name: ${leadDetails.name || 'Prospect'}
Company: ${leadDetails.company || 'Their Company'}
Extracted Context: ${JSON.stringify(leadDetails.context_summary || {})}

Incoming Reply Text:
"""
${replyText}
"""

Analyze and draft response.`;

    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text()) as ReplyAnalysisOutput;
    } catch (error) {
      console.error('ReplyHandlingAgent error:', error);
      return {
        sentiment: 'neutral',
        draft_subject: 'Re: Following up',
        draft_body: `Dear ${leadDetails.name || 'ji'},\n\nThank you for getting back to me. I'd love to jump on a quick call to address your points. Are you free next week?\n\nBest,`
      };
    }
  }
}
