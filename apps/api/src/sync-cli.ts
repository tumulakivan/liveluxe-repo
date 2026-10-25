// `pnpm sync`: runs Sync Hostaway from the command line, until the dashboard button exists.
import { syncHostaway } from './sync.ts';

const s = await syncHostaway();
console.log(
  `Sync Hostaway: ${s.added} added, ${s.updated} updated, ${s.unchanged} unchanged, ` +
    `${s.archived} archived in Hostaway, ${s.fieldsChanged} field values changed.`,
);
