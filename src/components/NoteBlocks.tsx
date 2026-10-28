import type { NoteBlock } from '@/data/types'
import { CodeBlock } from './CodeBlock'
import { Callout } from './ui/callout'

export function NoteBlocks({ blocks }: { blocks: NoteBlock[] }) {
  return (
    <div className="flex max-w-[68ch] flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'p':
            return <p key={i}>{block.text}</p>
          case 'list':
            return (
              <ul key={i} className="flex list-disc flex-col gap-2 pl-6 marker:text-progress">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )
          case 'steps':
            return (
              <ol key={i} className="flex list-decimal flex-col gap-2 pl-6 marker:font-mono marker:text-primary">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            )
          case 'table':
            return (
              <div
                key={i}
                role="region"
                aria-label={block.caption}
                tabIndex={0}
                className="overflow-x-auto rounded-panel border border-border bg-card"
              >
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <caption className="px-4 pt-3 pb-1 text-left font-medium text-muted-foreground">
                    {block.caption}
                  </caption>
                  <thead>
                    <tr className="bg-muted">
                      {block.columns.map((c) => (
                        <th key={c} scope="col" className="px-4 py-2 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-t border-border">
                        {row.map((cell, c) => (
                          <td key={c} className="px-4 py-2 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'callout':
            return (
              <Callout key={i} tone={block.tone} title={block.title}>
                <p>{block.text}</p>
              </Callout>
            )
          case 'code':
            return <CodeBlock key={i} label={block.label} lang={block.lang} code={block.code} />
          default:
            return null
        }
      })}
    </div>
  )
}
