import { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CreateOrderRequest {
  planId: string;
  amount: number;
  currency: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
}

const pricingPlans: PricingPlan[] = [
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
    const { planId, amount, currency }: CreateOrderRequest = req.body;

    // Validate the plan
    const plan = pricingPlans.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    // Validate amount matches the plan price
    if (amount !== plan.price) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: planId,
        planName: plan.name,
        userId: req.headers['user-id'] || 'anonymous', // Get from auth context
      },
    };

    const order = await razorpay.orders.create(options);

    // Log the order creation for audit purposes
    console.log('Order created:', {
      orderId: order.id,
      planId,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Utility function to validate webhook signature
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
