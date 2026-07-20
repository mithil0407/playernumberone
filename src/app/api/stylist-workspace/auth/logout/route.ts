import { NextResponse } from 'next/server';
import { clearWorkspaceSessionCookie, revokeCurrentWorkspaceSession } from '@/lib/stylistWorkspaceAuth';

export async function POST() {
  await revokeCurrentWorkspaceSession();
  const response = NextResponse.json({ success: true });
  clearWorkspaceSessionCookie(response);
  return response;
}
