import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { service, credentials } = await req.json();

    if (!service) {
      return NextResponse.json({ error: 'Service is required' }, { status: 400 });
    }

    if (service === 'gemini') {
      if (!credentials?.apiKey) throw new Error('API key is required');
      
      const ai = new GoogleGenAI({ apiKey: credentials.apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'Say the exact word: "Success"',
      });
      
      if (!response.text) throw new Error('No response from Gemini API');
      
      return NextResponse.json({ success: true, message: 'Connected to Gemini API successfully!' });
    }

    if (service === 'smtp') {
      if (!credentials?.user || !credentials?.pass) throw new Error('SMTP user and pass are required');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: credentials.user,
          pass: credentials.pass,
        },
      });

      await transporter.verify();
      
      return NextResponse.json({ success: true, message: 'SMTP credentials verified successfully!' });
    }

    if (service === 'zoho') {
      if (!credentials?.clientId || !credentials?.clientSecret || !credentials?.refreshToken) {
        throw new Error('Zoho client ID, secret, and refresh token are required');
      }
      
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
      });

      const tokenUrl = `https://accounts.zoho.com/oauth/v2/token?${params.toString()}`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh Zoho token: ${errorText}`);
      }
      
      const data = await response.json();
      if (!data.access_token) {
        throw new Error('Zoho token response did not contain access_token');
      }

      return NextResponse.json({ success: true, message: 'Connected to Zoho CRM successfully!' });
    }

    return NextResponse.json({ error: 'Unknown service' }, { status: 400 });
  } catch (error: any) {
    console.error(`Error testing ${req.url}:`, error);
    return NextResponse.json(
      { error: { message: error.message || 'Connection test failed' } },
      { status: 500 }
    );
  }
}
