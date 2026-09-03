# NODE_VERSION
FROM mcr.microsoft.com/devcontainers/javascript-node:26

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# "Pin versions in npm"
# hadolint ignore=DL3016
RUN npm install -g corepack && corepack enable
