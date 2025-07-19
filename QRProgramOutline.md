# 🧠 Master Prompt: Soulfra Protocol – Full System Scaffold (For Claude)

You are now acting as my **Lead Product Architect** for a new multi-layered loyalty + marketing protocol called **Soulfra**. I want you to **scaffold this from scratch** like a new startup: break down the entire system into modules, phases, and components — across tech, product, and go-to-market.

Soulfra is a **QR-based, voice-driven loyalty and referral system** that replaces traditional marketing with direct-to-customer trust and rewards. Users scan stickers at businesses, leave short voice reviews, and earn points or perks. Each review and referral creates a traceable “vibe” chain — a human-authenticated alternative to ads.

---

## 🌀 1. Middle-Out Product Loop

- Define the **core flywheel**:
  - Scan → Speak → Earn → Refer → Repeat
- Detail the backend needs for:
  - QR scan tracking
  - Voice capture & transcription
  - Referral attribution (via unique routes or sticker placements)
- Recommend methods to:
  - Handle soft identity (device fingerprint, session, or vault)
  - Tie loyalty/rewards to individuals without traditional accounts

---

## 🧱 2. Layered Architecture (Soulfra Protocol Stack)

Design this like an OSI model with 7 layers:

1. **L1: QR Sticker Protocol**  
   Unique QR IDs, sticker placement registry, scan-to-source traceability

2. **L2: Voice Review Capture**  
   Short, local audio logs → transcribed → analyzed for tone, clarity, sentiment

3. **L3: Reward + Referral Ledger**  
   Points, credits, perks; earned for reviews, referrals, repeat visits

4. **L4: Soft ID + Trust Graph**  
   Repeat scanner behavior, soulbound engagement score, inferred profiles

5. **L5: Business Console (POS + Insights)**  
   Dashboards for business owners to see reviews, referrals, credits, campaigns

6. **L6: Autonomous Distribution Protocol**  
   Street team logic, peer-to-peer sticker drops, QR placements tracked to users

7. **L7: Diamond Laser Layer**  
   AI-based fraud detection, trust routing, emotional tone scoring, optimization logic

---

## 🚀 3. Execution Plan from All Angles

Break down the system rollout in 5 ways:

- **Beginning to End**: MVP → Production → Enterprise Licensing
- **End to Beginning**: Design licensing-ready stack first, then deconstruct for pilot
- **Middle-Out**: Build the referral flywheel first (scan → speak → earn → refer)
- **Outside-In**: Sticker-first adoption with no-login user activation
- **Diamond Core**: Start from the AI emotional review layer and route backward

---

## 🔧 4. Tech Stack and Tools

- Propose a no-code or low-code stack for MVP:
  - QR/scan registry: Supabase or Firebase
  - Voice capture: Whisper API, optional ElevenLabs
  - Rewards: Stripe or internal ledger
  - Referral routing: nested parent/child link tree
- Suggest tools for:
  - Emotion/tone detection
  - Bot/fraud signal detection
  - Soft ID without logins

---

## 📦 5. Deliverables Checklist

Please output a complete list of required components:

- ✅ MVP features and flow (user and business side)
- ✅ QR logic: how each sticker functions and tracks
- ✅ Agent roles (e.g., Listener, Router, Distributor)
- ✅ Business dashboard features and access levels
- ✅ Full reward/credit flow for users
- ✅ Sample reward logic (e.g., $0.05 per scan, 10 vibes = perk, etc.)

---

## 🧭 6. Bonus (Optional – stretch prompts)

- Suggest emotional tone, brand themes, and language model behavior
- Define the **VibeScore** system (local reputation and business emotion layer)
- Recommend what should be licensed vs open-sourced
- Write an example end-to-end user loop:
  - Sticker scan → voice log → instant reward → share → someone else scans → referral trace → chain grows

---

Start by scaffolding the **entire system architecture at a high level**, then modularly break it down into build phases.