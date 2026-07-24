import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  let dbStatus = 'disconnected';
  let errorMsg = null;

  try {
    // Attempt a lightweight select from organizations to verify DB connectivity
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist yet, that's fine for health check as long as DB is reachable,
      // but let's check code to distinguish from network failure.
      if (error.code === 'PGRST116' || error.code === '42P01') {
        dbStatus = 'connected'; // Reachable, table doesn't exist or is empty
      } else {
        dbStatus = 'error';
        errorMsg = error.message;
      }
    } else {
      dbStatus = 'connected';
    }
  } catch (e: unknown) {
    dbStatus = 'error';
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  const status = {
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    databaseError: errorMsg,
    services: {
      whisper: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      claude: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
      zoho: (process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN) ? 'configured' : 'missing',
      googleSheets: (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID) ? 'configured' : 'missing',
      email: process.env.RESEND_API_KEY ? 'configured' : 'missing',
    }
  };

  const responseStatus = dbStatus === 'connected' ? 200 : 503;
  return NextResponse.json(status, { status: responseStatus });
}
