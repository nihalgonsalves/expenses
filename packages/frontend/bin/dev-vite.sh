#!/bin/sh

exec node --env-file-if-exists=../../.env.app node_modules/vite/bin/vite.js "$@"
