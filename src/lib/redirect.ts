/** Only same-origin paths such as "/learn/1" are allowed as a post-login destination. */
export function safeNext(param: string | null | undefined, fallback = '/dashboard'): string {
  if (!param) return fallback
  if (!param.startsWith('/') || param.startsWith('//') || param.startsWith('/\\')) return fallback
  for (let i = 0; i < param.length; i++) {
    if (param.charCodeAt(i) < 32) return fallback
  }
  return param
}
