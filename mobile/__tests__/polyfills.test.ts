import { instalarPolyfills } from '@/polyfills';

it('instala toSorted/toReversed sem alterar o original quando o motor não tem (Hermes)', () => {
  const proto = Object.create(Array.prototype, { toSorted: { value: undefined, writable: true, configurable: true }, toReversed: { value: undefined, writable: true, configurable: true } });
  instalarPolyfills(proto);
  const a = Object.setPrototypeOf([3, 1, 2], proto) as number[] & { toSorted(f?: (x: number, y: number) => number): number[]; toReversed(): number[] };
  expect(a.toSorted((x, y) => x - y)).toEqual([1, 2, 3]);
  expect(a.toReversed()).toEqual([2, 1, 3]);
  expect([...a]).toEqual([3, 1, 2]);
});
