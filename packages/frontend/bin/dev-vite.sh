#!/bin/sh

exec node --env-file-if-exists=../../.env.app --import ./instrument.server.mjs node_modules/vite/bin/vite.js "$@"
