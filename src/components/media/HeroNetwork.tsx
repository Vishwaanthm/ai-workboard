import { useEffect, useRef, type RefObject } from 'react'
import { useBackgroundVideoSetting, usePrefersReducedMotion } from '@/lib/motion'

/**
 * Pointer-reactive network layer for the Home hero (DESIGN.md "Interactive hero").
 *
 * A plain 2D canvas of drifting nodes, joined by faint lines, echoing the triangulated network in the
 * hero video. With a fine pointer (mouse, trackpad) the nodes near the cursor are drawn in and link to
 * it in volt, a soft volt spotlight follows the cursor, and the hero's layers shift with the pointer
 * at different depths (CSS variables --hx/--hy on the host, read by .hero-layer-bg/.hero-layer-fg).
 * Touch and no-hover devices get the ambient drift only, plus a short ripple on tap.
 *
 * Decorative: aria-hidden, pointer-events none, listens on the host without blocking the CTAs.
 * Performance: requestAnimationFrame, lerped pointer, devicePixelRatio capped at 2, node count scaled to
 * the hero area, paused while the hero is off-screen or the tab is hidden.
 * Reduced motion: renders nothing (the BackgroundVideo shows its static poster). With the footer
 * "Background video" switch off it draws one still frame and does not animate or track the pointer.
 */

const VOLT = '197, 240, 74'
const PAPER = '245, 245, 240'
const LINK_DIST = 130
const CURSOR_DIST = 220
const SPOT_RADIUS = 300
const RIPPLE_MS = 900

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  bx: number
  by: number
  z: number
  r: number
}

interface Ripple {
  x: number
  y: number
  t0: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Frame-rate independent easing factor: `k` per 60 fps frame, scaled to `dt` frames. */
const ease = (k: number, dt: number) => 1 - Math.pow(1 - k, dt)

/**
 * Knock-out passes over the hero copy (destination-out): feathered over 24px, the network keeps about
 * 11% of its strength behind the text (0.6 x 0.6 x 0.3), so every hero line stays at or above AA even
 * over a pure-white video pixel. DESIGN.md lists the measured worst cases.
 */
const KNOCKOUT: [pad: number, alpha: number][] = [
  [24, 0.4],
  [12, 0.4],
  [0, 0.7],
]

export function HeroNetwork({
  hostRef,
  copyRef,
}: {
  hostRef: RefObject<HTMLElement | null>
  /** The hero's text block; the network is dimmed behind it. */
  copyRef?: RefObject<HTMLElement | null>
}) {
  const reduced = usePrefersReducedMotion()
  const enabled = useBackgroundVideoSetting()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const animate = enabled
    const finePointer = animate && (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false)

    let w = 0
    let h = 0
    let nodes: Node[] = []
    const ripples: Ripple[] = []
    // Pointer in px (lerped) and its normalised -1..1 offset from the centre for parallax.
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 }
    const par = { x: 0, y: 0, tx: 0, ty: 0 }
    let raf = 0
    let last = 0
    let inView = true

