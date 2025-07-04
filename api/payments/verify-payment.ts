import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
}

interface Subscription {
  id?: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'inactive' | 'cancelled';
  amount: number;
  currency: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

const pricingPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 999,
    currency: 'INR',
    interval: 'month',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 2999,
    currency: 'INR',
    interval: 'month',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    currency: 'INR',
    interval: 'month',
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    }: VerifyPaymentRequest = req.body;

    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get plan details
    const plan = pricingPlans.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Get user ID from auth context (you'll need to implement this based on your auth system)
    const userId = req.headers['user-id'] as string || 'anonymous';

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

    // Create subscription record
    const subscription: Subscription = {
      user_id: userId,
      plan_id: planId,
      plan_name: plan.name,
      status: 'active',
      amount: plan.price,
      currency: plan.currency,
      razorpay_order_id,
      razorpay_payment_id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    };

    // Save subscription to database
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.error('Error saving subscription:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    // Update user's plan in the users table
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        current_plan: planId,
        plan_status: 'active',
        subscription_id: data.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userUpdateError) {
      console.error('Error updating user plan:', userUpdateError);
      // Don't fail the request, but log the error
    }

    // Log successful payment
    console.log('Payment verified successfully:', {
      userId,
      planId,
      subscriptionId: data.id,
      razorpay_payment_id,
      amount: plan.price,
      timestamp: new Date().toISOString(),
    });

    // Send success response
    res.status(200).json({
      success: true,
      subscription: data,
      message: 'Payment verified and subscription activated',
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Payment verification failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Utility function to handle subscription renewal
export async function renewSubscription(subscriptionId: string) {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate new end date
    const newEndDate = new Date(subscription.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + 1);

    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        end_date: newEndDate.toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error renewing subscription:', error);
    return { success: false, error };
  }
}

// Utility function to cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      throw error;
    }

    // Update user's plan status
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        plan_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId);

    if (userUpdateError) {
      console.error('Error updating user plan status:', userUpdateError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { success: false, error };
  }
}
