import type { AdminAccount } from '@repo/shared';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button, Label, Notice, TextInput } from '../components/ui.tsx';
import { Check, Copy } from 'lucide-react';
import {
  useAccounts,
  useAddAccount,
  useCreateToken,
  useRemoveAccount,
  useResetAccount,
  useRevokeToken,
  useTokens,
  type ApiToken,
} from '../lib/admin-api.ts';
import { formatWhen } from '../lib/format.ts';
import { PageHeading } from './AdminShell.tsx';

/** Reset and remove, swapped in place. Focus follows: into the new control, and back to its trigger on cancel. */
function AccountActions({ a, align = 'end' }: { a: AdminAccount; align?: 'start' | 'end' }) {
  const reset = useResetAccount();
  const remove = useRemoveAccount();
  const [mode, setMode] = useState<'idle' | 'reset' | 'remove'>('idle');
  const [returnTo, setReturnTo] = useState<'reset' | 'remove' | null>(null);
  const [password, setPassword] = useState('');
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const removeTrigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const items = align === 'end' ? 'items-end' : 'items-start';

  useEffect(() => {
    if (mode !== 'idle' || !returnTo) return;
    (returnTo === 'reset' ? resetTrigger : removeTrigger).current?.focus();
    setReturnTo(null);
  }, [mode, returnTo]);

  const close = (from: 'reset' | 'remove') => {
    setMode('idle');
    setReturnTo(from);
  };

  if (mode === 'reset') {
    return (
      <form
        className={`flex flex-col gap-2 ${items}`}
        onSubmit={(e) => {
          e.preventDefault();
          reset.mutate({ id: a.id, password }, { onSuccess: () => (setPassword(''), close('reset')) });
        }}
      >
        <label htmlFor={id} className="text-[0.8125rem] text-muted">
          Starting password for {a.username}. They’ll choose their own at next sign-in.
        </label>
        <span className="flex flex-wrap gap-2">
          <TextInput id={id} autoFocus type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} className="w-56" />
          <Button type="submit" busy={reset.isPending} disabled={password.length < 10}>
            Reset
          </Button>
          <Button variant="secondary" onClick={() => close('reset')}>
            Cancel
          </Button>
        </span>
        <Notice>{reset.error?.message}</Notice>
      </form>
    );
  }

  if (mode === 'remove') {
    return (
      <span className={`flex flex-col gap-2 ${items}`}>
        <span className="text-sm text-ink">Remove {a.username}? They’ll be signed out at once.</span>
        <span className="flex gap-2">
          <Button variant="danger" autoFocus busy={remove.isPending} onClick={() => remove.mutate(a.id)}>
            Remove account
          </Button>
          <Button variant="secondary" onClick={() => close('remove')}>
            Keep
          </Button>
        </span>
        <Notice>{remove.error?.message}</Notice>
      </span>
    );
  }

  return (
    <span className={`flex gap-5 ${align === 'end' ? 'justify-end' : ''}`}>
      <Button ref={resetTrigger} variant="quiet" onClick={() => setMode('reset')}>
        Reset password
      </Button>
      {!a.isYou && (
        <Button ref={removeTrigger} variant="quiet" onClick={() => setMode('remove')}>
          Remove
        </Button>
      )}
    </span>
  );
}

