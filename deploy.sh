#!/usr/bin/env bash

set -euxo pipefail

git pull
export GIT_COMMIT_SHA=$(git rev-parse HEAD)

source .env.builder

docker compose build \
  --build-arg GIT_COMMIT_SHA="${GIT_COMMIT_SHA}" \
  --build-arg VITE_GIT_COMMIT_SHA="${GIT_COMMIT_SHA}" \
  --build-arg VITE_ENV_NAME=production \
  --build-arg VITE_SENTRY_DSN="${VITE_SENTRY_DSN}" \
  --secret id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN \
  --secret id=SENTRY_ORG,env=SENTRY_ORG \
  --secret id=SENTRY_PROJECT,env=SENTRY_PROJECT

docker compose up --wait --detach

docker compose exec backend pnpm prisma migrate deploy
