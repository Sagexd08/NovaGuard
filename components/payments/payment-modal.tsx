'use client'

// =============================================
// NOVAGUARD PAYMENT MODAL
// Multi-gateway payment interface
// =============================================

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Check, 
  Loader2, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Crown
} from 'lucide-react'
import { CREDIT_PACKAGES, type CreditPackage, PaymentService } from '@/lib/payments/payment-service'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPackage?: CreditPackage
  onPaymentSuccess?: (result: any) => void
}

// Stripe Payment Form Component
function StripePaymentForm({ 
  packageId, 
  onSuccess, 
  onError 
}: { 
  packageId: CreditPackage
  onSuccess: (result: any) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentService] = useState(() => new PaymentService())

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !user) {
      onError('Payment system not ready')
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent
      const { clientSecret } = await paymentService.createStripePayment(user.id, packageId)

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user.fullName || user.firstName || 'Anonymous',
            email: user.emailAddresses[0]?.emailAddress
          }
        }
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess({ paymentIntentId: paymentIntent.id, method: 'stripe' })
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${CREDIT_PACKAGES[packageId].price}
          </>
        )}
      </Button>
    </form>
  )
}

// Crypto Payment Component
function CryptoPayment({ 
  packageId, 
  onSuccess, 
  onError 
}: { 
  packageId: CreditPackage
  onSuccess: (result: any) => void
  onError: (error: string) => void
}) {
  const { user } = useUser()
  const [paymentService] = useState(() => new PaymentService())
  const [paymentRequest, setPaymentRequest] = useState<any>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'USDC' | 'ETH'>('USDC')
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'polygon'>('polygon')
  const [transactionHash, setTransactionHash] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const createPaymentRequest = async () => {
    if (!user) return

    try {
      const request = await paymentService.createCryptoPayment(
        user.id,
        packageId,
        selectedCurrency,
        selectedChain
      )
      setPaymentRequest(request)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create payment request')
    }
  }

  const verifyPayment = async () => {
    if (!paymentRequest || !transactionHash || !user) return

    setIsVerifying(true)
    try {
      const success = await paymentService.verifyCryptoPayment(
        paymentRequest.paymentId,
        transactionHash,
        user.primaryWeb3Wallet?.web3Wallet || ''
      )

      if (success) {
        onSuccess({ transactionHash, method: 'crypto' })
      } else {
        onError('Payment verification failed')
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-4">
      {!paymentRequest ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Currency</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={selectedCurrency === 'USDC' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCurrency('USDC')}
                >
                  USDC
                </Button>
                <Button
                  variant={selectedCurrency === 'ETH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCurrency('ETH')}
                >
                  ETH
                </Button>
              </div>
            </div>

            <div>
              <Label>Network</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={selectedChain === 'polygon' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChain('polygon')}
                >
                  Polygon
                </Button>
                <Button
                  variant={selectedChain === 'ethereum' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChain('ethereum')}
                >
                  Ethereum
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={createPaymentRequest} className="w-full">
            <Wallet className="h-4 w-4 mr-2" />
            Create Payment Request
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amount</span>
              <span className="font-mono">
                {paymentRequest.amount} {selectedCurrency}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recipient</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {paymentRequest.recipientAddress.slice(0, 6)}...{paymentRequest.recipientAddress.slice(-4)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentRequest.recipientAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network</span>
              <Badge variant="outline">{selectedChain}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-hash">Transaction Hash</Label>
            <Input
              id="tx-hash"
              placeholder="Enter transaction hash after payment"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
            />
          </div>

          <Button
            onClick={verifyPayment}
            disabled={!transactionHash || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Payment
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Send the exact amount to the recipient address, then enter the transaction hash above
          </p>
        </div>
      )}
    </div>
  )
}

// UPI Payment Component
function UPIPayment({ 
  packageId, 
  onSuccess, 
  onError 
}: { 
  packageId: CreditPackage
  onSuccess: (result: any) => void
  onError: (error: string) => void
}) {
  const { user } = useUser()
  const [paymentService] = useState(() => new PaymentService())
  const [paymentUrl, setPaymentUrl] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const createUPIPayment = async () => {
    if (!user) return

    try {
      const { paymentUrl, paymentId } = await paymentService.createUPIPayment(
        user.id,
        packageId,
        'novaguard@upi' // Your UPI ID
      )
      setPaymentUrl(paymentUrl)
      setPaymentId(paymentId)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create UPI payment')
    }
  }

  const verifyUPIPayment = async () => {
    if (!paymentId || !transactionRef) return

    setIsVerifying(true)
    try {
      const success = await paymentService.validateUPIPayment(
        paymentId,
        transactionRef,
        CREDIT_PACKAGES[packageId].price * 83 // Convert to INR
      )

      if (success) {
        onSuccess({ transactionRef, method: 'upi' })
      } else {
        onError('UPI payment verification failed')
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const openUPIApp = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      {!paymentUrl ? (
        <Button onClick={createUPIPayment} className="w-full">
          <Smartphone className="h-4 w-4 mr-2" />
          Create UPI Payment
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-center space-y-3">
            <p className="text-sm font-medium">
              Amount: ₹{(CREDIT_PACKAGES[packageId].price * 83).toFixed(0)}
            </p>
            <Button onClick={openUPIApp} className="w-full">
              <Smartphone className="h-4 w-4 mr-2" />
              Pay with UPI App
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi-ref">Transaction Reference</Label>
            <Input
              id="upi-ref"
              placeholder="Enter UPI transaction reference"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>

          <Button
            onClick={verifyUPIPayment}
            disabled={!transactionRef || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Payment
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Complete the payment in your UPI app, then enter the transaction reference above
          </p>
        </div>
      )}
    </div>
  )
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  selectedPackage = 'starter',
  onPaymentSuccess 
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState('stripe')
  const [selectedPackageId, setSelectedPackageId] = useState<CreditPackage>(selectedPackage)

  const handlePaymentSuccess = (result: any) => {
    toast.success('Payment successful! Credits have been added to your account.')
    onPaymentSuccess?.(result)
    onClose()
  }

  const handlePaymentError = (error: string) => {
    toast.error(error)
  }

  const getPackageIcon = (packageId: CreditPackage) => {
    switch (packageId) {
      case 'starter': return <Zap className="h-5 w-5" />
      case 'professional': return <Shield className="h-5 w-5" />
      case 'enterprise': return <Crown className="h-5 w-5" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package and payment method to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Package</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(CREDIT_PACKAGES).map(([key, package_]) => (
                <Card 
                  key={key}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedPackageId === key ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedPackageId(key as CreditPackage)}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2">
                      {getPackageIcon(key as CreditPackage)}
                    </div>
                    <CardTitle className="capitalize">{key}</CardTitle>
                    <CardDescription>{package_.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold">${package_.price}</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      {package_.credits} credits
                    </div>
                    <div className="space-y-1">
                      {package_.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Method</h3>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stripe">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="crypto">
                  <Wallet className="h-4 w-4 mr-2" />
                  Crypto
                </TabsTrigger>
                <TabsTrigger value="upi">
                  <Smartphone className="h-4 w-4 mr-2" />
                  UPI
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stripe" className="space-y-4">
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    packageId={selectedPackageId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              </TabsContent>

              <TabsContent value="crypto" className="space-y-4">
                <CryptoPayment
                  packageId={selectedPackageId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </TabsContent>

              <TabsContent value="upi" className="space-y-4">
                <UPIPayment
                  packageId={selectedPackageId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Secure Payment</p>
              <p className="text-xs text-muted-foreground">
                All payments are processed securely. We never store your payment information.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentModal
