import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

// Define the expected output structure using Zod
const outputSchema = z.object({
  score: z.number().min(1).max(100).describe("The lead priority score from 1 to 100."),
  priority_reason: z.string().describe("A short, punchy 1-sentence reason for this score (e.g. 'CTO at enterprise company who opened 3 emails. Call immediately.')"),
});

const parser = StructuredOutputParser.fromZodSchema(outputSchema);

const PROMPT_TEMPLATE = `
You are an elite B2B Sales Development Representative (SDR) and AI Data Analyst.
Your goal is to evaluate the provided lead data and determine their priority score (1-100).

Scoring Guidelines:
- High (80-100): C-Suite/VP level, enterprise companies, explicit buying intent, or multiple email opens.
- Medium (40-79): Managers, Directors, or good company fit but no explicit urgency.
- Low (1-39): Students, independent consultants, irrelevant industries, or bad data.

Lead Data:
{lead_data}

Interaction History (Followups, Opens, etc):
{interaction_data}

Analyze the lead and provide a score and a 1-sentence reason.
{format_instructions}
`;

export class LeadScoringAgent {
  private llm: ChatGoogleGenerativeAI;
  private prompt: PromptTemplate;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      modelName: 'gemini-3.6-flash',
      temperature: 0.2, // Low temperature for consistent scoring
    });

    this.prompt = new PromptTemplate({
      template: PROMPT_TEMPLATE,
      inputVariables: ['lead_data', 'interaction_data'],
      partialVariables: { format_instructions: parser.getFormatInstructions() },
    });
  }

  /**
   * Scores a lead based on their contact info, context, and interaction history.
   */
  public async scoreLead(
    leadData: any,
    interactionData: any
  ): Promise<{ score: number; priority_reason: string }> {
    try {
      // @ts-ignore - Langchain version mismatch with RunnableLike
      const chain = this.prompt.pipe(this.llm as any).pipe(parser);
      const result = await chain.invoke({
        lead_data: JSON.stringify(leadData, null, 2),
        interaction_data: JSON.stringify(interactionData || "No interaction history yet.", null, 2),
      });

      return result;
    } catch (error) {
      console.error('LeadScoringAgent error:', error);
      // Return a safe default if AI fails
      return { score: 10, priority_reason: "AI Scoring failed. Pending manual review." };
    }
  }
}
