/**
 * Feature Gating Service
 * Controls access to features based on user tier (free vs pro)
 */

export interface UserTier {
  tier: 'free' | 'pro';
  generationsUsed: number;
  generationsLimit: number; // 3 for free (lifetime), 50/mo for pro
  iterationsUsed: number;
  iterationsLimit: number; // 0 for free, 100/mo for pro
  roomsUsed: number;
  roomsLimit: number; // 1 for free, 10 for pro
}

export const FREE_TIER: Pick<UserTier, 'generationsLimit' | 'iterationsLimit' | 'roomsLimit'> = {
  generationsLimit: 3,
  iterationsLimit: 0,
  roomsLimit: 1,
};

export const PRO_TIER: Pick<UserTier, 'generationsLimit' | 'iterationsLimit' | 'roomsLimit'> = {
  generationsLimit: 50,
  iterationsLimit: 100,
  roomsLimit: 10,
};

export function canGenerate(tier: UserTier): boolean {
  return tier.generationsUsed < tier.generationsLimit;
}

export function canIterate(tier: UserTier): boolean {
  if (tier.tier === 'free') return false;
  return tier.iterationsUsed < tier.iterationsLimit;
}

export function canSaveRoom(tier: UserTier): boolean {
  if (tier.tier === 'free') return tier.roomsUsed < tier.roomsLimit;
  return tier.roomsUsed < tier.roomsLimit;
}

export function canExport(tier: UserTier): boolean {
  return tier.tier === 'pro';
}

export function canAccessStudio(tier: UserTier): boolean {
  return tier.tier === 'pro';
}

export function canCreateProject(tier: UserTier): boolean {
  return tier.tier === 'pro';
}

export function canSaveToMoodBoard(tier: UserTier): boolean {
  return tier.tier === 'pro';
}

export function getGateMessage(feature: string): string {
  const messages: Record<string, string> = {
    generate: "You've used your free designs. Upgrade to keep creating.",
    iterate: 'Design iteration is a Pro feature. Upgrade to refine your designs.',
    save_room: "You've reached the free room limit. Upgrade for more rooms.",
    export: 'PDF export and high-res downloads are Pro features.',
    studio: 'Design Studio is a Pro feature. Upgrade to iterate and refine.',
    project: 'Projects are a Pro feature. Upgrade to group rooms into coordinated projects.',
    mood_board: 'Saving to mood boards is a Pro feature. Upgrade to collect your favorite inspiration.',
    default: 'This feature requires a Pro subscription.',
  };
  return messages[feature] || messages.default!;
}
