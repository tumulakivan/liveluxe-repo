// `pnpm sync`: runs Sync Hostaway from the command line, until the dashboard button exists.
import { syncHostaway } from './sync.ts';

const s = await syncHostaway();
console.log(
  `Sync Hostaway: ${s.added} added, ${s.updated} updated, ${s.unchanged} unchanged, ` +
    `${s.archived} archived in Hostaway, ${s.fieldsChanged} field values changed.`,
);
for (const r of s.replaced ?? []) console.log(`Onboarding listing replaced by Hostaway listing ${r.hostawayId}: ${r.name}`);
for (const r of s.notFound ?? []) console.log(`Not in Hostaway yet: listing ${r.hostawayId}, given to ${r.name}`);
