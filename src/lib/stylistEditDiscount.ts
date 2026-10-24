type SavedEdit = {
  customer_email?: string | null;
  razorpay_subscription_id?: string | null;
  plan_id?: string | null;
  plan_type?: string | null;
  amount?: number | string | null;
  currency?: string | null;
};

type RazorpayEdit = {
  id?: string;
  plan_id?: string;
  status?: string;
};

export function qualifiesForStylistEditDiscount(input: {
  email: string;
  subscriptionId: string;
  monthlyPlanId: string;
  saved: SavedEdit | null;
  razorpay: RazorpayEdit | null;
}): boolean {
  const { email, subscriptionId, monthlyPlanId, saved, razorpay } = input;
  return Boolean(
    monthlyPlanId && saved && razorpay
    && saved.customer_email?.trim().toLowerCase() === email.trim().toLowerCase()
    && saved.razorpay_subscription_id === subscriptionId
    && saved.plan_id === monthlyPlanId
    && saved.plan_type === 'monthly'
    && Number(saved.amount) === 3900
    && saved.currency === 'USD'
    && razorpay.id === subscriptionId
    && razorpay.plan_id === monthlyPlanId
    && razorpay.status === 'active'
  );
}
