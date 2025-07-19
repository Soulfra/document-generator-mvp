# Workflow Examples: Automation Chains

This doc shows example automation workflows and how to chain scripts together for agentic orchestration.

---

## 1. Onboarding Chain
- Send onboarding email (`onboarding-email.js`)
- Post welcome message to Slack (`slack-reminder.js`)
- Assign first task (future: GitHub API)

**Example:**
```bash
node scripts/onboarding-email.js newuser@example.com "New User"
node scripts/slack-reminder.js "Welcome New User to the team!"
```

## 2. Design Handoff
- Sync Figma tokens (`figma-token-sync.js`)
- Notify devs in Slack (`slack-reminder.js`)

**Example:**
```bash
node scripts/figma-token-sync.js
node scripts/slack-reminder.js "Design tokens updated from Figma!"
```

## 3. Deployment Workflow
- Run tests, build, and deploy (CI/CD)
- Generate changelog (`changelog-generator.js`)
- Post deployment status to Slack (`slack-reminder.js`)

**Example:**
```bash
npm run test && npm run build && npm start
node scripts/changelog-generator.js
node scripts/slack-reminder.js "Deployment complete!"
```

---

*Add new workflow examples as your automation OS grows.* 