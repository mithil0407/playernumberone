import { NextRequest, NextResponse } from 'next/server';
import { saveCustomer, saveOrder, supabaseAdmin, getCustomerByEmail } from '@/lib/supabase';
import { attributionToColumns, firstTouchAttribution } from '@/lib/attribution';
import {
  INDIA_BLUEPRINT_ADDON_PRICES,
  calculateIndiaBlueprintTotal,
  indiaBlueprintBasePriceForCheckout,
  type IndiaBlueprintCheckoutSource,
} from '@/lib/indiaBlueprintPricing';
import { indiaFunnelCategoryFromEntry } from '@/lib/metaTrackingContract';
import Razorpay from 'razorpay';
import { getStyleScanByToken } from '@/lib/styleScan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, amount, currency = 'INR', base_product, add_ons, total_base_price, diva_diet_plan_price, smart_shoppers_guide_price, outfit_preview_price, checkout_source, funnel_entry } = body;
    const linkedScan = typeof body.scan_token === 'string' && body.scan_token
      ? await getStyleScanByToken(body.scan_token, 'id, scan_status')
      : null;
    const scanLeadId = linkedScan?.scan_status === 'ready' ? linkedScan.id : null;
    const incomingAttribution = attributionToColumns(body.attribution);
    const indiaCheckoutSource: IndiaBlueprintCheckoutSource | null =
      checkout_source === 'root_checkout' || checkout_source === 'offer_2699_checkout'
        ? checkout_source
        : null;
    const whatsappOptIn = indiaCheckoutSource && body.whatsapp_opt_in === true;
    let resolvedFunnelCategory = funnel_entry;
    let resolvedBasePrice = total_base_price;
    let resolvedSmartShopperPrice = smart_shoppers_guide_price;
    let resolvedOutfitPreviewPrice = outfit_preview_price;

    if (indiaCheckoutSource) {
      const expectedBasePrice = indiaBlueprintBasePriceForCheckout(indiaCheckoutSource);
      const selectedAddons = {
        outfitPreview: Boolean(add_ons?.outfit_preview),
        wardrobeDetox: Boolean(add_ons?.wardrobe_detox),
        smartShopper: Boolean(add_ons?.smart_shoppers_guide),
      };
      const expectedAmount = calculateIndiaBlueprintTotal(expectedBasePrice, selectedAddons);

      if (
        currency !== 'INR'
        || Number(total_base_price) !== expectedBasePrice
        || Number(amount) !== expectedAmount
      ) {
        return NextResponse.json(
          { success: false, error: 'The checkout price changed. Please refresh and try again.' },
          { status: 400 },
        );
      }

      resolvedFunnelCategory = indiaFunnelCategoryFromEntry(
        indiaCheckoutSource === 'root_checkout' ? 'root' : 'offer2699',
      );
      resolvedBasePrice = expectedBasePrice;
      resolvedSmartShopperPrice = selectedAddons.smartShopper
        ? INDIA_BLUEPRINT_ADDON_PRICES.smartShopper
        : 0;
      resolvedOutfitPreviewPrice = selectedAddons.outfitPreview
        ? INDIA_BLUEPRINT_ADDON_PRICES.outfitPreview
        : 0;
    }

    // Validate required fields
    if (!customer_name || !customer_email || !customer_phone || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json({
        success: false,
        error: 'Payment gateway not configured. Please contact support.'
      }, { status: 500 });
    }

    // Generate unique order ID
    const orderId = `alpha1_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Convert amount to smallest currency unit (paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Save customer to database
    let customerId = 'mock-customer-id';
    let dbOrderId = 'mock-order-id';

    try {
      // OPTIMIZATION #2: Single UPSERT query (was SELECT + INSERT)
      const existingCustomer = await getCustomerByEmail(customer_email);
      const customerAttribution = firstTouchAttribution(existingCustomer, incomingAttribution);
      const customer = await saveCustomer({
        name: customer_name,
        email: customer_email,
        phone: customer_phone,
        ...customerAttribution,
      });

      customerId = customer.id!;
      const orderAttribution = firstTouchAttribution(customer, incomingAttribution);

      // Save order to database with temporary ID first
      const order = await saveOrder({
        customer_id: customer.id!,
        amount,
        add_on: add_ons.presence_guide || add_ons.magnetism_playbook, // Check if any add-ons are selected
        product_type: 'consultation',
        scan_lead_id: scanLeadId,
        report_variant: 'personal_20',
        whatsapp_opt_in: Boolean(whatsappOptIn),
        whatsapp_consent_at: whatsappOptIn ? new Date().toISOString() : null,
        status: 'pending',
        razorpay_order_id: orderId,
        ...orderAttribution,
      });
      dbOrderId = order.id!;

      // Note: Google Sheets integration moved to webhook - only add data after payment completion
    } catch (error) {
      console.log('Supabase not configured, using mock IDs:', error);
    }

    try {
      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      // Create Razorpay order
      const orderRequest = {
        amount: amountInSmallestUnit,
        currency: currency || 'INR',
        receipt: orderId,
        notes: {
          customer_name: customer_name,
          customer_email: customer_email,
          customer_phone: customer_phone,
          whatsapp_opt_in: whatsappOptIn ? 'true' : 'false',
          base_product: base_product,
          checkout_source: checkout_source || '',
          // Meta content_category for the browser events on this order. The
          // order.paid webhook reads it back so the server-side Purchase it
          // deduplicates against carries an identical payload.
          funnel_entry: resolvedFunnelCategory || '',
          wardrobe_detox_addon: add_ons.wardrobe_detox ? 'true' : 'false',
          diva_diet_plan_addon: add_ons.diva_diet_plan ? 'true' : 'false',
          smart_shoppers_guide_addon: add_ons.smart_shoppers_guide ? 'true' : 'false',
          outfit_preview_addon: add_ons.outfit_preview ? 'true' : 'false',
          iconik_edit_subscription: add_ons.iconik_edit_subscription ? 'true' : 'false',
          total_base_price: resolvedBasePrice,
          diva_diet_plan_price: diva_diet_plan_price,
          smart_shoppers_guide_price: resolvedSmartShopperPrice,
          outfit_preview_price: resolvedOutfitPreviewPrice,
          service: 'ICONIK Style Guide',
          db_order_id: dbOrderId,
          customer_id: customerId,
          scan_lead_id: scanLeadId || '',
          report_variant: 'personal_20',
          utm_source: incomingAttribution.utm_source || '',
          utm_medium: incomingAttribution.utm_medium || '',
          utm_campaign: incomingAttribution.utm_campaign || '',
          landing_page: incomingAttribution.landing_page || '',
        },
      };

      const razorpayOrder = await razorpay.orders.create(orderRequest);

      if (!razorpayOrder?.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // Update order with real Razorpay ID — MUST complete before webhook arrives
      // (was fire-and-forget which caused a race condition: webhook couldn't find the order)
      const { error: updateIdError } = await supabaseAdmin
        .from('orders')
        .update({ razorpay_order_id: razorpayOrder.id })
        .eq('id', dbOrderId);

      if (updateIdError) {
        console.error('Failed to update order with Razorpay ID:', updateIdError);
      }

      // OPTIMIZATION #3: Return minimal payload - only what frontend needs
      return NextResponse.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInSmallestUnit,
        currency: currency || 'INR',
        customer_id: customerId,
        order_id: orderId,
        db_order_id: dbOrderId,
      });

    } catch (razorpayError) {
      console.error('Razorpay integration error:', razorpayError);

      return NextResponse.json({
        success: false,
        error: 'Payment processing failed. Please try again or contact support.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
