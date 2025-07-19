# Contributing New Automations

Help us build a world-class agentic orchestration OS! Here's how to contribute new automation scripts or modules.

---

## 1. Code Style & Structure
- Use Node.js (ES6+) for scripts
- Place new scripts in `/scripts/`
- Use the `script-template.js` as a starting point
- Add logging and error handling
- Load config from `.env` or `config.json`

## 2. Review & Testing
- Test your script locally before submitting
- Add usage instructions as comments at the top
- Request code review via pull request

## 3. Index & Docs
- Add your script to `automation-index.md` with a short description
- Link to any relevant docs or usage guides
- Update the roadmap if your automation fills a new need

## 4. Best Practices
- Keep scripts modular and single-purpose
- Document all required config/env variables
- Use async/await for async operations
- Handle errors gracefully and log clearly

---

*Thank you for helping automate the future!* 