import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use sandbox for testing, production: https://pay.pesapal.com/v3
const PESAPAL_BASE_URL = Deno.env.get('PESAPAL_ENV') === 'production' 
  ? "https://pay.pesapal.com/v3" 
  : "https://cybqa.pesapal.com/pesapalv3";

const CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY');
const CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET');

interface PesapalTokenResponse {
  token: string;
  expiryDate: string;
  error?: any;
  message?: string;
}

interface IPNRegistrationResponse {
  url: string;
  created_date: string;
  ipn_id: string;
  error?: any;
}

interface OrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number?: string;
    country_code: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

async function getPesapalToken(): Promise<string> {
  console.log("Getting Pesapal access token...");
  
  const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Pesapal token error:', error);
    throw new Error(`Failed to get Pesapal token: ${error}`);
  }

  const data: PesapalTokenResponse = await response.json();
  
  if (data.error) {
    throw new Error(`Pesapal token error: ${data.message || JSON.stringify(data.error)}`);
  }
  
  console.log("Pesapal token obtained successfully");
  return data.token;
}

async function registerIPN(token: string, callbackUrl: string): Promise<string> {
  console.log("Registering IPN with callback URL:", callbackUrl);
  
  const response = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: callbackUrl,
      ipn_notification_type: 'GET',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('IPN registration error:', error);
    throw new Error(`Failed to register IPN: ${error}`);
  }

  const data: IPNRegistrationResponse = await response.json();
  
  if (data.error) {
    throw new Error(`IPN registration error: ${JSON.stringify(data.error)}`);
  }
  
  console.log("IPN registered successfully:", data.ipn_id);
  return data.ipn_id;
}

async function submitOrderRequest(token: string, orderData: OrderRequest): Promise<string> {
  console.log("Submitting order request:", orderData.id);
  
  const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Order submission error:', error);
    throw new Error(`Failed to submit order: ${error}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Order submission error: ${JSON.stringify(data.error)}`);
  }
  
  console.log("Order submitted successfully, redirect URL:", data.redirect_url);
  return data.redirect_url;
}

