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
export declare class StripeService {
    private stripe;
    private demoMode;
    constructor();
    /**
     * Create a payment intent for direct card payment
     */
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    /**
     * Create a Stripe Checkout session
     */
    createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{
        sessionId: string;
        url: string;
    }>;
    /**
     * Retrieve payment intent status
     */
    getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    /**
     * Retrieve checkout session
     */
    getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session>;
    /**
     * Construct webhook event from request
     */
    constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event;
    /**
     * Create a customer
     */
    createCustomer(email: string, name?: string): Promise<Stripe.Customer>;
}
//# sourceMappingURL=StripeService.d.ts.map