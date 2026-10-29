import { Check, Copy } from 'lucide-react'
import { useCopy } from '@/lib/useCopy'

/** A one-line command in an ink pill with a copy button (closing call to action). */
export function CopyCommand({ label, code }: { label: string; code: string }) {
  const { copied, copy } = useCopy(code)
  return (
    <div className="on-ink inline-flex max-w-full items-center gap-2 rounded-panel bg-ink py-1 pr-1 pl-4 shadow-raised">
      <span aria-hidden="true" className="font-mono text-sm text-volt">
        $
      </span>
      <code className="min-w-0 truncate font-mono text-sm text-on-ink" title={code}>
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied: ${label}` : `Copy: ${label}`}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-control px-3 text-sm font-medium text-on-ink transition-colors duration-[120ms] hover:bg-on-ink/10 active:scale-[0.98]"
      >
        {copied ? (
          <Check aria-hidden="true" strokeWidth={1.75} className="size-4 text-volt" />
        ) : (
          <Copy aria-hidden="true" strokeWidth={1.75} className="size-4" />
        )}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
