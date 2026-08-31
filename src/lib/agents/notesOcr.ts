import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ContextExtractionOutput } from './contextExtraction';

export class NotesOcrAgent {
  /**
   * Processes an array of base64 images of handwritten notes and returns structured context fields.
   * Uses Google Generative AI SDK directly for native multi-image support.
   */
  public static async processNotes(images: { base64Data: string; mimeType: string }[]): Promise<ContextExtractionOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key (GEMINI_API_KEY) is missing in environment variables.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: 'You are an expert sales assistant. Your job is to read handwritten notes taken during a meeting with a lead and extract structured context. Extract the lead\'s pain points, needs, action items, overall sentiment, and any direct quotes if noted.',
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const imageParts = images.map(img => ({
      inlineData: {
        data: img.base64Data,
        mimeType: img.mimeType,
      },
    }));

    const prompt = `Read the handwritten notes in the provided image(s) and extract the context. Combine information if there are multiple images. Return ONLY valid JSON with these exact keys: problem (string), needs (string), action_items (array of strings), sentiment ("positive", "neutral", "skeptical", or "critical"), and notable_quotes (array of strings). Do not invent information; if it's not present, use empty strings or empty arrays.`;

    try {
      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      // Strip markdown code fences if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        ...parsed,
        transcript: '',
      } as ContextExtractionOutput;
    } catch (error) {
      console.error('Error in Notes OCR Agent (Gemini):', error);
      return {
        problem: '',
        needs: '',
        action_items: [],
        sentiment: 'neutral',
        notable_quotes: [],
        transcript: '',
      };
    }
  }
}
