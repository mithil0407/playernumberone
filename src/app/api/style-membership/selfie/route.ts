import { NextRequest, NextResponse } from 'next/server';
import { leadFromToken, publicLead, readSelfie, MembershipError } from '@/lib/styleMembershipServer';
import { errorResponse, noStore } from '../_shared/http';

export const maxDuration = 60;

/** The optional selfie: read her colouring, keep the photo privately for 30 days. */
export async function POST(request: NextRequest) {
  try {
    const lead = await leadFromToken(request.headers.get('x-lead-token'));
    const form = await request.formData();
    const file = form.get('selfie');
    if (!(file instanceof Blob) || !file.size) throw new MembershipError('Please choose a photo.', 400, 'no_file');
    if (!/^image\//.test(file.type)) throw new MembershipError('Please choose a photo (JPG or PNG).', 400, 'bad_type');
    const updated = await readSelfie(lead, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true, lead: publicLead(updated) }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'selfie');
  }
}
