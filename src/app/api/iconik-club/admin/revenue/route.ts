import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { buildRevenueAnalytics } from '@/lib/revenueAnalytics';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const currencyView = searchParams.get('currencyView') === 'native' ? 'native' : 'inr';
    const data = await buildRevenueAnalytics({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      market: searchParams.get('market'),
      product: searchParams.get('product'),
      source: searchParams.get('source'),
      campaign: searchParams.get('campaign'),
      currencyView,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
