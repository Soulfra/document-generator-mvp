# Frontend Paywall & Stripe Integration Guide

This guide outlines the steps for implementing the frontend paywall UI and Stripe payment flow for premium features in the FinishThisIdea project.

---

## 1. Paywall Modal Implementation
- **Trigger Modal:** When a free user attempts a premium action (e.g., uploading a large file, selecting a premium template, batch processing), trigger a modal explaining the feature and prompting upgrade.
- **Upgrade CTA:** Include a clear "Go Premium" button in the modal.
- **UX Best Practices:**
  - Use lock icons and tooltips for premium-only features.
  - Provide a feature comparison (Free vs Premium) in the modal.
  - Ensure modals are accessible and mobile-friendly.

## 2. Stripe Payment Flow
- **Initiate Payment:** On "Go Premium", call the backend endpoint (e.g., `POST /api/payment/checkout`) to create a Stripe Checkout session.
- **Redirect:** Redirect the user to the Stripe Checkout URL returned by the backend.
- **Post-Payment:** After successful payment, handle the Stripe webhook (already implemented backend) to upgrade the user's tier.
- **Frontend Feedback:**
  - Show a confirmation message and unlock premium features after upgrade.
  - Optionally, refresh user data/state to reflect new tier.

## 3. Feature Access Control
- **Lock Premium Features:**
  - Disable or visually lock premium options for free users.
  - Attempting to access should always trigger the paywall modal.
- **After Upgrade:**
  - Unlock premium features immediately after payment confirmation.
  - Remove upgrade prompts for premium users.

## 4. Analytics (Optional but Recommended)
- Track paywall modal views, upgrade attempts, and successful upgrades for conversion analysis.
- Use the analytics utility (`src/utils/analytics.ts`) or integrate with an external service (Mixpanel, GA4).

## 5. Testing
- Test all paywall triggers and payment flows for both free and premium users.
- Ensure error handling and upgrade messaging are clear.

---

**Reference Backend Endpoints:**
- `POST /api/payment/checkout` (create Stripe session)
- Stripe webhook (handles tier upgrade)
- Premium feature validation (see backend error responses for upgrade prompts)

---

*Coordinate with the backend team to ensure all endpoints and webhooks are live. For questions, see `/cursor/README.md` or contact the project lead.* 