/** Access tokens let Claude fill the dashboard-only fields. A new token is shown once, then only its name. */
function TokensSection() {
  const tokens = useTokens();
  const create = useCreateToken();
  const revoke = useRevokeToken();
  const [name, setName] = useState('Claude fill');
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<number | null>(null);
  const id = useId();
  const list = tokens.data ?? [];
  const status = (t: ApiToken) => (t.revokedAt ? `Cancelled ${formatWhen(t.revokedAt)}` : t.lastUsedAt ? `Last used ${formatWhen(t.lastUsedAt)}` : 'Not used yet');

  return (
    <section aria-labelledby="tokens-h" className="mt-14 border-t border-gold pt-8">
      <h2 id="tokens-h" className="font-display text-[1.6rem] leading-tight font-semibold text-ink">
        Access tokens
      </h2>
      <p className="mt-2 mb-6 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        A token lets Claude fill the fields that only Hostaway’s dashboard shows. It can’t change anything else: not Hostaway’s own fields, accounts or
        platforms. Values it saves are marked “Set by Claude”, and it never replaces a value an admin typed. Cancel a token to shut it off at once.
      </p>

      {fresh && (
        <div role="status" className="mb-6 flex flex-col gap-3 border-y border-gold bg-paper px-4 py-4">
          <p className="text-sm text-ink">Copy this token now. It won’t be shown again.</p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="tabular min-w-0 border border-gold bg-ground px-3 py-2 text-[0.8125rem] [overflow-wrap:anywhere] text-ink">{fresh}</code>
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(fresh).then(() => setCopied(true))}
            >
              {copied ? <Check aria-hidden className="size-4" strokeWidth={2} /> : <Copy aria-hidden className="size-4" strokeWidth={1.5} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="quiet" onClick={() => (setFresh(null), setCopied(false))}>
              Done
            </Button>
          </div>
        </div>
      )}

      {list.length > 0 && (
        <ul className="mb-8 border-t border-gold">
          {list.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/45 py-3">
              <span className="min-w-0">
                <span className={t.revokedAt ? 'block text-[0.9375rem] text-muted' : 'block text-[0.9375rem] text-ink'}>{t.name}</span>
                <span className="flex flex-wrap gap-x-4 text-[0.8125rem] text-muted">
                  <span>
                    Made by {t.createdBy}, {formatWhen(t.createdAt)}
                  </span>
                  <span>{status(t)}</span>
                </span>
              </span>
              {!t.revokedAt &&
                (confirm === t.id ? (
                  <span className="flex gap-2">
                    <Button variant="danger" autoFocus busy={revoke.isPending} onClick={() => revoke.mutate(t.id, { onSuccess: () => setConfirm(null) })}>
                      Cancel token
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirm(null)}>
                      Keep
                    </Button>
                  </span>
                ) : (
                  <Button variant="quiet" onClick={() => setConfirm(t.id)}>
                    Cancel
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
      <Notice>{revoke.error?.message ?? tokens.error?.message}</Notice>

      <form
        className="flex max-w-xl flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(name, { onSuccess: (r) => (setFresh(r.token), setCopied(false)) });
        }}
      >
        <Label htmlFor={id} hint="What it's for, e.g. “Claude fill”">
          New token name
        </Label>
        <div className="flex gap-2">
          <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" busy={create.isPending} disabled={name.trim().length < 2}>
            Create token
          </Button>
        </div>
        <Notice>{create.error?.message}</Notice>
      </form>
    </section>
  );
}

const passwordState = (a: AdminAccount) => (a.mustChangePassword ? 'Must choose a password' : 'Password set');
const lastSignIn = (a: AdminAccount) => (a.lastSignInAt ? formatWhen(a.lastSignInAt) : 'Never');

export function AccountsPage() {
  const accounts = useAccounts();
  const add = useAddAccount();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const id = useId();
  const list = accounts.data ?? [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    add.mutate({ username, password }, { onSuccess: () => (setUsername(''), setPassword('')) });
  };

  return (
    <>
      <PageHeading title="Accounts" />
      <p className="mb-8 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        Admins are the only accounts. Everyone else browses without signing in. New and reset accounts start with a password you set here, and
        must choose their own at their next sign-in.
      </p>
      {accounts.isError && <Notice>{accounts.error.message}</Notice>}

      {/* Phones: stacked rows. */}
      <ul className="border-t border-gold md:hidden">
        {list.map((a) => (
          <li key={a.id} className="flex flex-col gap-1.5 border-b border-gold/45 py-4">
            <span className="text-[0.9375rem] text-ink">
              {a.username}
              {a.isYou && <span className="caps ml-3 text-bronze">You</span>}
            </span>
            <span className="flex flex-wrap gap-x-4 text-sm text-ink-soft">
              <span>{passwordState(a)}</span>
              <span>Last sign-in {lastSignIn(a)}</span>
            </span>
            <AccountActions a={a} align="start" />
          </li>
        ))}
      </ul>

      <div className="relative hidden overflow-x-auto border-t border-gold md:block">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead>
            <tr className="caps text-bronze">
              <th scope="col" className="py-3 pr-4 font-medium">Username</th>
              <th scope="col" className="py-3 pr-4 font-medium">Password</th>
              <th scope="col" className="py-3 pr-4 font-medium">Last sign-in</th>
              <th scope="col" className="py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-t border-gold/45 align-top">
                <td className="py-3 pr-4">
                  <span className="text-[0.9375rem] text-ink">{a.username}</span>
                  {a.isYou && <span className="caps ml-3 text-bronze">You</span>}
                </td>
                <td className="py-3 pr-4 text-ink-soft">{passwordState(a)}</td>
                <td className="py-3 pr-4 text-ink-soft">{lastSignIn(a)}</td>
                <td className="py-3 text-right">
                  <AccountActions a={a} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="mt-12 grid max-w-2xl gap-4 border-t border-gold pt-8 sm:grid-cols-2">
        <h2 className="font-display text-[1.6rem] leading-tight font-semibold text-ink sm:col-span-2">Add an admin</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-u`} hint="Lowercase, e.g. systems.jordan">
            Username
          </Label>
          <TextInput id={`${id}-u`} autoComplete="off" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-p`} hint="At least 10 characters">
            Starting password
          </Label>
          <TextInput id={`${id}-p`} type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Notice>{add.error?.message}</Notice>
          <Button type="submit" busy={add.isPending} disabled={!username || password.length < 10} className="self-start">
            Add admin
          </Button>
        </div>
      </form>

      <TokensSection />
    </>
  );
}
