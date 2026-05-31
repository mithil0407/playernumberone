import { NextRequest, NextResponse } from 'next/server';
import { loadPublicStyleEditIssue } from '@/lib/styleEditLoader';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const issue = await loadPublicStyleEditIssue(shareToken);
  if (!issue?.page_data) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  return NextResponse.json({ issue });
}
