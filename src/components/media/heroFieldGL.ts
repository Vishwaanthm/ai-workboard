/**
 * Raw WebGL renderer for the Home hero "data landscape" (DESIGN.md "Interactive hero").
 * Loaded on demand by HeroField in its own chunk, so the hero copy never waits for it.
 *
 * Two passes into one opaque canvas, at the device pixel ratio (capped at 2), so it is sharp at any size:
 *  1. Sky: a full-screen triangle. Ink gradient, aurora curtains in the part accents above the horizon,
 *     a thin sunrise line on the horizon, a soft volt light under the cursor, and dithering against banding.
 *  2. Field: a perspective grid of points and ridgelines displaced by flowing simplex noise. A few rows
 *     carry volt "data packets"; the cursor raises a lit bulge with rings; a tap sends a ripple.
 *
 * GLSL ES 1.00, so the same shaders run on WebGL2 and WebGL1. No dependencies.
 */

export interface HeroFieldOptions {
  /** Loop the animation (false: draw one still frame and redraw only on resize). */
  animate: boolean
  /** Track a hovering mouse or pen. Touch devices get ambient motion plus a tap ripple. */
  finePointer: boolean
  /** First frame is on screen. */
  onReady?: () => void
  /** The GPU dropped the context; show the static fallback until it comes back. */
  onLost?: () => void
  onRestored?: () => void
}

export interface HeroField {
  setAnimate(on: boolean): void
  destroy(): void
}

/** Field time (seconds) of the still frame: reduced motion, motion switched off at load, and the poster. */
export const STILL_TIME = 42

const MAX_DPR = 2
const MAX_RIPPLES = 4
const RIPPLE_LIFE = 2.6

// Part accents and brand colours from src/index.css, linear 0..1 sRGB.
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]

const NOISE = /* glsl */ `
// 2D simplex noise. Ian McEwan, Ashima Arts (MIT). https://github.com/ashima/webgl-noise
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`

const PRECISION = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`

const SKY_VS = /* glsl */ `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const SKY_FS = /* glsl */ `${PRECISION}
uniform vec2 u_res;
uniform float u_time;
uniform float u_scale;
uniform float u_horizon;
uniform vec3 u_pointer;
uniform vec3 u_ink, u_inkHi, u_ocean, u_forest, u_midnight, u_sunrise, u_volt;
${NOISE}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// One aurora ribbon: a wavy, soft lower hem, a short fade upward, slanted rays, appearing in patches.
float curtain(float x, float y, float base, float seed, float t) {
  float hem = base + 0.07 * sin(x * 1.7 + seed * 2.0 + t * 0.05) + 0.045 * snoise(vec2(x * 1.2 + seed, t * 0.03));
  float k = y - hem;
  float body = smoothstep(-0.035, 0.02, k) * exp(-max(k, 0.0) * 9.0);
  float halo = exp(-abs(k) * 16.0) * 0.35;
  float rays = 0.55 + 0.45 * snoise(vec2(x * 12.0 + y * 3.0 + seed * 5.0, t * 0.05 + seed));
  float shown = smoothstep(-0.15, 0.7, snoise(vec2(x * 0.5 + seed * 3.1, t * 0.02 + seed)));
  return (body * rays + halo) * shown;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  float y = uv.y - u_horizon;
  float x = uv.x * aspect;
  float t = u_time;

  // Deep ink, lifted slightly toward the horizon so the field reads as distance, not a hole.
  vec3 col = mix(u_inkHi * 1.35, u_ink, smoothstep(0.0, 0.42, abs(y)));
  {
    float yy = y;
    col += u_ocean * 0.32 * curtain(x, yy, 0.08, 1.0, t);
    col += u_forest * 0.24 * curtain(x + 3.7, yy, 0.15, 2.3, t);
    col += u_midnight * 0.26 * curtain(x + 7.1, yy, 0.23, 4.1, t);
  }
  // Sparse, pin-sharp stars (one device pixel), twinkling slowly, only well above the horizon.
  vec2 cp = gl_FragCoord.xy / (5.0 * u_scale);
  vec2 ci = floor(cp);
  float hs = hash(ci);
  if (hs > 0.9975 && y > 0.04) {
    float sd = length((fract(cp) - 0.5) * 5.0 * u_scale);
    float tw = 0.55 + 0.45 * sin(t * 0.9 + hs * 900.0);
    col += vec3(0.86, 0.9, 1.0) * 0.55 * tw * smoothstep(0.04, 0.16, y) * (1.0 - smoothstep(0.35, 1.0, sd));
  }
  // Thin warm line where the field meets the sky, strongest to the right (away from the copy).
  col += u_sunrise * 0.16 * exp(-abs(y) * 70.0) * smoothstep(0.15, 0.95, uv.x);
  // Soft volt light that follows the cursor anywhere in the hero.
  vec2 dp = (uv - u_pointer.xy) * vec2(aspect, 1.0);
  col += u_volt * 0.09 * u_pointer.z * exp(-dot(dp, dp) * 7.0);
  // Gentle vignette, then dither so the dark gradients never band.
  vec2 vc = uv - vec2(0.55, 0.5);
  col *= 1.0 - 0.35 * dot(vc, vc);
  col += (hash(gl_FragCoord.xy + fract(t) * 37.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`

