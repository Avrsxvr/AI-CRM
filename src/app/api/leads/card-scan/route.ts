import { NextRequest, NextResponse } from 'next/server';
import { CardOcrAgent } from '@/lib/agents/cardOcr';
import { getCurrentUserOrgId } from '@/lib/auth';
import { SettingsService } from '@/lib/services/settings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required parameter: image (base64 string or data URL)',
          },
        },
        { status: 400 }
      );
    }

    // Parse data URI to extract mimeType and base64
    let mimeType = 'image/jpeg';
    let base64Data = image;
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const settings = await SettingsService.getSettings(orgId);
    const apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ data: null, error: { code: 'CONFIG_ERROR', message: 'Gemini API key missing in both org settings and environment variables' } }, { status: 400 });
    }

    // Process card scan with Gemini Vision
    const extractedFields = await CardOcrAgent.processCard(apiKey, base64Data, mimeType);

    return NextResponse.json({
      data: extractedFields,
      error: null,
    });
  } catch (error: any) {
    console.error('Error in Card Scan API route:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'OCR_PROCESSING_FAILED',
          message: error.message || 'An error occurred during card OCR processing.',
        },
      },
      { status: 500 }
    );
  }
}
