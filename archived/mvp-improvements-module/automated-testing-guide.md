# Automated Testing Guide

This guide explains how to run, interpret, and add automated tests for FinishThisIdea.

---

## 1. Running Tests
- **Unit Tests:** `npm run test` (or `npm test`)
- **Integration Tests:** `npm run test:e2e`
- **Coverage Report:** `npm run test:coverage`
- **Watch Mode:** `npm run test:watch`

## 2. Interpreting Results
- All tests should pass before merging or deploying
- Review coverage reports for untested code
- Fix or skip flaky tests only with team approval

## 3. Adding New Tests
- Place unit tests in `tests/` (e.g., `utils/`, `api/`)
- Use React Testing Library for frontend components
- Use Playwright or similar for E2E (future)
- Write tests for all new features and bug fixes

## 4. Best Practices
- Aim for >80% coverage
- Test user interactions, not just implementation
- Mock external APIs and services
- Test accessibility and edge cases

---

*Update this guide as your testing strategy evolves.* 