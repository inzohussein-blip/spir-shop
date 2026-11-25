#!/bin/sh
# One-time tasks of a release: database migrations, first admin, optional demo data.
# Railway runs this as the pre-deploy command (once per deploy, before traffic
# moves to the new version). Other Docker hosts run it from start.sh.
set -e
cd /app/apps/backend/.medusa/server
npx medusa db:migrate
npx medusa exec ./src/scripts/seed-admin.js
if [ "$SEED_DEMO" = "true" ]; then
  npx medusa exec ./src/scripts/seed-demo-brands.js
  npx medusa exec ./src/scripts/seed-demo-sale.js
  npx medusa exec ./src/scripts/seed-figma-layout.js
  npx medusa exec ./src/scripts/seed-demo-tenant.js
fi
