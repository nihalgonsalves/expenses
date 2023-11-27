# expenses

## Initial dev setup

1. Configure local environment variables

   ```sh
   yarn be node ./bin/prepare-local-env.mjs
   ```

2. Start dev services

   ```sh
   docker compose -f compose.dev.yaml up
   ```

3. Migrate databases

   ```sh
   yarn be prisma migrate dev
   ```

4. Start dev servers

   ```sh
   yarn dev
   ```
