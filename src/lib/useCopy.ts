import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/** Copies text to the clipboard with the same feedback as CodeBlock: a 2 s "copied" state and a toast. */
export function useCopy(text: string): { copied: boolean; copy: () => Promise<void> } {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed. Select the text and copy it manually.')
    }
  }

  return { copied, copy }
}

/** "12 Nov 2026" for an ISO date (YYYY-MM-DD), "TBA" when the date is missing or invalid. */
export function dateOrTba(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'TBA'
  const d = new Date(`${iso}T00:00:00Z`)
  // Reject dates JavaScript would roll over (2026-02-31 becomes 3 March): the round trip must match.
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return 'TBA'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
