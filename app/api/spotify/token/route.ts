import { getClientCredentialsToken } from '@/lib/spotify/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const tokenData = await getClientCredentialsToken();
  
  if ("error" in tokenData) {
    return NextResponse.json({ error: tokenData.error }, { status: tokenData.status || 500 });
  }

  return NextResponse.json(tokenData);
}
