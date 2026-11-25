# Listing Repo

Live Luxe AU's internal property reference: every property and its details, built from Hostaway, with an admin dashboard and CSV/PDF reports.

- **Main app (`/`)**: staff browse existing properties (Card, Tile, List), search and filter, and open a property's full details. No sign-in.
- **Dashboard (`/admin`)**: two account types.
  - **Admins** (the systems team): overview and Sync Hostaway, properties (edit, remove/restore), approving onboarding listings and adding their Hostaway ID, reports, missing fields, platforms, accounts and access tokens.
  - **Contributors**: see every property, and create and edit onboarding listings.
- **Onboarding listings**: created with "Create new listing", seen only by people signed in. An admin approves one, then adds its Hostaway ID once it's listed there; the next Sync Hostaway replaces it with the Hostaway listing, keeping typed values where Hostaway has none.

Product and design context: [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md).

## Stack

pnpm workspaces: `apps/api` (Hono on Node, `node:sqlite`), `apps/web` (React, Vite, Tailwind), `packages/shared` (field registry, filters, formatting). The API runs its TypeScript directly on Node (type stripping), so there's no API build step.

## Run locally

Needs Node 24+ and pnpm 10.

```sh
pnpm install
cp .env.example .env        # fill in HOSTAWAY_ACCT_ID and HOSTAWAY_API_KEY
pnpm sync                   # import every Hostaway listing into data/listing-repo.db
pnpm dev                    # web on http://localhost:5190, API on :4200
```

Admins:

```sh
ADMIN_PASSWORD='<starting password>' pnpm admin add <username> [username ...]                # systems team
ADMIN_PASSWORD='<starting password>' pnpm admin add --contributor <username> [username ...]  # onboarding contributors
pnpm admin list
ADMIN_PASSWORD='<starting password>' pnpm admin reset <username>
pnpm admin token "<name>"   # access token for the Claude fill (shown once)
```

New and reset admins must choose their own password at first sign-in.

Checks: `pnpm typecheck`. Production build: `pnpm build`, then `pnpm start`.

## Claude fill

Fields that only Hostaway's dashboard shows are filled from a signed-in Hostaway tab, exported as a JSON file, then sent with:

```sh
LISTING_REPO_TOKEN=<token> pnpm fill:import <file.json>          # preview
LISTING_REPO_TOKEN=<token> pnpm fill:import <file.json> --save   # save
```

## Deploy (Railway)

Built from the `Dockerfile` (see `railway.json`, health check `/api/health`).

1. Attach a **volume at `/app/data`**. It holds the SQLite database and uploaded photos; without it every deploy starts empty.
2. Set variables: `HOSTAWAY_ACCT_ID`, `HOSTAWAY_API_KEY`, `COOKIE_SECURE=true`. Railway sets `PORT`.
3. After the first deploy, open a shell on the service and create the admins (`node apps/api/src/admin-cli.ts add …` with `ADMIN_PASSWORD` set), then run Sync Hostaway from the dashboard.
