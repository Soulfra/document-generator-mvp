# API Contract Template: Context Profile–Aware Paywall & Stripe Integration

This document specifies the API endpoints, request/response formats, and required fields for integrating context profiles with the paywall and Stripe payment flow.

---

## 1. Create Stripe Checkout Session

**Endpoint:** `POST /api/payment/checkout`

**Request Body:**
```json
{
  "userId": "string",           // Required: User's unique ID
  "amount": 100,                 // Required: Amount in cents
  "contextProfileId": "string"  // Optional: Active context profile ID
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/session/abc123"
  }
}
```

---

## 2. Stripe Webhook (Tier Upgrade)

**Endpoint:** `POST /api/payment/webhook`

**Stripe Event:** `checkout.session.completed`

**Payload:**
- Stripe sends the session object, which should include metadata for `userId` and optionally `contextProfileId`.

**Backend Action:**
- On successful payment, upgrade the user's tier in the database.
- Optionally log `contextProfileId` for analytics.

---

## 3. Premium Feature Validation

**Example:** When a user attempts a premium action (e.g., batch processing)

**Backend checks:**
- User's tier (free/premium)
- Active context profile (if relevant)

**Error Response (if blocked):**
```json
{
  "success": false,
  "error": "Batch processing is a premium feature. Upgrade to unlock.",
  "upgradeRequired": true,
  "feature": "batch-processing"
}
```

---

*Update this contract as endpoints or requirements change. For questions, see the module README.* 