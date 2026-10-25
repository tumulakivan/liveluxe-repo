// `pnpm admin <command>`: manage admin accounts from the command line.
//
//   pnpm admin list
//   ADMIN_PASSWORD=... pnpm admin add <username> [username ...]
//   ADMIN_PASSWORD=... pnpm admin reset <username>
//
// The starting password comes from ADMIN_PASSWORD so it's never written into code or config.
// New and reset accounts must choose their own password at their next sign-in.
import { db } from './db.ts';
import { hashPassword } from './passwords.ts';

const USERNAME = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const MIN_PASSWORD = 8;

function startingPassword(): string {
  const pw = process.env.ADMIN_PASSWORD ?? '';
  if (pw.length < MIN_PASSWORD) {
    console.error(`Set ADMIN_PASSWORD (at least ${MIN_PASSWORD} characters) for the starting password.`);
    process.exit(1);
  }
  return pw;
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'list': {
    const rows = db
      .prepare('SELECT username, must_change_password, created_at, last_sign_in_at FROM admins ORDER BY username')
      .all() as { username: string; must_change_password: number; created_at: string; last_sign_in_at: string | null }[];
    if (rows.length === 0) console.log('No admin accounts.');
    for (const r of rows) {
      const state = r.must_change_password ? 'must change password' : 'password set';
      console.log(`${r.username}  (${state}; created ${r.created_at}; last sign-in ${r.last_sign_in_at ?? 'never'})`);
    }
    break;
  }
  case 'add': {
    if (args.length === 0) throw new Error('Name at least one username.');
    const password = startingPassword();
    const insert = db.prepare('INSERT INTO admins (username, password_hash, must_change_password) VALUES (?, ?, 1)');
    const exists = db.prepare('SELECT 1 FROM admins WHERE username = ?');
    for (const raw of args) {
      const username = raw.trim().toLowerCase();
      if (!USERNAME.test(username)) {
        console.error(`Skipped "${raw}": use 3–64 lowercase letters, digits, dots, hyphens or underscores.`);
        continue;
      }
      if (exists.get(username)) {
        console.log(`Skipped ${username}: already exists.`);
        continue;
      }
      insert.run(username, await hashPassword(password));
      console.log(`Added ${username} (must change password at first sign-in).`);
    }
    break;
  }
  case 'reset': {
    const username = args[0]?.trim().toLowerCase();
    if (!username) throw new Error('Name the username to reset.');
    const result = db
      .prepare('UPDATE admins SET password_hash = ?, must_change_password = 1 WHERE username = ?')
      .run(await hashPassword(startingPassword()), username);
    console.log(result.changes ? `Reset ${username} (must change password at next sign-in).` : `No admin named ${username}.`);
    break;
  }
  case 'token': {
    // Prints a new access token for the Claude fill once. Only its hash is stored.
    const name = args.join(' ').trim() || 'Claude fill';
    const { createToken } = await import('./fill.ts');
    console.log(createToken(name, 'command line'));
    break;
  }
  default:
    console.log('Usage: pnpm admin list | add <username...> | reset <username> | token [name]  (ADMIN_PASSWORD sets the starting password)');
}
