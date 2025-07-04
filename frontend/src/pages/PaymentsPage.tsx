import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Shield, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 999,
    currency: 'INR',
    interval: 'month',
    description: 'Perfect for individual developers and small projects',
    icon: <Shield className="h-6 w-6" />,
    features: [
      'Up to 10 smart contract audits per month',
      'Basic vulnerability detection',
      'Standard security reports',
      'Email support',
      'Access to audit history',
      'Basic collaboration tools'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 2999,
    currency: 'INR',
    interval: 'month',
    description: 'Ideal for growing teams and medium-sized projects',
    icon: <Zap className="h-6 w-6" />,
    popular: true,
    features: [
      'Up to 50 smart contract audits per month',
      'Advanced AI-powered vulnerability detection',
      'Detailed security reports with recommendations',
      'Priority email & chat support',
      'Real-time collaboration features',
      'Custom audit templates',
      'Integration with popular IDEs',
      'Advanced analytics dashboard'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    currency: 'INR',
    interval: 'month',
    description: 'For large organizations with complex security needs',
    icon: <Crown className="h-6 w-6" />,
    features: [
      'Unlimited smart contract audits',
      'Enterprise-grade AI security analysis',
      'White-label audit reports',
      '24/7 dedicated support',
      'Advanced team management',
      'Custom integrations & APIs',
      'On-premise deployment options',
      'Compliance reporting (SOC2, ISO27001)',
      'Custom security policies',
      'Dedicated account manager'
    ]
  }
];

const PaymentsPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscription = async (plan: PricingPlan) => {
    setLoading(plan.id);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order on backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
          currency: plan.currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await response.json();

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NovaGuard',
        description: `${plan.name} Plan Subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payments/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id,
              }),
            });

            if (verifyResponse.ok) {
              toast({
                title: 'Payment Successful!',
                description: `Welcome to NovaGuard ${plan.name} plan!`,
              });
              
              // Redirect to dashboard or refresh user data
              window.location.href = '/dashboard';
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: 'Payment Verification Failed',
              description: 'Please contact support if amount was deducted.',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: 'User Name', // Get from user context
          email: 'user@example.com', // Get from user context
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: 'Unable to process payment. Please try again.',
        variant: 'destructive',
      });
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Choose Your Security Plan
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Protect your smart contracts with AI-powered security auditing. 
            Choose the plan that fits your needs and scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-500 shadow-lg scale-105' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.popular 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                    ₹{plan.price.toLocaleString()}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    /{plan.interval}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscription(plan)}
                  disabled={loading === plan.id}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900'
                  }`}
                >
                  {loading === plan.id ? 'Processing...' : `Subscribe to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                We offer a 14-day free trial for all plans. No credit card required to get started.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                We accept all major credit cards, debit cards, UPI, and net banking through Razorpay.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