const FIELD_VS = /* glsl */ `
attribute vec3 a_grid; // u (across), v (depth), per-vertex seed
uniform mat4 u_viewProj;
uniform float u_time;
uniform float u_slope;
uniform float u_pointScale;
uniform float u_rows;
uniform float u_lines;
uniform vec3 u_eye;
uniform vec3 u_cursor; // world x, world z, strength 0..1
uniform vec4 u_ripples[${MAX_RIPPLES}]; // world x, world z, age (s), strength
uniform vec3 u_ocean, u_forest, u_midnight, u_slate, u_volt;
varying vec4 v_color;
varying float v_point;
${NOISE}
float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

float terrain(vec2 p, float t) {
  vec2 q = vec2(p.x, p.y - t * 0.55); // features drift toward the viewer
  float h = snoise(q * 0.075) * 1.35;
  h += snoise(q * 0.17 + vec2(t * 0.02, 0.0)) * 0.45;
  h += sin(q.x * 0.11 + q.y * 0.07 + t * 0.3) * 0.32;
  return h;
}

void main() {
  float s = a_grid.y;
  float z = -(0.4 + 58.0 * pow(s, 1.45));
  float dist = u_eye.z - z;
  float x = (a_grid.x * 2.0 - 1.0) * (dist * u_slope + 1.5);
  float t = u_time;
  float h = terrain(vec2(x, z), t);

  // Cursor: a lit bulge with slow rings travelling outward.
  float d = length(vec2(x, z) - u_cursor.xy);
  float glow = u_cursor.z * exp(-d * d / 8.0);
  h += glow * 1.15;
  h += u_cursor.z * sin(d * 1.5 - t * 2.2) * 0.16 * exp(-d * 0.3);

  // Tap ripples: a raised ring that runs out and fades.
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = u_ripples[i];
    float rd = length(vec2(x, z) - r.xy) - r.z * 7.5;
    float w = r.w * exp(-rd * rd * 0.5) * exp(-r.z * 1.1);
    h += w * 0.85;
    glow += w * 0.9;
  }

  // Data packets: about one row in nine carries a volt pulse with a tail.
  float row = floor(s * u_rows + 0.5);
  float lane = hash1(row + 3.0);
  float head = fract(t * (0.018 + 0.03 * hash1(row + 11.0)) + lane * 13.0);
  float packet = step(0.88, lane) * exp(-fract(head - a_grid.x) * 26.0) * smoothstep(0.98, 0.6, s);

  vec4 pos = u_viewProj * vec4(x, h, z, 1.0);
  gl_Position = pos;

  // Colour: silvery points, aurora tint drifting across the field, crests brighter.
  float band = snoise(vec2(x * 0.035 + t * 0.015, z * 0.03));
  vec3 tint = mix(u_ocean, u_midnight, smoothstep(-0.45, 0.25, band));
  tint = mix(tint, u_forest, smoothstep(0.35, 0.85, band));
  float crest = smoothstep(-0.7, 1.5, h);
  vec3 col = mix(u_slate, tint, 0.6 + 0.4 * crest) * (0.75 + 0.6 * crest);
  float light = clamp(glow * 1.25 + packet, 0.0, 1.0);
  col = mix(col, u_volt, light);

  float fog = smoothstep(62.0, 16.0, dist) * smoothstep(3.6, 6.5, dist);
  float size = u_pointScale / dist * (1.0 + glow * 1.5 + packet * 1.2);
  float a = fog * (0.3 + 1.0 * crest + 0.6 * light);
  if (u_lines > 0.5) {
    a *= 0.17 + 0.2 * crest + 0.3 * light;
  } else {
    a *= clamp(size, 0.3, 1.0); // sub-pixel points fade instead of shimmering
  }
  gl_PointSize = max(size, 1.0);
  v_color = vec4(col, a);
  v_point = 1.0 - u_lines;
}
`

