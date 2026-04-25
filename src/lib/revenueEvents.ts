import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';

export type RevenueCurrency = 'INR' | 'AUD' | 'USD';
export type RevenueMarket = 'india' | 'au' | 'global' | 'globe';
export type RevenueKind = 'one_time' | 'subscription';
export type RevenueEventType =
  | 'one_time_payment'
  | 'subscription_initial'
  | 'subscription_charge'
  | 'payment_failed';
export type RevenueStatus = 'paid' | 'failed' | 'pending';

export interface RevenueEventInput {
  eventKey: string;
  sourceMarket: RevenueMarket;
  sourceTable: string;
  sourceId: string;
  revenueKind: RevenueKind;
  eventType: RevenueEventType;
  productType?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  amountMinor: number;
  currency: RevenueCurrency;
  status?: RevenueStatus;
  paymentId?: string | null;
  razorpayOrderId?: string | null;
  razorpaySubscriptionId?: string | null;
  planType?: string | null;
  occurredAt?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordRevenueEvent(input: RevenueEventInput) {
  if (!input.eventKey || !input.sourceId || !Number.isFinite(input.amountMinor)) return;

  try {
    const { error } = await supabaseAdmin
      .from('revenue_events')
      .upsert(
        {
          event_key: input.eventKey,
          source_market: input.sourceMarket,
          source_table: input.sourceTable,
          source_id: input.sourceId,
          revenue_kind: input.revenueKind,
          event_type: input.eventType,
          product_type: input.productType ?? null,
          customer_email: input.customerEmail ?? null,
          customer_name: input.customerName ?? null,
          customer_phone: input.customerPhone ?? null,
          amount_minor: Math.round(input.amountMinor),
          currency: input.currency,
          status: input.status ?? 'paid',
          payment_id: input.paymentId ?? null,
          razorpay_order_id: input.razorpayOrderId ?? null,
          razorpay_subscription_id: input.razorpaySubscriptionId ?? null,
          plan_type: input.planType ?? null,
          occurred_at: input.occurredAt ?? new Date().toISOString(),
          metadata: input.metadata ?? {},
        },
        { onConflict: 'event_key', ignoreDuplicates: false }
      );

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('Skipping revenue event recording because revenue_events has not been migrated yet.');
        return;
      }
      console.error('Failed to record revenue event:', error);
    }
  } catch (error) {
    console.error('Revenue event recording unavailable:', error);
  }
}

export function toMinorUnits(amountMajor: number | string | null | undefined) {
  const value = typeof amountMajor === 'string' ? Number(amountMajor) : amountMajor;
  return Math.round((Number.isFinite(value) ? value! : 0) * 100);
}

export function normalizeCurrency(value: unknown, fallback: RevenueCurrency): RevenueCurrency {
  return value === 'INR' || value === 'AUD' || value === 'USD' ? value : fallback;
}
