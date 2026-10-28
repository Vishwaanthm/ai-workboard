import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Grid spans so the parts grid never leaves empty cells: first cell spans 2, the last fills the row. */
export function partSpans(count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [3]
  const spans: number[] = Array.from({ length: count }, (_, i) => (i === 0 ? 2 : 1))
  const remainder = spans.reduce((a, b) => a + b, 0) % 3
  if (remainder !== 0) spans[count - 1] = (spans[count - 1] ?? 1) + (3 - remainder)
  return spans
}

export function formatIssueDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
