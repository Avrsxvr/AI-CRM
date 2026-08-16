import { StateGraph, Annotation } from '@langchain/langgraph';
import { ContextExtractionAgent } from '@/lib/agents/contextExtraction';
import { CardOcrAgent } from '@/lib/agents/cardOcr';
import { FollowupDraftAgent } from '@/lib/agents/followupDraft';
import { ZohoService } from '@/lib/services/zoho';
import { SheetsService } from '@/lib/services/sheets';
import { SchedulerAgent } from '@/lib/agents/scheduler';
import { LeadsRepository } from '@/lib/repositories/leads';
import { SettingsService } from '@/lib/services/settings';

// Define the shared graph state using Annotation API
export const LeadCaptureStateAnnotation = Annotation.Root({
  leadId: Annotation<string | null>(),
  organizationId: Annotation<string>(),
  userId: Annotation<string | null>(),
  audioBuffer: Annotation<Buffer | null>(),
  audioMimeType: Annotation<string | null>(),
  cardImageBase64: Annotation<string | null>(),
  transcript: Annotation<string | null>(),
  context: Annotation<any | null>(),
  contactFields: Annotation<any | null>(),
  emailDraft: Annotation<any | null>(),
  crmRecordId: Annotation<string | null>(),
  syncSystem: Annotation<'zoho' | 'sheets' | 'none' | null>(),
  errorMessage: Annotation<string | null>(),
  settings: Annotation<any | null>(),
});

export type LeadCaptureState = typeof LeadCaptureStateAnnotation.State;

// Node 0: Fetch Organization Settings
async function fetchSettingsNode(state: LeadCaptureState) {
  if (!state.organizationId) {
    return { errorMessage: 'Organization ID is missing' };
  }
  try {
    const settings = await SettingsService.getSettings(state.organizationId);
    return { settings };
  } catch (error: any) {
    return { errorMessage: `Failed to fetch settings: ${error.message}` };
  }
}

// Node 1: Transcribe audio and extract conversation context
async function transcribeAndExtractNode(state: LeadCaptureState) {
  if (!state.audioBuffer || !state.audioMimeType) {
    return { errorMessage: 'Audio buffer or MIME type is missing' };
  }

  const apiKey = state.settings?.gemini_api_key;
  if (!apiKey) return { errorMessage: 'Gemini API key is missing in organization settings.' };

  try {
    const audioBase64 = state.audioBuffer.toString('base64');
    const context = await ContextExtractionAgent.extractContext(apiKey, audioBase64, state.audioMimeType);
    
    return {
      transcript: context.transcript,
      context,
    };
  } catch (error: any) {
    return { errorMessage: `Transcription/Extraction node failed: ${error.message}` };
  }
}

// Node 2: Scan business card using vision OCR
async function ocrCardNode(state: LeadCaptureState) {
  if (!state.cardImageBase64) {
    return { errorMessage: 'Card image data is missing' };
  }

  const apiKey = state.settings?.gemini_api_key;
  if (!apiKey) return { errorMessage: 'Gemini API key is missing in organization settings.' };

  try {
    const ocrResult = await CardOcrAgent.processCard(apiKey, state.cardImageBase64, 'image/jpeg');
    return {
      contactFields: {
        name: ocrResult.name,
        company: ocrResult.company,
        title: ocrResult.title,
        email: ocrResult.email,
        phone: ocrResult.phone,
      },
    };
  } catch (error: any) {
    return { errorMessage: `OCR node failed: ${error.message}` };
  }
}

// Node 3: Generate the first follow-up email draft
async function generateFollowupNode(state: LeadCaptureState) {
  if (!state.contactFields || !state.context) {
    return { errorMessage: 'Cannot generate draft: contact fields or context missing' };
  }

  const apiKey = state.settings?.gemini_api_key;
  if (!apiKey) return { errorMessage: 'Gemini API key is missing in organization settings.' };

  try {
    const draft = await FollowupDraftAgent.generateDraft(
      apiKey,
      {
        name: state.contactFields.name,
        company: state.contactFields.company,
        title: state.contactFields.title,
      },
      {
        problem: state.context.problem,
        needs: state.context.needs,
        action_items: state.context.action_items || [],
        notable_quotes: state.context.notable_quotes || [],
      },
      'Sales Representative'
    );

    return { emailDraft: draft };
  } catch (error: any) {
    return { errorMessage: `Draft generation node failed: ${error.message}` };
  }
}

