#!/bin/sh
# Container entry point. Set RUN_RELEASE_ON_START=false when the host runs
# release.sh as a separate pre-deploy step (Railway), so several replicas
# never migrate at the same time.
set -e
if [ "$RUN_RELEASE_ON_START" != "false" ]; then
  sh /app/apps/backend/deploy/release.sh
fi
cd /app/apps/backend/.medusa/server
exec npx medusa start
