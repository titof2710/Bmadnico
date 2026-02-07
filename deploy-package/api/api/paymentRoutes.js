"use strict";
/**
 * Payment API Routes
 * Handles Stripe payment integration for license purchases
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StripeService_js_1 = require("../services/StripeService.js");
const database_js_1 = require("../infrastructure/database.js");
const LicensePoolCommandHandler_js_1 = require("../domain/LicensePoolCommandHandler.js");
const database_js_2 = require("../infrastructure/database.js");
const router = (0, express_1.Router)();
const stripeService = new StripeService_js_1.StripeService();
/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe Checkout session for license purchase
 */
router.post('/create-checkout-session', async (req, res) => {
    try {
        const organizationId = req.organizationId || req.body.organizationId || 'demo-org-1';
        const { productId, productType, quantity, pricePerLicense, templateId, successUrl, cancelUrl } = req.body;
        // Validation
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'productId and valid quantity required' });
        }
        // Pour la démo, utiliser les données fournies directement
        const productData = {
            productId: productId || productType || 'demo-product',
            productName: productType || 'License Pack',
            price: pricePerLicense || 50,
            currency: 'EUR',
            templateId: templateId || 'template-001',
        };
        const { sessionId, url } = await stripeService.createCheckoutSession({
            productId: productData.productId,
            productName: productData.productName,
            price: productData.price,
            currency: productData.currency,
            quantity,
            successUrl: successUrl || `http://localhost:5178/license-pools?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: cancelUrl || `http://localhost:5178/license-pools?canceled=true`,
            metadata: {
                organizationId,
                productId: productData.productId,
                templateId: productData.templateId,
            },
        });
        res.json({
            sessionId,
            url,
        });
    }
    catch (error) {
        console.error('Create checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});
/**
 * POST /api/payments/create-payment-intent
 * Create a Stripe Payment Intent for direct card payment
 */
router.post('/create-payment-intent', async (req, res) => {
    try {
        const organizationId = req.organizationId || 'demo-org-1';
        const { productId, quantity } = req.body;
        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ error: 'productId and valid quantity required' });
        }
        const productStore = (0, database_js_1.getProductProjectionStore)();
        const product = await productStore.getProduct(productId, organizationId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
            productId: product.productId,
            productName: product.name,
            price: product.price,
            currency: product.currency,
            quantity,
            metadata: {
                organizationId,
                productId,
                templateId: product.templateId,
            },
        });
        res.json({
            clientSecret,
            paymentIntentId,
        });
    }
    catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});
/**
 * GET /api/payments/orders
 * Get payment order history for an organization
 */
router.get('/orders', async (req, res) => {
    try {
        const { organizationId } = req.query;
        if (!organizationId) {
            return res.status(400).json({ error: 'organizationId is required' });
        }
        // Pour la démo, générer des commandes fictives
        // En production, cela viendrait d'une base de données de commandes
        const mockOrders = [
            {
                orderId: `order-${Date.now()}-1`,
                organizationId,
                productType: 'Évaluation du Leadership',
                productId: 'product-001',
                quantity: 50,
                amount: 7500,
                currency: 'EUR',
                status: 'completed',
                paymentMethod: 'card',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                orderId: `order-${Date.now()}-2`,
                organizationId,
                productType: 'Évaluation du Leadership',
                productId: 'product-001',
                quantity: 100,
                amount: 15000,
                currency: 'EUR',
                status: 'completed',
                paymentMethod: 'card',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                orderId: `order-${Date.now()}-3`,
                organizationId,
                productType: 'Évaluation du Leadership',
                productId: 'product-001',
                quantity: 25,
                amount: 3750,
                currency: 'EUR',
                status: 'pending',
                paymentMethod: 'card',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                completedAt: null,
            },
        ];
        res.json({
            orders: mockOrders,
            total: mockOrders.length,
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});
/**
 * GET /api/payments/session/:sessionId
 * Get Stripe Checkout session status
 */
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await stripeService.getCheckoutSession(sessionId);
        res.json({
            sessionId: session.id,
            paymentStatus: session.payment_status,
            status: session.status,
            amountTotal: session.amount_total,
            currency: session.currency,
            metadata: session.metadata,
        });
    }
    catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
});
/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing stripe-signature header' });
        }
        // Parse webhook event
        const event = stripeService.constructWebhookEvent(req.body, signature);
        console.log('Stripe webhook event:', event.type);
        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const metadata = session.metadata;
                // Add licenses to pool
                const organizationId = metadata.organizationId;
                const productId = metadata.productId;
                const quantity = Math.floor((session.amount_total || 0) / 100); // Simplified calculation
                // Find or create license pool for this product
                const licensePoolStore = (0, database_js_1.getLicensePoolProjectionStore)();
                const existingPool = await licensePoolStore.getPoolByProduct(organizationId, productId);
                if (existingPool) {
                    // Add licenses to existing pool
                    const eventStore = (0, database_js_2.getEventStore)();
                    const commandHandler = new LicensePoolCommandHandler_js_1.LicensePoolCommandHandler(eventStore);
                    await commandHandler.addLicenses({
                        poolId: existingPool.poolId,
                        organizationId,
                        quantity,
                        orderId: session.id,
                    });
                    // Update projection
                    const events = await eventStore.getEvents(existingPool.poolId, organizationId);
                    const lastEvent = events[events.length - 1];
                    await licensePoolStore.applyEvent(lastEvent);
                    console.log(`Added ${quantity} licenses to pool ${existingPool.poolId}`);
                }
                break;
            }
            case 'payment_intent.succeeded': {
                console.log('Payment succeeded:', event.data.object);
                break;
            }
            case 'payment_intent.payment_failed': {
                console.log('Payment failed:', event.data.object);
                break;
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook error' });
    }
});
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map