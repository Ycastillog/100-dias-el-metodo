declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    CHECKOUT_ENABLED?: string;
    CHECKOUT_ORIGIN?: string;
    PAYPAL_ENV?: 'sandbox' | 'live';
    PAYPAL_CLIENT_ID?: string;
    PAYPAL_CLIENT_SECRET?: string;
    PAYPAL_MERCHANT_ID?: string;
    PAYPAL_WEBHOOK_ID?: string;
  }
}
