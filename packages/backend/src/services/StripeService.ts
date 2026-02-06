/**
 * Stripe Payment Service
 * Handles Stripe integration for license purchases
 */

import Stripe from 'stripe';

export interface CreatePaymentIntentParams {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  quantity: number;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private stripe: Stripe | null;
  private demoMode: boolean;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    // Enable demo mode if no valid API key is provided
    this.demoMode = !apiKey || apiKey === 'sk_test_dummy_key' || apiKey.length < 20;

    if (this.demoMode) {
      console.log('⚠️  Stripe running in DEMO MODE - No real payments will be processed');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2026-01-28.clover',
      });
    }
  }

  /**
   * Create a payment intent for direct card payment
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    if (this.demoMode) {
      // Demo mode: return mock data
      const mockIntentId = `pi_demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        clientSecret: `${mockIntentId}_secret_demo`,
        paymentIntentId: mockIntentId,
      };
    }

    try {
      const amount = Math.round(params.price * params.quantity * 100); // Convert to cents

      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount,
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        metadata: {
          productId: params.productId,
          productName: params.productName,
          quantity: params.quantity.toString(),
          ...params.metadata,
        },
        description: `${params.quantity}x ${params.productName}`,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create a Stripe Checkout session
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{
    sessionId: string;
    url: string;
  }> {
    if (this.demoMode) {
      // Demo mode: return mock checkout session
      const mockSessionId = `cs_demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create a demo checkout URL with the success URL
      const demoUrl = params.successUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId);

      console.log('🎭 Demo checkout session created:', {
        sessionId: mockSessionId,
        product: params.productName,
        quantity: params.quantity,
        price: params.price,
        total: params.price * params.quantity,
        currency: params.currency,
      });

      return {
        sessionId: mockSessionId,
        url: demoUrl,
      };
    }

    try {
      const session = await this.stripe!.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: params.productName,
              },
              unit_amount: Math.round(params.price * 100), // Convert to cents
            },
            quantity: params.quantity,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
        metadata: {
          productId: params.productId,
          quantity: params.quantity.toString(),
          ...params.metadata,
        },
      });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      console.error('Stripe checkout session creation error:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Retrieve payment intent status
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (this.demoMode) {
      // Demo mode: return mock payment intent
      return {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        client_secret: `${paymentIntentId}_secret`,
      } as Stripe.PaymentIntent;
    }

    try {
      return await this.stripe!.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Stripe retrieve payment intent error:', error);
      throw new Error('Failed to retrieve payment intent');
    }
  }

  /**
   * Retrieve checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    if (this.demoMode) {
      // Demo mode: return mock session
      return {
        id: sessionId,
        object: 'checkout.session',
        payment_status: 'paid',
        status: 'complete',
        amount_total: 5000,
        currency: 'eur',
        metadata: {},
      } as Stripe.Checkout.Session;
    }

    try {
      return await this.stripe!.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.error('Stripe retrieve checkout session error:', error);
      throw new Error('Failed to retrieve checkout session');
    }
  }

  /**
   * Construct webhook event from request
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    if (this.demoMode) {
      // Demo mode: parse payload as JSON and return mock event
      const data = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());
      return {
        id: `evt_demo_${Date.now()}`,
        object: 'event',
        type: data.type || 'checkout.session.completed',
        data: { object: data },
      } as Stripe.Event;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    try {
      return this.stripe!.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    if (this.demoMode) {
      // Demo mode: return mock customer
      return {
        id: `cus_demo_${Date.now()}`,
        object: 'customer',
        email,
        name,
      } as Stripe.Customer;
    }

    try {
      return await this.stripe!.customers.create({
        email,
        name,
      });
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw new Error('Failed to create customer');
    }
  }
}