async function getTransactionStatus(token: string, orderTrackingId: string): Promise<any> {
  console.log("Getting transaction status for:", orderTrackingId);
  
  const response = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Transaction status error:', error);
    throw new Error(`Failed to get transaction status: ${error}`);
  }

  const data = await response.json();
  console.log("Transaction status:", data);
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Parse action from query param or path
  const action = url.searchParams.get('action') || url.pathname.split('/').pop();

  console.log("Pesapal request received - method:", req.method, "action:", action, "url:", req.url);

  try {
    // Handle IPN callback - this is called by Pesapal, no auth required
    if (action === 'callback' && req.method === 'GET') {
      return await handleCallback(url);
    }

    // For all other actions, require authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      console.error("User not authenticated - Authorization header:", req.headers.get('Authorization')?.slice(0, 20) + '...');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Please log in to continue' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Handle payment initiation
    if (action === 'initiate' && req.method === 'POST') {
      const { planId, userEmail, userName } = await req.json();
      
      console.log("Initiating payment for plan:", planId, "user:", user.id);

      // Validate required fields
      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing planId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get plan details using service role for reliable access
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: plan, error: planError } = await serviceClient
        .from('payment_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        console.error('Plan fetch error:', planError);
        return new Response(
          JSON.stringify({ error: 'Plan not found or inactive' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique merchant reference
      const merchantReference = `VS-${user.id.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      
      // Create payment record
      const { data: payment, error: paymentError } = await serviceClient
        .from('user_payments')
        .insert({
          user_id: user.id,
          plan_id: planId,
          amount_kes: plan.price_kes,
          payment_status: 'pending',
          pesapal_merchant_reference: merchantReference,
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment record creation error:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Failed to create payment record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("Payment record created:", payment.id);

      // Get Pesapal token
      let token: string;
      try {
        token = await getPesapalToken();
      } catch (tokenError: any) {
        console.error('Pesapal token error:', tokenError);
        // Mark payment as failed
        await serviceClient.from('user_payments').update({ payment_status: 'failed' }).eq('id', payment.id);
        return new Response(
          JSON.stringify({ error: 'Payment service temporarily unavailable. Please try again.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Register IPN callback
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const callbackUrl = `${supabaseUrl}/functions/v1/pesapal-payment?action=callback`;
      
      let ipnId: string;
      try {
        ipnId = await registerIPN(token, callbackUrl);
      } catch (ipnError: any) {
        console.error('IPN registration error:', ipnError);
        await serviceClient.from('user_payments').update({ payment_status: 'failed' }).eq('id', payment.id);
        return new Response(
          JSON.stringify({ error: 'Payment service configuration error. Please contact support.' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the app URL for redirect after payment
      const appUrl = req.headers.get('origin') || 'https://visionswipe.lovable.app';

      // Submit order to Pesapal
      const orderData: OrderRequest = {
        id: merchantReference,
        currency: 'KES',
        amount: plan.price_kes,
        description: `VisionSwipe ${plan.name} Plan - ${formatBytes(plan.storage_limit)} storage`,
        callback_url: `${appUrl}/editor?payment=complete&ref=${merchantReference}`,
        notification_id: ipnId,
        billing_address: {
          email_address: userEmail || user.email || '',
          country_code: 'KE',
          first_name: userName?.split(' ')[0] || 'VisionSwipe',
          last_name: userName?.split(' ').slice(1).join(' ') || 'User',
          phone_number: '',
        },
      };

      let redirectUrl: string;
      try {
        redirectUrl = await submitOrderRequest(token, orderData);
      } catch (orderError: any) {
        console.error('Order submission error:', orderError);
        await serviceClient.from('user_payments').update({ payment_status: 'failed' }).eq('id', payment.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create payment session. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract and save tracking ID
      const trackingIdMatch = redirectUrl.match(/OrderTrackingId=([^&]+)/);
      if (trackingIdMatch) {
        await serviceClient
          .from('user_payments')
          .update({ pesapal_tracking_id: trackingIdMatch[1] })
          .eq('id', payment.id);
      }

      console.log("Payment initiated successfully, redirect URL:", redirectUrl);

      return new Response(
        JSON.stringify({ 
          success: true, 
          redirectUrl,
          merchantReference,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle payment verification
    if (action === 'verify' && req.method === 'POST') {
      const { merchantReference } = await req.json();
      
      console.log("Verifying payment:", merchantReference);

      if (!merchantReference) {
        return new Response(
          JSON.stringify({ error: 'Missing merchantReference' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: payment } = await serviceClient
        .from('user_payments')
        .select('*')
        .eq('pesapal_merchant_reference', merchantReference)
        .eq('user_id', user.id)
        .single();

      if (!payment) {
        return new Response(
          JSON.stringify({ error: 'Payment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (payment.payment_status === 'completed') {
        return new Response(
          JSON.stringify({ success: true, status: 'completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check with Pesapal if we have a tracking ID
      if (payment.pesapal_tracking_id) {
        try {
          const token = await getPesapalToken();
          const status = await getTransactionStatus(token, payment.pesapal_tracking_id);

          const statusDescription = status.payment_status_description?.toLowerCase() || 'pending';

          // Update local status if completed
          if (statusDescription === 'completed' && payment.payment_status !== 'completed') {
            const { data: planData } = await serviceClient
              .from('payment_plans')
              .select('storage_limit')
              .eq('id', payment.plan_id)
              .single();

            await serviceClient
              .from('user_payments')
              .update({
                payment_status: 'completed',
                payment_date: new Date().toISOString(),
                transaction_id: status.confirmation_code,
                payment_method: status.payment_method,
                subscription_start: new Date().toISOString(),
                subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              })
              .eq('id', payment.id);

            if (planData) {
              await serviceClient
                .from('user_storage')
                .upsert({
                  user_id: payment.user_id,
                  storage_limit: planData.storage_limit,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
            }
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              status: statusDescription,
              details: status,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (verifyError) {
          console.error('Pesapal verification error:', verifyError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: payment.payment_status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found', action }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Pesapal payment error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handle IPN callback from Pesapal (no auth required)
async function handleCallback(url: URL): Promise<Response> {
  const orderTrackingId = url.searchParams.get('OrderTrackingId');
  const orderMerchantReference = url.searchParams.get('OrderMerchantReference');

  console.log("IPN callback received:", { orderTrackingId, orderMerchantReference });

  if (!orderTrackingId) {
    console.error('Missing OrderTrackingId in callback');
    return new Response('Missing OrderTrackingId', { status: 400, headers: corsHeaders });
  }

  try {
    // Use service role for callback processing
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get token and check status with Pesapal
    const token = await getPesapalToken();
    const status = await getTransactionStatus(token, orderTrackingId);

    console.log("Transaction status from Pesapal:", status);

    // Find payment record
    const { data: payment, error: paymentError } = await serviceClient
      .from('user_payments')
      .select('*, payment_plans(storage_limit)')
      .or(`pesapal_merchant_reference.eq.${orderMerchantReference},pesapal_tracking_id.eq.${orderTrackingId}`)
      .single();

    if (paymentError || !payment) {
      console.error('Payment record not found:', paymentError);
      return new Response('Payment not found', { status: 404, headers: corsHeaders });
    }

    // Only process if payment status indicates success
    if (status.payment_status_description === 'Completed') {
      // Update payment record
      await serviceClient
        .from('user_payments')
        .update({
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
          transaction_id: status.confirmation_code,
          payment_method: status.payment_method,
          pesapal_tracking_id: orderTrackingId,
          subscription_start: new Date().toISOString(),
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', payment.id);

      // Upgrade user storage
      if (payment.payment_plans?.storage_limit) {
        await serviceClient
          .from('user_storage')
          .upsert({
            user_id: payment.user_id,
            storage_limit: payment.payment_plans.storage_limit,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        console.log("User storage upgraded to:", payment.payment_plans.storage_limit);
      }
    } else if (status.payment_status_description === 'Failed') {
      await serviceClient
        .from('user_payments')
        .update({ payment_status: 'failed' })
        .eq('id', payment.id);
    }

    return new Response('OK', { headers: corsHeaders });
  } catch (error: any) {
    console.error('Callback processing error:', error);
    return new Response('Error processing callback', { status: 500, headers: corsHeaders });
  }
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(0)} GB`;
}