const FIELD_FS = /* glsl */ `${PRECISION}
varying vec4 v_color;
varying float v_point;
void main() {
  float a = v_color.a;
  if (v_point > 0.5) {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    a *= smoothstep(1.0, 0.15, r);
  }
  gl_FragColor = vec4(v_color.rgb * a, 1.0);
}
`

type Mat4 = Float32Array
type Vec3 = [number, number, number]

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Camera basis plus the combined view-projection matrix (column-major). */
function camera(eye: Vec3, target: Vec3, fovY: number, aspect: number) {
  const f = norm(sub(target, eye))
  const r = norm(cross(f, [0, 1, 0]))
  const u = cross(r, f)
  const tanY = Math.tan(fovY / 2)
  const tanX = tanY * aspect
  const near = 0.1
  const far = 200
  // view = [r; u; -f] rows with translation; proj = standard perspective.
  const view = [
    r[0], u[0], -f[0], 0,
    r[1], u[1], -f[1], 0,
    r[2], u[2], -f[2], 0,
    -dot(r, eye), -dot(u, eye), dot(f, eye), 1,
  ]
  const p0 = 1 / tanX
  const p5 = 1 / tanY
  const p10 = (far + near) / (near - far)
  const p14 = (2 * far * near) / (near - far)
  const m: Mat4 = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    const vx = view[c * 4]!
    const vy = view[c * 4 + 1]!
    const vz = view[c * 4 + 2]!
    const vw = view[c * 4 + 3]!
    m[c * 4] = p0 * vx
    m[c * 4 + 1] = p5 * vy
    m[c * 4 + 2] = p10 * vz + p14 * vw
    m[c * 4 + 3] = -vz
  }
  // Screen height of the horizon (0 bottom .. 1 top): where a direction parallel to the ground lands.
  const hz = Math.max(-f[1], 0)
  const horizon = 0.5 + (0.5 * (hz / Math.max(Math.hypot(f[0], f[2]), 1e-4))) / tanY
  return { m, f, r, u, tanX, tanY, horizon }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** Frame-rate independent easing: `k` per 60 fps frame, scaled to `dt` frames. */
const ease = (k: number, dt: number) => 1 - Math.pow(1 - k, dt)

type GL = WebGLRenderingContext | WebGL2RenderingContext

function compile(gl: GL, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)
  if (!sh) throw new Error('shader')
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`shader: ${log ?? ''}`)
  }
  return sh
}

function program(gl: GL, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()
  if (!p) throw new Error('program')
  const v = compile(gl, gl.VERTEX_SHADER, vs)
  const f = compile(gl, gl.FRAGMENT_SHADER, fs)
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(p)
    gl.deleteProgram(p)
    throw new Error(`link: ${log ?? ''}`)
  }
  return p
}

