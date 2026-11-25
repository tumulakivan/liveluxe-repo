import type { PropertySummary } from '@repo/shared';

/** Where an onboarding listing stands: awaiting approval, approved, or linked and waiting for a sync. Null for existing listings. */
export function onboardingStatus(p: Pick<PropertySummary, 'onboarding'>): string | null {
  const o = p.onboarding;
  if (!o) return null;
  // The ID itself is in the panel; the list only says what happens next.
  if (o.pendingHostawayId) return 'Onboarding · Awaiting sync';
  if (o.approvedAt) return 'Onboarding · Approved';
  return 'Onboarding · Awaiting approval';
}
