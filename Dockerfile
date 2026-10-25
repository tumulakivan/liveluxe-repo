# Listing Repo: one Node process serves the API and the built web app.
# Node runs the API's TypeScript directly (type stripping), so only the web app is built.
FROM node:26-slim

WORKDIR /app
RUN npm install -g pnpm@10.34.8

# Dependencies first, so code changes don't reinstall them.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @repo/web build

ENV NODE_ENV=production
# The database and uploaded photos live in /app/data: attach a Railway volume at that path.
EXPOSE 4200
CMD ["node", "apps/api/src/index.ts"]
