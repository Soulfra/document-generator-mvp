# Context Profile–Aware Paywall & Automation Guide

This guide explains how to integrate user context profiles into the premium paywall and Stripe payment flow, and how to automate feature gating, analytics, and onboarding for a personalized, scalable experience.

---

## 1. Context Profile–Aware Paywall
- **Personalize paywall modals** based on the user's active context profile (e.g., highlight relevant premium features).
- **Dynamic upgrade messaging:** Use profile data to tailor upgrade prompts ("Upgrade to unlock batch processing for your Python projects!").

## 2. Automated Feature Gating
- **On profile switch or selection:**
  - Check which premium features are relevant/locked for the profile.
  - Trigger paywall modal automatically if a free user attempts a locked feature.
- **Frontend:** Use React context or global state to track active profile and capabilities.

## 3. Stripe Payment Flow with Profile Data
- **Pass context profile info** to backend when creating a Stripe session:
  ```typescript
  await apiClient.createPayment({
    amount: 100, // or dynamic
    userId: currentUser.id,
    contextProfileId: activeProfile.id,
  });
  ```
- **Backend:**
  - Accept and log `contextProfileId` for analytics.
  - Optionally adjust pricing/offers based on profile.

## 4. Analytics & Automation
- **Track:**
  - Which profiles drive the most upgrade attempts/conversions.
  - Feature usage by profile type.
- **Automate onboarding:**
  - Show targeted "Did you know?" modals for new profiles.
  - Use analytics to trigger upgrade prompts based on profile usage.

## 5. Testing & QA
- Write tests simulating users with different profiles attempting premium actions.
- Ensure paywall triggers and upgrade flows work for all profile types.

---

## Example Workflow
1. User selects or creates a context profile.
2. User attempts a premium action (e.g., batch processing).
3. App checks if feature is locked for their tier/profile.
4. If locked, show paywall modal with profile-relevant messaging.
5. On upgrade, pass profile info to backend/Stripe.
6. After payment, unlock features and update analytics.

---

*Coordinate with backend and analytics teams to ensure all endpoints and tracking are in place. For questions, see `/cursor/README.md`.* 