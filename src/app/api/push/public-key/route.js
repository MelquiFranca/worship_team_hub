import { NextResponse } from 'next/server';
import { readClientPushPublicKey } from '../../../../lib/notifications/scalePushNotifications.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = readClientPushPublicKey();

  return NextResponse.json({
    publicKey: publicKey || null,
    configured: Boolean(publicKey)
  });
}