/** Create the field on `canvas`, listening for the pointer on `host`. Returns null without WebGL. */
export function createHeroField(canvas: HTMLCanvasElement, host: HTMLElement, opts: HeroFieldOptions): HeroField | null {
  const dpr0 = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const attrs: WebGLContextAttributes = {
    alpha: false,
    // MSAA keeps the 1px ridgelines smooth on standard-density screens; at 2x the pixels do that job.
    antialias: dpr0 < 1.5,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  }
  let gl: GL | null = null
  try {
    gl = (canvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ?? (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null)
  } catch {
    gl = null
  }
  if (!gl) return null
  const g: GL = gl

  const C = {
    ink: hex('#0B0F1C'),
    inkHi: hex('#0D1222'),
    ocean: hex('#38BDF8'),
    forest: hex('#4ADE80'),
    midnight: hex('#A5B4FC'),
    sunrise: hex('#FB923C'),
    slate: hex('#CBD5E1'),
    volt: hex('#C5F04A'),
  }

  let sky: WebGLProgram | null = null
  let field: WebGLProgram | null = null
  let skyBuf: WebGLBuffer | null = null
  let gridBuf: WebGLBuffer | null = null
  let lineBuf: WebGLBuffer | null = null
  let skyLoc: Record<string, WebGLUniformLocation | null> = {}
  let fieldLoc: Record<string, WebGLUniformLocation | null> = {}
  let skyPos = -1
  let fieldGrid = -1
  let cols = 0
  let rows = 0
  let pointCount = 0
  let lineCount = 0

  let animate = opts.animate
  let time = STILL_TIME
  let raf = 0
  let last = 0
  let inView = true
  let lost = false
  let ready = false
  let destroyed = false
  // Render scale (device pixels per CSS pixel): follows the screen's DPR (capped) until adaptive quality
  // has lowered it because frames ran long.
  let scale = dpr0
  let degraded = false
  let w = 1
  let h = 1
  let slowFrames = 0
  let frameAvg = 16.7

  // Pointer: CSS px in the host (lerped), strength, and a -1..1 parallax offset.
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 }
  const par = { x: 0, y: 0, tx: 0, ty: 0 }
  const cursor = { x: 0, z: -12, on: 0 }
  const ripples: { x: number; z: number; t0: number }[] = []
  const rippleData = new Float32Array(MAX_RIPPLES * 4)

  const buildGrid = () => {
    const nc = clamp(Math.round(w / 8.5), 60, 240)
    const nr = clamp(Math.round(h / 8), 70, 120)
    if (nc === cols && nr === rows && gridBuf) return
    cols = nc
    rows = nr
    const verts = new Float32Array(cols * rows * 3)
    let k = 0
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        verts[k++] = i / (cols - 1)
        verts[k++] = j / (rows - 1)
        verts[k++] = Math.random()
      }
    }
    const idx = new Uint16Array(rows * (cols - 1) * 2)
    k = 0
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols - 1; i++) {
        idx[k++] = j * cols + i
        idx[k++] = j * cols + i + 1
      }
    }
    if (gridBuf) g.deleteBuffer(gridBuf)
    if (lineBuf) g.deleteBuffer(lineBuf)
    gridBuf = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, gridBuf)
    g.bufferData(g.ARRAY_BUFFER, verts, g.STATIC_DRAW)
    lineBuf = g.createBuffer()
    g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, lineBuf)
    g.bufferData(g.ELEMENT_ARRAY_BUFFER, idx, g.STATIC_DRAW)
    pointCount = cols * rows
    lineCount = idx.length
  }

  const init = () => {
    sky = program(g, SKY_VS, SKY_FS)
    field = program(g, FIELD_VS, FIELD_FS)
    const names = (p: WebGLProgram, list: string[]) =>
      Object.fromEntries(list.map((n) => [n, g.getUniformLocation(p, n)])) as Record<string, WebGLUniformLocation | null>
    const colours = ['u_ink', 'u_inkHi', 'u_ocean', 'u_forest', 'u_midnight', 'u_sunrise', 'u_slate', 'u_volt']
    skyLoc = names(sky, ['u_res', 'u_time', 'u_scale', 'u_horizon', 'u_pointer', ...colours])
    fieldLoc = names(field, ['u_viewProj', 'u_time', 'u_slope', 'u_pointScale', 'u_rows', 'u_lines', 'u_eye', 'u_cursor', 'u_ripples', ...colours])
    skyPos = g.getAttribLocation(sky, 'a_pos')
    fieldGrid = g.getAttribLocation(field, 'a_grid')
    skyBuf = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, skyBuf)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW)
    cols = 0
    rows = 0
    gridBuf = null
    lineBuf = null
    buildGrid()
    const setColours = (p: WebGLProgram, loc: Record<string, WebGLUniformLocation | null>) => {
      g.useProgram(p)
      for (const key of Object.keys(C) as (keyof typeof C)[]) {
        const l = loc[`u_${key}`]
        if (l) g.uniform3fv(l, C[key])
      }
    }
    setColours(sky, skyLoc)
    setColours(field, fieldLoc)
  }

  const view = () => {
    const aspect = w / h
    // Portrait screens look down more steeply so the field fills the space above the copy.
    const portrait = aspect < 1
    const fovY = ((portrait ? 60 : 46) * Math.PI) / 180
    const eye: Vec3 = [par.x * 0.9, (portrait ? 3.8 : 3.0) - par.y * 0.3, 4]
    const target: Vec3 = [par.x * 0.3, 0, portrait ? -6 : -14]
    return { ...camera(eye, target, fovY, aspect), eye }
  }

  /** Where the (lerped) pointer meets the ground plane, or null above the horizon. */
  const pick = (cam: ReturnType<typeof view>) => {
    const nx = (ptr.x / w) * 2 - 1
    const ny = 1 - (ptr.y / h) * 2
    const dir: Vec3 = [
      cam.f[0] + cam.r[0] * nx * cam.tanX + cam.u[0] * ny * cam.tanY,
      cam.f[1] + cam.r[1] * nx * cam.tanX + cam.u[1] * ny * cam.tanY,
      cam.f[2] + cam.r[2] * nx * cam.tanX + cam.u[2] * ny * cam.tanY,
    ]
    if (dir[1] > -0.015) return null
    const s = -cam.eye[1] / dir[1]
    return { x: cam.eye[0] + dir[0] * s, z: cam.eye[2] + dir[2] * s }
  }

  const render = () => {
    if (lost || destroyed || !sky || !field || !gridBuf || !lineBuf) return
    const cam = view()
    g.viewport(0, 0, canvas.width, canvas.height)

    // Sky.
    g.disable(g.BLEND)
    g.useProgram(sky)
    g.uniform2f(skyLoc.u_res!, canvas.width, canvas.height)
    g.uniform1f(skyLoc.u_time!, time)
    g.uniform1f(skyLoc.u_scale!, scale)
    g.uniform1f(skyLoc.u_horizon!, cam.horizon)
    g.uniform3f(skyLoc.u_pointer!, ptr.x / w, 1 - ptr.y / h, ptr.on)
    g.bindBuffer(g.ARRAY_BUFFER, skyBuf)
    g.enableVertexAttribArray(skyPos)
    g.vertexAttribPointer(skyPos, 2, g.FLOAT, false, 0, 0)
    g.drawArrays(g.TRIANGLES, 0, 3)
    g.disableVertexAttribArray(skyPos)

    // Field: additive light over the sky.
    g.enable(g.BLEND)
    g.blendFunc(g.ONE, g.ONE)
    g.useProgram(field)
    g.uniformMatrix4fv(fieldLoc.u_viewProj!, false, cam.m)
    g.uniform1f(fieldLoc.u_time!, time)
    g.uniform1f(fieldLoc.u_slope!, cam.tanX * 1.15)
    g.uniform1f(fieldLoc.u_pointScale!, 21 * scale)
    g.uniform1f(fieldLoc.u_rows!, rows - 1)
    g.uniform3f(fieldLoc.u_eye!, cam.eye[0], cam.eye[1], cam.eye[2])
    g.uniform3f(fieldLoc.u_cursor!, cursor.x, cursor.z, cursor.on)
    rippleData.fill(0)
    ripples.forEach((r, i) => {
      rippleData.set([r.x, r.z, time - r.t0, 1], i * 4)
    })
    g.uniform4fv(fieldLoc.u_ripples!, rippleData)
    g.bindBuffer(g.ARRAY_BUFFER, gridBuf)
    g.enableVertexAttribArray(fieldGrid)
    g.vertexAttribPointer(fieldGrid, 3, g.FLOAT, false, 0, 0)
    g.uniform1f(fieldLoc.u_lines!, 1)
    g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, lineBuf)
    g.drawElements(g.LINES, lineCount, g.UNSIGNED_SHORT, 0)
    g.uniform1f(fieldLoc.u_lines!, 0)
    g.drawArrays(g.POINTS, 0, pointCount)
    g.disableVertexAttribArray(fieldGrid)

    if (!ready) {
      ready = true
      opts.onReady?.()
    }
  }

  const resize = () => {
    const rect = host.getBoundingClientRect()
    w = Math.max(1, Math.round(rect.width))
    h = Math.max(1, Math.round(rect.height))
    if (!degraded) scale = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const cw = Math.round(w * scale)
    const ch = Math.round(h * scale)
    if (canvas.width !== cw) canvas.width = cw
    if (canvas.height !== ch) canvas.height = ch
    if (!lost && sky) buildGrid()
    if (!raf) render()
  }

  const step = (dt: number, dtMs: number) => {
    time += dtMs / 1000
    ptr.x = lerp(ptr.x, ptr.tx, ease(0.14, dt))
    ptr.y = lerp(ptr.y, ptr.ty, ease(0.14, dt))
    ptr.on = lerp(ptr.on, ptr.ton, ease(0.06, dt))
    par.x = lerp(par.x, par.tx, ease(0.05, dt))
    par.y = lerp(par.y, par.ty, ease(0.05, dt))
    host.style.setProperty('--hx', par.x.toFixed(4))
    host.style.setProperty('--hy', par.y.toFixed(4))
    const hit = ptr.on > 0.001 ? pick(view()) : null
    if (hit) {
      cursor.x = cursor.on < 0.02 ? hit.x : lerp(cursor.x, hit.x, ease(0.25, dt))
      cursor.z = cursor.on < 0.02 ? hit.z : lerp(cursor.z, hit.z, ease(0.25, dt))
    }
    // Far away the bulge would be a speck: let it fade toward the horizon.
    const reach = hit ? clamp((hit.z + 40) / 22, 0, 1) : 0
    cursor.on = lerp(cursor.on, ptr.on * reach, ease(0.08, dt))
    for (let i = ripples.length - 1; i >= 0; i--) {
      if (time - ripples[i]!.t0 > RIPPLE_LIFE) ripples.splice(i, 1)
    }
  }

  const frame = (now: number) => {
    const dtMs = last ? clamp(now - last, 0, 50) : 16.7
    last = now
    // Adaptive quality: if frames stay slow for ~2 s, drop the render scale one notch (never below 1).
    frameAvg = lerp(frameAvg, dtMs, 0.05)
    slowFrames = frameAvg > 24 ? slowFrames + 1 : 0
    if (slowFrames > 120 && scale > 1) {
      scale = Math.max(1, scale - 0.5)
      degraded = true
      slowFrames = 0
      frameAvg = 16.7
      resize()
    }
    step(dtMs / 16.667, dtMs)
    render()
    raf = requestAnimationFrame(frame)
  }

  const start = () => {
    if (raf || !animate || !inView || lost || destroyed || document.visibilityState !== 'visible') return
    last = 0
    raf = requestAnimationFrame(frame)
  }
  const stop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }
  const sync = () => (inView && document.visibilityState === 'visible' ? start() : stop())

  const local = (e: PointerEvent) => {
    const rect = host.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const onMove = (e: PointerEvent) => {
    if (!animate || (e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return
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
    if (!animate || e.pointerType === 'mouse') return
    const p = local(e)
    const saved = { x: ptr.x, y: ptr.y }
    ptr.x = p.x
    ptr.y = p.y
    const hit = pick(view())
    ptr.x = saved.x
    ptr.y = saved.y
    if (!hit) return
    if (ripples.length >= MAX_RIPPLES) ripples.shift()
    ripples.push({ x: hit.x, z: hit.z, t0: time })
  }

  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
    stop()
    opts.onLost?.()
  }
  const onRestored = () => {
    lost = false
    try {
      init()
    } catch {
      return
    }
    resize()
    render()
    opts.onRestored?.()
    start()
  }

  try {
    init()
  } catch {
    g.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => resize()) : undefined
  ro?.observe(host)
  if (!ro) window.addEventListener('resize', resize)
  let io: IntersectionObserver | undefined
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      inView = entries.some((en) => en.isIntersecting)
      sync()
    })
    io.observe(host)
  }
  document.addEventListener('visibilitychange', sync)
  if (opts.finePointer) {
    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave, { passive: true })
  }
  host.addEventListener('pointerdown', onDown, { passive: true })

  resize()
  start()

  return {
    setAnimate(on: boolean) {
      if (on === animate || destroyed) return
      animate = on
      if (on) {
        start()
      } else {
        // Pause: freeze on the current frame and settle the pointer state.
        stop()
        onLeave()
        ptr.on = 0
        cursor.on = 0
        par.x = 0
        par.y = 0
        ripples.length = 0
        host.style.removeProperty('--hx')
        host.style.removeProperty('--hy')
        render()
      }
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      stop()
      ro?.disconnect()
      if (!ro) window.removeEventListener('resize', resize)
      io?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      host.style.removeProperty('--hx')
      host.style.removeProperty('--hy')
      if (!g.isContextLost()) {
        g.deleteBuffer(skyBuf)
        g.deleteBuffer(gridBuf)
        g.deleteBuffer(lineBuf)
        g.deleteProgram(sky)
        g.deleteProgram(field)
        g.getExtension('WEBGL_lose_context')?.loseContext()
      }
    },
  }
}
