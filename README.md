# expenses

## Initial dev setup

1. Configure local environment variables

   ```sh
   yarn be prepare:local
   ```

2. Start dev services

   ```sh
   docker compose -f compose.local.yaml up
   ```

3. Migrate databases

   ```sh
   yarn be prisma migrate dev
   ```

4. Start dev servers

   ```sh
   yarn dev
   ```

## Additional deployment setup

Docker build args:

- GIT_COMMIT_SHA
- VITE_GIT_COMMIT_SHA
- VITE_ENV_NAME
- VITE_SENTRY_DSN
- SENTRY_AUTH_TOKEN
- SENTRY_ORG
- SENTRY_PROJECT
