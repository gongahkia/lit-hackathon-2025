export function readDisplayName(user?: { profile?: { name?: string } }) {
  return user?.profile?.name ?? 'guest';
}
