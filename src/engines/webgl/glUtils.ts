export function hasGL(gl: unknown): gl is WebGLRenderingContext | WebGL2RenderingContext {
  return !!gl && typeof (gl as any).createFramebuffer === 'function'
}

export function warnNoGL(context = ''): void {
  // Lightweight helper to centralize messages
  // Keep console call non-throwing so tests can continue
  console.warn(`WebGL context not available${context ? `: ${context}` : ''}`)
}

export default { hasGL, warnNoGL }
