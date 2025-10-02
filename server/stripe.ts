import Stripe from "stripe";

// Graceful degradation for missing Stripe configuration
const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

if (!STRIPE_ENABLED) {
  console.warn('Stripe not configured - payment features will be disabled');
}

export const stripe = STRIPE_ENABLED 
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-07-30.basil",
    })
  : null;

export const isStripeEnabled = () => STRIPE_ENABLED;

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  pro: {
    name: "Pro",
    price: 1900, // $19.00 in cents
    currency: "usd",
    interval: "month",
    features: {
      analysisLimit: -1, // unlimited
      apiCalls: 1000,
      pdfExport: true,
      prioritySupport: false,
      customCriteria: false,
      bulkAnalysis: false,
    }
  },
  enterprise: {
    name: "Enterprise", 
    price: 9900, // $99.00 in cents
    currency: "usd",
    interval: "month",
    features: {
      analysisLimit: -1, // unlimited
      apiCalls: -1, // unlimited
      pdfExport: true,
      prioritySupport: true,
      customCriteria: true,
      bulkAnalysis: true,
    }
  }
} as const;

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export function getSubscriptionLimits(tier: SubscriptionTier) {
  switch (tier) {
    case 'free':
      return {
        analysisLimit: 5, // per day
        apiCalls: 0,
        pdfExport: false,
        prioritySupport: false,
        customCriteria: false,
        bulkAnalysis: false,
      };
    case 'pro':
      return SUBSCRIPTION_PLANS.pro.features;
    case 'enterprise':
      return SUBSCRIPTION_PLANS.enterprise.features;
    default:
      return getSubscriptionLimits('free');
  }
}

export async function createOrRetrieveStripeCustomer(email: string, userId: string) {
  try {
    // Try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        userId: userId,
      },
    });

    return customer;
  } catch (error) {
    console.error("Error creating/retrieving Stripe customer:", error);
    throw error;
  }
}

export async function createSubscription(customerId: string, planType: keyof typeof SUBSCRIPTION_PLANS) {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    
    // Create a price for this subscription
    const price = await stripe.prices.create({
      unit_amount: plan.price,
      currency: plan.currency,
      recurring: {
        interval: plan.interval,
      },
      product_data: {
        name: `RepoAnalyzer ${plan.name} Plan`,
      },
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: price.id,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}