// Node 4: Sync to CRM (Zoho with Sheets fallback)
async function syncToCrmNode(state: LeadCaptureState) {
  if (!state.contactFields || !state.emailDraft) {
    return { errorMessage: 'Cannot sync: contact fields or email draft missing' };
  }

  const crmDescription = `
--- MEETING TRANSCRIPT SUMMARY ---
Stated Problem: ${state.context?.problem || 'Not specified'}
Expressed Needs: ${state.context?.needs || 'Not specified'}
Verbatim Quotes: ${state.context?.notable_quotes?.join(' | ') || 'None'}
Sentiment: ${state.context?.sentiment || 'Neutral'}

--- APPROVED FIRST FOLLOWUP EMAIL ---
Subject: ${state.emailDraft.subject}

${state.emailDraft.body}
`.trim();

  const crmPayload = {
    firstName: state.contactFields.name || '',
    lastName: '',
    email: state.contactFields.email || '',
    phone: state.contactFields.phone || '',
    company: state.contactFields.company || 'Unknown',
    title: state.contactFields.title || '',
    description: crmDescription,
  };

  try {
    // Attempt Zoho if credentials exist
    if (state.settings?.zoho_client_id && state.settings?.zoho_client_secret && state.settings?.zoho_refresh_token) {
      const zohoCredentials = {
        orgId: state.organizationId,
        clientId: state.settings.zoho_client_id,
        clientSecret: state.settings.zoho_client_secret,
        refreshToken: state.settings.zoho_refresh_token,
        apiUrl: state.settings.zoho_api_url,
        accountsUrl: state.settings.zoho_accounts_url
      };
      const zohoResult = await ZohoService.createLead(zohoCredentials, crmPayload);
      return {
        crmRecordId: zohoResult.crmRecordId,
        syncSystem: 'zoho' as const,
      };
    } else {
      throw new Error("Zoho credentials missing in settings.");
    }
  } catch (zohoError: any) {
    console.warn('LangGraph: Zoho Sync Node failed, attempting Sheets fallback.', zohoError);
    
    // Attempt Google Sheets fallback
    try {
      const sheetPayload = {
        ...crmPayload,
        leadId: state.leadId || 'langgraph-run',
      };
      const sheetsResult = await SheetsService.appendLead(sheetPayload);
      return {
        crmRecordId: sheetsResult.crmRecordId,
        syncSystem: 'sheets' as const,
      };
    } catch (sheetError: any) {
      console.error('LangGraph: Google Sheets fallback also failed.', sheetError);
      return {
        syncSystem: 'none' as const,
        errorMessage: `Sync failed on both Zoho and Sheets: ${zohoError.message} & ${sheetError.message}`,
      };
    }
  }
}

// Node 5: Schedule email sequence in the queue
async function scheduleDripsNode(state: LeadCaptureState) {
  if (!state.leadId) {
    return { errorMessage: 'Cannot schedule drips: leadId is missing' };
  }

  if (state.syncSystem === 'none' || !state.crmRecordId) {
    return {}; // Skip scheduling if sync failed
  }

  try {
    await SchedulerAgent.scheduleSequence(state.leadId);
    return {};
  } catch (error: any) {
    return { errorMessage: `Scheduling node failed: ${error.message}` };
  }
}

// Build the LangGraph State Graph
const workflow = new StateGraph(LeadCaptureStateAnnotation)
  .addNode('fetchSettings', fetchSettingsNode)
  .addNode('transcribeAndExtract', transcribeAndExtractNode)
  .addNode('ocrCard', ocrCardNode)
  .addNode('generateFollowup', generateFollowupNode)
  .addNode('syncToCrm', syncToCrmNode)
  .addNode('scheduleDrips', scheduleDripsNode);

// Define edges and transitions
workflow.addEdge('__start__', 'fetchSettings');
workflow.addEdge('fetchSettings', 'transcribeAndExtract');
workflow.addEdge('fetchSettings', 'ocrCard');

// Both OCR and Transcription branches converge on follow-up generation
workflow.addEdge('transcribeAndExtract', 'generateFollowup');
workflow.addEdge('ocrCard', 'generateFollowup');

workflow.addEdge('generateFollowup', 'syncToCrm');
workflow.addEdge('syncToCrm', 'scheduleDrips');
workflow.addEdge('scheduleDrips', '__end__');

// Compile the orchestrator
export const leadCaptureGraph = workflow.compile();