    const seed = () => {
      const count = clamp(Math.round((w * h) / 14000), 24, 110)
      nodes = Array.from({ length: count }, () => {
        const vx = (Math.random() - 0.5) * 0.3
        const vy = (Math.random() - 0.5) * 0.3
        return { x: Math.random() * w, y: Math.random() * h, vx, vy, bx: vx, by: vy, z: 0.35 + Math.random() * 0.65, r: 0.8 + Math.random() * 1.6 }
      })
    }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const nw = Math.max(1, Math.round(rect.width))
      const nh = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const reseed = Math.abs(nw - w) > 40 || Math.abs(nh - h) > 40 || nodes.length === 0
      w = nw
      h = nh
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reseed) seed()
      if (!animate) draw(performance.now())
    }

    /** Screen position of a node: nearer nodes (higher z) shift further against the pointer. */
    const sx = (n: Node) => n.x - par.x * 22 * n.z
    const sy = (n: Node) => n.y - par.y * 16 * n.z

    const step = (dt: number, now: number) => {
      ptr.x = lerp(ptr.x, ptr.tx, ease(0.16, dt))
      ptr.y = lerp(ptr.y, ptr.ty, ease(0.16, dt))
      ptr.on = lerp(ptr.on, ptr.ton, ease(0.08, dt))
      par.x = lerp(par.x, par.tx, ease(0.06, dt))
      par.y = lerp(par.y, par.ty, ease(0.06, dt))
      host.style.setProperty('--hx', par.x.toFixed(4))
      host.style.setProperty('--hy', par.y.toFixed(4))

      for (const n of nodes) {
        if (ptr.on > 0.01) {
          const dx = ptr.x - sx(n)
          const dy = ptr.y - sy(n)
          const d = Math.hypot(dx, dy)
          if (d < CURSOR_DIST && d > 0.1) {
            // Drawn in from afar, held off right at the cursor so the nodes orbit instead of piling up.
            const f = (1 - d / CURSOR_DIST) * ptr.on * (d > 48 ? 0.035 : -0.08)
            n.vx += (dx / d) * f * dt
            n.vy += (dy / d) * f * dt
          }
        }
        // Ease back to the node's own drift.
        n.vx = lerp(n.vx, n.bx, ease(0.02, dt))
        n.vy = lerp(n.vy, n.by, ease(0.02, dt))
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < -30) n.x = w + 30
        else if (n.x > w + 30) n.x = -30
        if (n.y < -30) n.y = h + 30
        else if (n.y > h + 30) n.y = -30
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (now - ripples[i]!.t0 > RIPPLE_MS) ripples.splice(i, 1)
      }
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h)
      if (ptr.on > 0.01) {
        const g = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, SPOT_RADIUS)
        g.addColorStop(0, `rgba(${VOLT}, ${0.2 * ptr.on})`)
        g.addColorStop(0.35, `rgba(${VOLT}, ${0.07 * ptr.on})`)
        g.addColorStop(1, `rgba(${VOLT}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(ptr.x - SPOT_RADIUS, ptr.y - SPOT_RADIUS, SPOT_RADIUS * 2, SPOT_RADIUS * 2)
      }

      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!
        const ax = sx(a)
        const ay = sy(a)
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!
          const dx = ax - sx(b)
          const dy = ay - sy(b)
          if (Math.abs(dx) > LINK_DIST || Math.abs(dy) > LINK_DIST) continue
          const d = Math.hypot(dx, dy)
          if (d >= LINK_DIST) continue
          ctx.strokeStyle = `rgba(${PAPER}, ${((1 - d / LINK_DIST) * 0.2 * (a.z + b.z)) / 2})`
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(sx(b), sy(b))
          ctx.stroke()
        }
      }

      for (const n of nodes) {
        const x = sx(n)
        const y = sy(n)
        let near = 0
        if (ptr.on > 0.01) {
          const d = Math.hypot(ptr.x - x, ptr.y - y)
          if (d < CURSOR_DIST) {
            near = (1 - d / CURSOR_DIST) * ptr.on
            ctx.strokeStyle = `rgba(${VOLT}, ${Math.pow(near, 0.6) * 0.85})`
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(ptr.x, ptr.y)
            ctx.stroke()
          }
        }
        ctx.fillStyle = near > 0.05 ? `rgba(${VOLT}, ${0.5 + near * 0.5})` : `rgba(${PAPER}, ${0.25 + n.z * 0.45})`
        ctx.beginPath()
        ctx.arc(x, y, n.r + near * 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const r of ripples) {
        const t = (now - r.t0) / RIPPLE_MS
        ctx.strokeStyle = `rgba(${VOLT}, ${0.5 * (1 - t)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(r.x, r.y, 20 + t * 200, 0, Math.PI * 2)
        ctx.stroke()
      }

      const copy = copyRef?.current
      if (copy) {
        const hr = host.getBoundingClientRect()
        const cr = copy.getBoundingClientRect()
        const x = cr.left - hr.left
        const y = cr.top - hr.top
        ctx.globalCompositeOperation = 'destination-out'
        for (const [pad, alpha] of KNOCKOUT) {
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
          ctx.beginPath()
          if ('roundRect' in ctx) ctx.roundRect(x - pad, y - pad, cr.width + pad * 2, cr.height + pad * 2, pad + 8)
          else (ctx as CanvasRenderingContext2D).rect(x - pad, y - pad, cr.width + pad * 2, cr.height + pad * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    const frame = (now: number) => {
      const dt = last ? clamp((now - last) / 16.667, 0, 3) : 1
      last = now
      step(dt, now)
      draw(now)
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf || !animate || !inView || document.visibilityState !== 'visible') return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const sync = () => (inView && document.visibilityState === 'visible' ? start() : stop())

    const local = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      const p = local(e)
      if (ptr.on < 0.01) {
        ptr.x = p.x
        ptr.y = p.y
      }
      ptr.tx = p.x
      ptr.ty = p.y
      ptr.ton = 1
      par.tx = clamp((p.x / w) * 2 - 1, -1, 1)
      par.ty = clamp((p.y / h) * 2 - 1, -1, 1)
    }
    const onLeave = () => {
      ptr.ton = 0
      par.tx = 0
      par.ty = 0
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return
      const p = local(e)
      ripples.push({ x: p.x, y: p.y, t0: performance.now() })
      for (const n of nodes) {
        const dx = sx(n) - p.x
        const dy = sy(n) - p.y
        const d = Math.hypot(dx, dy)
        if (d < 180 && d > 0.1) {
          n.vx += (dx / d) * (1 - d / 180) * 2.2
          n.vy += (dy / d) * (1 - d / 180) * 2.2
        }
      }
    }

    resize()
    const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : undefined
    ro?.observe(host)
    if (!ro) window.addEventListener('resize', resize)

    let io: IntersectionObserver | undefined
    if (animate) {
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          inView = entries.some((e) => e.isIntersecting)
          sync()
        })
        io.observe(host)
      }
      document.addEventListener('visibilitychange', sync)
      if (finePointer) {
        host.addEventListener('pointermove', onMove, { passive: true })
        host.addEventListener('pointerleave', onLeave, { passive: true })
      }
      host.addEventListener('pointerdown', onDown, { passive: true })
      start()
    }

    return () => {
      stop()
      ro?.disconnect()
      if (!ro) window.removeEventListener('resize', resize)
      io?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', onDown)
      host.style.removeProperty('--hx')
      host.style.removeProperty('--hy')
    }
  }, [reduced, enabled, hostRef, copyRef])

  if (reduced) return null
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="hero-network"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
    />
  )
}
