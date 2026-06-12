export function formatCny(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`;
}
