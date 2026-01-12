# Run Tests

Run the test suite for the Book of Life blog application.

## Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

**Test files location:** `src/__tests__/`

Current tests:
- `lib/utils.test.ts` - Utility function tests (16 tests)
- `components/button.test.tsx` - Button component tests (8 tests)

## E2E Tests (Playwright)

**Prerequisites:** Dev server must be running on port 3001

```bash
# Start the dev server first
npm run dev

# Run E2E tests (in another terminal)
npm run test:e2e

# Run specific browser only
npx playwright test --project=chromium

# Run with UI mode
npx playwright test --ui

# Run specific test file
npx playwright test e2e/home.spec.ts
```

**Test files location:** `e2e/`

## Quick Test Commands

```bash
# Unit tests only (fast)
npm test -- --run

# E2E with Chromium only (faster than all browsers)
npx playwright test --project=chromium
```

## Test Coverage

- **Unit Tests:** 24 tests
- **E2E Tests:** 14 tests
- **Browsers tested:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
