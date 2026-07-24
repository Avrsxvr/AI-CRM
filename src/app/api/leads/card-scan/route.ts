import { NextRequest, NextResponse } from 'next/server';
import { CardOcrAgent } from '@/lib/agents/cardOcr';

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

    // Process card scan with Gemini Vision
    const extractedFields = await CardOcrAgent.processCard(base64Data, mimeType);

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
