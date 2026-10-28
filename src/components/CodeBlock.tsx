import { Check, Copy } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import type { CodeLang } from '@/data/types'

export function CodeBlock({ label, lang, code }: { label: string; lang: CodeLang; code: string }) {
  const [copied, setCopied] = useState(false)
  const labelId = useId()

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed. Select the code and copy it manually.')
    }
  }

  return (
    <figure className="overflow-hidden rounded-panel bg-code text-code-foreground">
      <figcaption className="flex items-center justify-between gap-3 border-b border-code-foreground/10 py-1 pr-1 pl-4">
        <span id={labelId} className="truncate font-mono text-sm text-code-muted">
          {label}
          <span className="sr-only"> ({lang})</span>
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? `Copied: ${label}` : `Copy: ${label}`}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-control px-3 text-sm font-medium transition-colors duration-[120ms] hover:bg-code-foreground/10 active:scale-[0.98]"
        >
          {copied ? (
            <Check aria-hidden="true" strokeWidth={1.75} className="size-4 text-code-accent" />
          ) : (
            <Copy aria-hidden="true" strokeWidth={1.75} className="size-4" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre
        role="region"
        tabIndex={0}
        aria-labelledby={labelId}
        className="overflow-x-auto p-4 font-mono text-sm leading-[1.6] select-text"
      >
        <code>{code}</code>
      </pre>
    </figure>
  )
}
