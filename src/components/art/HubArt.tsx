import { usePrefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { AWS_ICONS } from './awsIcons'

/**
 * Hero diagram: Amazon Bedrock as one API hub in front of many model providers, drawn the AWS way
 * inside an AWS Cloud group and a us-west-2 Region group. The hub uses the official Amazon Bedrock
 * Architecture Icon and the frames use the official group icons, all unmodified. Providers are plain
 * text labels (no third-party logos). Motion: a one-time draw-in only (no loop, no controls).
 * Under prefers-reduced-motion the final state is shown.
 */

const W = 560
const H = 440
const HUB = { x: 280, y: 222, w: 236, h: 92 }

/** Provider names from the course's model catalog, placed around the hub inside the Region frame. */
const NODES = [
  { label: 'Amazon', x: 112, y: 106 },
  { label: 'Anthropic', x: 280, y: 96 },
  { label: 'Meta', x: 448, y: 106 },
  { label: 'DeepSeek', x: 470, y: 222 },
  { label: 'Mistral AI', x: 448, y: 346 },
  { label: 'Cohere', x: 310, y: 386 },
  { label: 'Writer', x: 112, y: 346 },
  { label: 'Stability AI', x: 96, y: 222 },
  { label: 'Luma AI', x: 196, y: 300 },
]

/** Official AWS group colors (DESIGN.md "AWS diagrams"); used only for these frames. */
const AWS_CLOUD_COLOR = '#242F3E'
const AWS_REGION_COLOR = '#00A4A6'

function pillWidth(label: string): number {
  return 24 + label.length * 8.4
}

/** Curved connector from a node to the nearest edge of the hub. */
function connector(n: { x: number; y: number }): string {
  const left = HUB.x - HUB.w / 2
  const right = HUB.x + HUB.w / 2
  const top = HUB.y - HUB.h / 2
  const bottom = HUB.y + HUB.h / 2
  const tx = Math.min(Math.max(n.x, left), right)
  const ty = Math.min(Math.max(n.y, top), bottom)
  const cx = (n.x + tx) / 2 + (n.y - ty) * 0.18
  const cy = (n.y + ty) / 2 - (n.x - tx) * 0.18
  return `M ${n.x} ${n.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${tx} ${ty}`
}

export function HubArt({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()
  const animate = !reduced

  return (
    <figure className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Diagram: in the AWS Cloud, us-west-2 Region, Amazon Bedrock is one API in front of many model providers: Amazon, Anthropic, Meta, DeepSeek, Mistral AI, Cohere, Writer, Stability AI and Luma AI."
        className={cn('hub-art h-auto w-full', animate && 'hub-art--animate')}
        data-testid="hub-art"
      >
        {/* AWS Cloud group */}
        <rect x="2" y="2" width={W - 4} height={H - 4} fill="var(--color-card)" stroke={AWS_CLOUD_COLOR} strokeWidth="2" />
        <image href={AWS_ICONS.awsCloudLogo.src} x="2" y="2" width="28" height="28" />
        <text x="38" y="21" fill="var(--color-foreground)" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">
          AWS Cloud
        </text>

        {/* Region group (dashed) */}
        <rect
          x="20"
          y="42"
          width={W - 40}
          height={H - 62}
          fill="none"
          stroke={AWS_REGION_COLOR}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <image href={AWS_ICONS.region.src} x="20" y="42" width="24" height="24" />
        <text x="52" y="59" fill="var(--color-foreground)" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">
          US West (Oregon) us-west-2
        </text>

        <g className="hub-links" fill="none" stroke="var(--color-progress)" strokeWidth="1.5" strokeLinecap="round">
          {NODES.map((n, i) => (
            <path
              key={n.label}
              d={connector(n)}
              pathLength={100}
              className="hub-link"
              style={{ ['--i' as string]: i }}
              opacity="0.6"
            />
          ))}
        </g>


        <g className="hub-nodes" fontFamily="var(--font-sans)" fontSize="14" fontWeight="500">
          {NODES.map((n, i) => {
            const w = pillWidth(n.label)
            return (
              <g key={n.label} className="hub-node" style={{ ['--i' as string]: i }}>
                <rect
                  x={n.x - w / 2}
                  y={n.y - 16}
                  width={w}
                  height={32}
                  rx={6}
                  fill="var(--color-card)"
                  stroke="var(--color-input)"
                />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fill="var(--color-foreground)">
                  {n.label}
                </text>
              </g>
            )
          })}
        </g>

        <g className="hub-core">
          <rect
            x={HUB.x - HUB.w / 2}
            y={HUB.y - HUB.h / 2}
            width={HUB.w}
            height={HUB.h}
            rx={10}
            fill="var(--color-primary)"
          />
          <image
            href={AWS_ICONS.bedrock.src}
            x={HUB.x - HUB.w / 2 + 14}
            y={HUB.y - 24}
            width="48"
            height="48"
          />
          <text
            x={HUB.x + 30}
            y={HUB.y - 2}
            textAnchor="middle"
            fill="var(--color-primary-foreground)"
            fontFamily="var(--font-mono)"
            fontSize="16"
            fontWeight="600"
          >
            Amazon Bedrock
          </text>
          <text
            x={HUB.x + 30}
            y={HUB.y + 22}
            textAnchor="middle"
            fill="var(--color-primary-soft)"
            fontFamily="var(--font-sans)"
            fontSize="14"
          >
            one API
          </text>
        </g>
      </svg>

    </figure>
  )
}
