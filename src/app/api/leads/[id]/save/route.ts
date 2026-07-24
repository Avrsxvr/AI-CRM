import { NextRequest, NextResponse } from 'next/server';
import { LeadsRepository } from '@/lib/repositories/leads';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { contactFields } = body;

    if (contactFields) {
      await LeadsRepository.updateContactFields(id, contactFields, 'confirmed');
    }

    return NextResponse.json({
      data: { success: true },
      error: null,
    });
  } catch (error: any) {
    console.error('Error saving lead draft:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'SAVE_FAILED',
          message: error.message || 'An error occurred during save.',
        },
      },
      { status: 500 }
    );
  }
}
