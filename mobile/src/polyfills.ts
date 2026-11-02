/**
 * O Hermes do build Android (0.3.0) não tem Array.prototype.toSorted/toReversed (ES2023), que a web e o Node têm.
 * Achado no emulador: a tela de consentimentos caía com "undefined is not a function". Importado primeiro em app/_layout.tsx.
 */
type ComCopia<T> = T[] & { toSorted?: (f?: (a: T, b: T) => number) => T[]; toReversed?: () => T[] };

export function instalarPolyfills(proto: ComCopia<unknown> = Array.prototype as ComCopia<unknown>) {
  if (typeof proto.toSorted !== 'function') {
    Object.defineProperty(proto, 'toSorted', { configurable: true, writable: true, value(this: unknown[], f?: (a: unknown, b: unknown) => number) { return [...this].sort(f); } });
  }
  if (typeof proto.toReversed !== 'function') {
    Object.defineProperty(proto, 'toReversed', { configurable: true, writable: true, value(this: unknown[]) { return [...this].reverse(); } });
  }
}
instalarPolyfills();
