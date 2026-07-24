import { NextRequest, NextResponse } from 'next/server';
import { ContextExtractionAgent } from '@/lib/agents/contextExtraction';
import { supabaseAdmin } from '@/lib/supabase';
import { LeadsRepository } from '@/lib/repositories/leads';

/**
 * Uploads audio buffer to Supabase Storage 'recordings' bucket.
 */
async function uploadAudioToStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const bucketName = 'audio-recordings';
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload error: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing audio file in form data parameter: audio',
          },
        },
        { status: 400 }
      );
    }

    const mimeType = audioFile.type || 'audio/webm';
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Generate unique file name
    const timestamp = Date.now();
    const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
    const fileName = `${timestamp}_recording.${extension}`;

    // 1. Upload to Supabase Storage (with graceful degradation if bucket is missing/unconfigured)
    let audioUrl = '';
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        audioUrl = await uploadAudioToStorage(audioBuffer, fileName, mimeType);
      } else {
        console.warn('Supabase credentials missing. Bypassing Storage upload.');
        audioUrl = `local-placeholder://${fileName}`;
      }
    } catch (storageError) {
      console.warn('Failed uploading to Supabase Storage. Proceeding with placeholder URL. Details:', storageError);
      audioUrl = `local-placeholder://${fileName}`;
    }

    // 2. Extract Context & Transcript directly using Gemini 1.5 Flash Audio capabilities
    const audioBase64 = audioBuffer.toString('base64');
    const extractionResult = await ContextExtractionAgent.extractContext(audioBase64, mimeType);
    const transcript = extractionResult.transcript;
    const context = {
      problem: extractionResult.problem,
      needs: extractionResult.needs,
      action_items: extractionResult.action_items,
      notable_quotes: extractionResult.notable_quotes,
      sentiment: extractionResult.sentiment,
    };

    // 4. Save results to Database
    const leadId = formData.get('leadId') as string | null;
    const organizationId = formData.get('organizationId') as string | null;
    const userId = formData.get('userId') as string | null;

    let leadRecord = null;

    try {
      if (leadId) {
        // Update existing lead created by start route
        await supabaseAdmin
          .from('leads')
          .update({
            context_summary: context,
            status: 'extracted',
          })
          .eq('id', leadId);
        
        // Save recording details
        await supabaseAdmin
          .from('recordings')
          .insert({
            lead_id: leadId,
            audio_url: audioUrl,
            transcript: transcript,
            status: 'completed',
          });
        
        leadRecord = { id: leadId };
      } else if (organizationId) {
        // Fallback: Create new lead inline if start route was bypassed
        const result = await LeadsRepository.createLeadWithRecording(
          {
            organization_id: organizationId,
            captured_by: userId || null,
            status: 'extracted',
            context_summary: context,
          },
          {
            audio_url: audioUrl,
            transcript: transcript,
            status: 'completed',
          }
        );
        leadRecord = result;
      }
    } catch (dbError) {
      console.error('Failed to save transcription/context to database:', dbError);
      // We do not fail the request since the rep still needs the extracted text in the front-end
    }

    return NextResponse.json({
      data: {
        leadId: leadRecord?.id || leadId || null,
        audioUrl,
        transcript,
        context,
      },
      error: null,
    });
  } catch (error: any) {
    console.error('Error processing audio stop endpoint:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'AUDIO_PROCESSING_FAILED',
          message: error.message || 'An error occurred during transcription or extraction.',
        },
      },
      { status: 500 }
    );
  }
}
