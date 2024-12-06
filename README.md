# expenses

Shared expense tracking app with support for multiple personal and shared
sheets.

| Main data table         | Add transaction dialog         |
| ----------------------- | ------------------------------ |
| ![Main data table][i01] | ![Add transaction dialog][i02] |

[i01]: ./docs/01-home.webp
[i02]: ./docs/02-add-transaction.webp

## Summary

The primary motivation for building this app was to consolidate my expense
tracking across different apps for personal and shared expenses. I was using a
simple iOS app to enter my personal expenses, while also manually copying over
expenses from shared expense tracking apps/web apps.

This app gives you a unified view of how much you _spent_, regardless of whether
you spent it directly or somebody paid on your behalf.

It's also designed to not be linked directly to bank or debit/credit card
transactions, as that required a lot of manual fixing up of categories or
descriptions, in my experience.

[ecb_data]: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html

## Features

- Installable mobile app with offline capability (PWA)
- Themes and light/dark/system mode
- Push Notifications for shared transactions
- Multi currency support with automatic conversion ([ECB data][ecb_data])
- Split transactions evenly, or by participants, shares, percentages, or exact
  amounts
- Schedule personal transactions on a monthly or weekly schedule
- Settle up with automatically calculated amounts
- Expense import (CSV) and export (CSV/JSON)

## Built with

- React, Vite, Tailwind CSS, Radix/shadcn, Motion
- tRPC, React Query
- Hono, BullMQ, Prisma, Postgres, Redis
- Playwright, Vitest
- Prettier, ESLint

## Initial dev setup

If using GitHub Codespaces or a Dev Container, skip to step 5.

1. Configure local environment variables

   ```sh
   yarn be prepare:local
   ```

2. Start dev services

   ```sh
   docker compose -f compose.local.yml up
   ```

3. Migrate databases

   ```sh
   yarn be prisma migrate dev
   ```

4. Start dev servers

   ```sh
   yarn dev
   ```

5. Optional: Generate demo data

   Dev server must be running

   ```sh
   yarn be prepare:demo
   ```

   Login with `user@example.com` and `password1234` (see
   `packages/backend/bin/demo.ts` for more details)

## Additional deployment setup

Docker build args:

- GIT_COMMIT_SHA
- VITE_GIT_COMMIT_SHA
- VITE_ENV_NAME
- VITE_SENTRY_DSN
- SENTRY_AUTH_TOKEN
- SENTRY_ORG
- SENTRY_PROJECT
