export function stripInternalKeys<T extends object>(
  item: T,
  keysToStrip: (keyof T)[] = [
    'pk',
    'sk',
    'TTL',
    'ttl',
    'gsi1pk',
    'gsi1sk',
    'gsi2pk',
    'gsi2sk',
  ] as (keyof T)[],
): Partial<T> {
  const copy = { ...item };
  for (const key of keysToStrip) {
    if (key in copy) {
      delete copy[key];
    }
  }
  return copy;
}
