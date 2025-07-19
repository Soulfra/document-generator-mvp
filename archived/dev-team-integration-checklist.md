# Dev Team Integration Checklist: Context Profile, Paywall, and Document Generator

Use this checklist to ensure all parts of the context profile–aware paywall and automation are implemented and linked to the document generator.

---

## 1. Backend
- [ ] Accept `contextProfileId` in payment/upgrade endpoints
- [ ] Log and use profile data for analytics and dynamic offers
- [ ] Ensure premium feature validation uses active profile

## 2. Frontend
- [ ] Track active context profile in global state (React context, Redux, etc.)
- [ ] Personalize paywall modals and upgrade prompts using profile data
- [ ] Pass profile info to backend on payment/upgrade
- [ ] Automate paywall triggers based on profile-feature mismatches

## 3. Analytics
- [ ] Track paywall hits, upgrade attempts, and conversions by profile
- [ ] Analyze which profiles/features drive upgrades
- [ ] Use analytics to trigger targeted onboarding/upsell modals

## 4. Document Generator Integration
- [ ] Ensure document generator uses active context profile for all doc generation
- [ ] Link paywall and upgrade flow to document generator (block premium templates/features for free users)
- [ ] After upgrade, unlock premium doc generation features automatically

## 5. Testing
- [ ] Write tests for all profile/feature/tier combinations
- [ ] Test end-to-end: profile selection → paywall → payment → doc generation

---

*Check off each item as you complete it. For questions, see `/cursor/README.md` or the automation guide.* 