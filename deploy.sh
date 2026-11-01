#!/usr/bin/env bash

set -euxo pipefail

git pull
export GIT_COMMIT_SHA=$(git rev-parse HEAD)

# Build args and secrets (VITE_SENTRY_DSN, SENTRY_*) are read from the
# environment by compose.yml
set -a
source .env.builder
set +a

docker compose build
docker compose up --wait --detach
