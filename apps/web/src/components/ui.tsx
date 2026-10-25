import clsx from 'clsx';
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

// Controls in the house style: square, ink or hairline, tracked capitals.

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-bronze-deep disabled:bg-muted',
  secondary: 'border border-gold text-ink hover:bg-gold-wash disabled:text-muted',
  quiet: 'text-bronze underline decoration-1 underline-offset-4 hover:text-ink disabled:text-muted disabled:no-underline',
  danger: 'border border-[#8a2c1f] text-[#8a2c1f] hover:bg-[#8a2c1f] hover:text-paper disabled:opacity-60',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean }>(
  function Button({ variant = 'primary', busy, className, children, disabled, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        className={clsx(
          'caps inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed',
          variant === 'quiet' ? 'px-0 py-1' : 'min-h-10 px-4',
          VARIANTS[variant],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'h-11 w-full border border-gold bg-paper px-3 text-[0.9375rem] text-ink transition-colors focus:border-bronze aria-invalid:border-[#8a2c1f]',
        className,
      )}
      {...rest}
    />
  );
});

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1">
      <span className="caps text-bronze">{children}</span>
      {hint && <span className="text-[0.8125rem] text-muted">{hint}</span>}
    </label>
  );
}

/** Error and status text. Errors are announced; the red is dark enough for AA on paper and ground. */
export function Notice({ tone = 'error', children, className }: { tone?: 'error' | 'ok'; children: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={clsx('text-sm', tone === 'error' ? 'text-[#8a2c1f]' : 'text-bronze', className)}>
      {children}
    </p>
  );
}
