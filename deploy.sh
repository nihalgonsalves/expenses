#!/usr/bin/env bash

set -euxo pipefail

git pull
export GIT_COMMIT_SHA=$(git rev-parse HEAD)

source .env.builder

docker compose build \
  --build-arg GIT_COMMIT_SHA=$GIT_COMMIT_SHA \
  --build-arg VITE_GIT_COMMIT_SHA=$GIT_COMMIT_SHA \
  --build-arg VITE_ENV_NAME=production \
  --build-arg VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
  --build-arg SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
  --build-arg SENTRY_ORG=$SENTRY_ORG \
  --build-arg SENTRY_PROJECT=$SENTRY_PROJECT

docker compose up --wait --detach

docker compose exec backend yarn prisma migrate deploy
