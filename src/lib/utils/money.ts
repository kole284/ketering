export function formatRsd(value: number): string {
  return `${new Intl.NumberFormat("sr-RS").format(value)} RSD`;
}
