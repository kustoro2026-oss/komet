// @komet/payment - Payment gateway abstraction
export type PaymentProviderType = "paypal" | "duitku";
export type PaymentPlan = "free" | "creator" | "pro" | "business";

export interface CheckoutParams {
  plan: PaymentPlan;
  userId: string;
  email: string;
  name: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  transactionId: string;
}

export interface Invoice {
  id: string;
  transactionId: string;
  plan: PaymentPlan;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  paidAt?: string;
  createdAt: string;
}

// ===== Payment Provider Interface =====
export interface PaymentProvider {
  readonly type: PaymentProviderType;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
  getInvoices(userId: string): Promise<Invoice[]>;
  verifyWebhook(payload: unknown, signature: string): Promise<boolean>;
}

// ===== PayPal Provider =====
export class PayPalProvider implements PaymentProvider {
  readonly type: PaymentProviderType = "paypal";

  private getConfig() {
    return {
      clientId: process.env.PAYPAL_CLIENT_ID || "",
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
      baseUrl: process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com",
    };
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const planPrices: Record<PaymentPlan, string> = {
      free: "0.00",
      creator: "9.00",
      pro: "39.00",
      business: "99.00",
    };
    return {
      checkoutUrl: `https://www.paypal.com/checkout?plan=${params.plan}&user=${params.userId}`,
      transactionId: `paypal_${Date.now()}`,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return true;
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    return [];
  }

  async verifyWebhook(payload: unknown, signature: string): Promise<boolean> {
    return true;
  }
}

// ===== Duitku Provider =====
export class DuitkuProvider implements PaymentProvider {
  readonly type: PaymentProviderType = "duitku";

  private getConfig() {
    return {
      merchantCode: process.env.DUITKU_MERCHANT_CODE || "",
      apiKey: process.env.DUITKU_API_KEY || "",
      baseUrl: process.env.DUITKU_API_URL || "https://api-sandbox.duitku.com",
    };
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    return {
      checkoutUrl: `https://checkout.duitku.com/${params.plan}/${params.userId}`,
      transactionId: `duitku_${Date.now()}`,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return true;
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    return [];
  }

  async verifyWebhook(payload: unknown, signature: string): Promise<boolean> {
    return true;
  }
}

// ===== Payment Service =====
export class PaymentService {
  private providers: Map<PaymentProviderType, PaymentProvider> = new Map();

  constructor() {
    this.providers.set("paypal", new PayPalProvider());
    this.providers.set("duitku", new DuitkuProvider());
  }

  getProvider(type: PaymentProviderType): PaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) throw new Error(`Payment provider "${type}" not found`);
    return provider;
  }

  async createCheckout(type: PaymentProviderType, params: CheckoutParams): Promise<CheckoutResult> {
    return this.getProvider(type).createCheckout(params);
  }
}
