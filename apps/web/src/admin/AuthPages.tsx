import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Label, Notice, TextInput } from '../components/ui.tsx';
import { useChangePassword, useSignIn, useSignOut } from '../lib/admin-api.ts';

function AuthFrame({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto grid max-w-[1440px] px-5 pt-14 pb-24 sm:px-8 lg:grid-cols-[1fr_28rem] lg:gap-16 lg:px-12 lg:pt-24">
      <div className="mb-10 lg:mb-0">
        <h1 className="font-display text-[2.75rem] leading-none font-semibold tracking-[-0.015em] text-ink sm:text-[3.5rem]">{title}</h1>
        <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-soft">{intro}</p>
      </div>
      <div className="border-t border-gold pt-8">{children}</div>
    </main>
  );
}

export function SignInPage() {
  const signIn = useSignIn();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    signIn.mutate({ username, password });
  };
  return (
    <AuthFrame
      title="Admin sign-in"
      intro="Admins manage properties, platforms and accounts, and run Sync Hostaway. Everyone else can browse without signing in."
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-u`}>Username</Label>
          <TextInput
            id={`${id}-u`}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-p`}>Password</Label>
          <TextInput
            id={`${id}-p`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Notice>{signIn.error?.message}</Notice>
        <Button type="submit" busy={signIn.isPending} disabled={!username || !password} className="self-start">
          {signIn.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthFrame>
  );
}

export function ChangePasswordPage({ username }: { username: string }) {
  const change = useChangePassword();
  const signOut = useSignOut();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (next !== again) return setMismatch(true);
    setMismatch(false);
    change.mutate({ current, next });
  };
  return (
    <AuthFrame
      title="Choose your password"
      intro={`Signed in as ${username}. Your account started with a shared password, so pick your own before going on. Use at least 10 characters.`}
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <input type="text" autoComplete="username" value={username} readOnly hidden />
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-c`}>Current password</Label>
          <TextInput id={`${id}-c`} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-n`}>New password</Label>
          <TextInput id={`${id}-n`} type="password" autoComplete="new-password" minLength={10} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-a`}>New password again</Label>
          <TextInput
            id={`${id}-a`}
            type="password"
            autoComplete="new-password"
            value={again}
            aria-invalid={mismatch || undefined}
            onChange={(e) => setAgain(e.target.value)}
          />
        </div>
        <Notice>{mismatch ? 'The two new passwords don’t match.' : change.error?.message}</Notice>
        <div className="flex items-center gap-6">
          <Button type="submit" busy={change.isPending} disabled={!current || !next || !again}>
            {change.isPending ? 'Saving…' : 'Save password'}
          </Button>
          <Button variant="quiet" onClick={() => signOut.mutate()}>
            Sign out
          </Button>
        </div>
      </form>
    </AuthFrame>
  );
}
