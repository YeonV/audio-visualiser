/**
 * 3D Geometry Renderer
 *
 * Renders 3D shapes with wireframe/solid modes, shading, and audio reactivity.
 */

import type { Geometry3DLayer, GeometryData, GeometryCache, AudioDataArray } from './types'
import { getCompositeOperation, hexToRgb } from './types'

export interface Geometry3DRenderOptions {
  ctx: CanvasRenderingContext2D
  layer: Geometry3DLayer
  audioData: AudioDataArray
  centerX: number
  centerY: number
  geometryCache: GeometryCache
}

/**
 * Get cached geometry data or create new
 */
export function getGeometryData(shape: string, size: number, cache: GeometryCache): GeometryData {
  const cacheKey = `${shape}-${size}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  let vertices: [number, number, number][] = []
  let edges: [number, number][] = []
  let faces: [number, number, number][] = []
  const s = size / 2

  switch (shape) {
    case 'Box':
      vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
      ]
      edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ]
      faces = [
        [0, 1, 2], [0, 2, 3],
        [4, 6, 5], [4, 7, 6],
        [0, 4, 5], [0, 5, 1],
        [2, 6, 7], [2, 7, 3],
        [0, 3, 7], [0, 7, 4],
        [1, 5, 6], [1, 6, 2]
      ]
      break
    case 'Sphere': {
      const t = (1 + Math.sqrt(5)) / 2
      const r = s * 0.7
      vertices = [
        [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
        [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
        [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
      ].map(([x, y, z]) => [x * r / t, y * r / t, z * r / t] as [number, number, number])
      edges = [
        [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
        [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
        [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
        [4, 9], [2, 4], [6, 2], [8, 6], [9, 8],
        [4, 5], [2, 11], [6, 10], [8, 7], [9, 1]
      ]
      faces = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
      ]
      break
    }
    case 'Dodecahedron': {
      const phi = (1 + Math.sqrt(5)) / 2
      const r = s * 0.5
      vertices = [
        [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
        [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
        [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
        [1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, phi], [-1/phi, 0, -phi],
        [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
      ].map(([x, y, z]) => [x * r, y * r, z * r] as [number, number, number])
      edges = [
        [0, 16], [0, 8], [0, 12], [16, 17], [16, 1],
        [8, 4], [8, 9], [12, 2], [12, 14], [17, 2],
        [1, 9], [4, 14], [9, 5], [5, 18], [18, 4],
        [14, 6], [6, 19], [19, 18], [2, 10], [10, 6],
        [17, 3], [3, 11], [11, 10], [1, 13], [13, 3],
        [5, 15], [15, 13], [15, 7], [7, 19], [7, 11]
      ]
      faces = [
        [0, 8, 4], [0, 4, 14], [0, 14, 12],
        [0, 12, 2], [0, 2, 17], [0, 17, 16],
        [0, 16, 1], [0, 1, 9], [0, 9, 8],
        [8, 9, 5], [8, 5, 18], [8, 18, 4],
        [4, 18, 19], [4, 19, 6], [4, 6, 14],
        [14, 6, 10], [14, 10, 2], [14, 2, 12],
        [2, 10, 11], [2, 11, 3], [2, 3, 17],
        [17, 3, 13], [17, 13, 1], [17, 1, 16],
        [1, 13, 15], [1, 15, 5], [1, 5, 9],
        [5, 15, 7], [5, 7, 19], [5, 19, 18],
        [19, 7, 11], [19, 11, 10], [19, 10, 6],
        [7, 15, 13], [7, 13, 3], [7, 3, 11]
      ]
      break
    }
    case 'Icosahedron': {
      const phi = (1 + Math.sqrt(5)) / 2
      const r = s * 0.6
      vertices = [
        [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
        [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
        [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
      ].map(([x, y, z]) => [x * r, y * r, z * r] as [number, number, number])
      edges = [
        [0, 1], [0, 4], [0, 5], [0, 8], [0, 9],
        [1, 6], [1, 7], [1, 8], [1, 9],
        [2, 3], [2, 4], [2, 5], [2, 10], [2, 11],
        [3, 6], [3, 7], [3, 10], [3, 11],
        [4, 5], [4, 8], [4, 10], [5, 9], [5, 11],
        [6, 7], [6, 8], [6, 10], [7, 9], [7, 11],
        [8, 10], [9, 11]
      ]
      faces = [
        [0, 8, 1], [0, 4, 8], [0, 5, 4], [0, 9, 5], [0, 1, 9],
        [1, 8, 6], [8, 4, 10], [4, 5, 2], [5, 9, 11], [9, 1, 7],
        [6, 8, 10], [10, 4, 2], [2, 5, 11], [11, 9, 7], [7, 1, 6],
        [3, 6, 10], [3, 10, 2], [3, 2, 11], [3, 11, 7], [3, 7, 6]
      ]
      break
    }
    case 'Octahedron':
      vertices = [
        [s, 0, 0], [-s, 0, 0],
        [0, s, 0], [0, -s, 0],
        [0, 0, s], [0, 0, -s]
      ]
      edges = [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 4], [2, 5], [3, 4], [3, 5]
      ]
      faces = [
        [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
        [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]
      ]
      break
    case 'Tetrahedron':
      vertices = [
        [s, s, s], [s, -s, -s], [-s, s, -s], [-s, -s, s]
      ]
      edges = [
        [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
      ]
      faces = [
        [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
      ]
      break
    case 'Torus': {
      const segments = 16
      const rings = 12
      const outerR = s * 0.6
      const innerR = s * 0.25
      vertices = []
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        for (let j = 0; j < rings; j++) {
          const phi = (j / rings) * Math.PI * 2
          const x = (outerR + innerR * Math.cos(phi)) * Math.cos(theta)
          const y = innerR * Math.sin(phi)
          const z = (outerR + innerR * Math.cos(phi)) * Math.sin(theta)
          vertices.push([x, y, z])
        }
      }
      edges = []
      faces = []
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < rings; j++) {
          const current = i * rings + j
          const nextJ = i * rings + ((j + 1) % rings)
          const nextI = ((i + 1) % segments) * rings + j
          const nextIJ = ((i + 1) % segments) * rings + ((j + 1) % rings)
          edges.push([current, nextJ])
          edges.push([current, nextI])
          faces.push([current, nextI, nextIJ])
          faces.push([current, nextIJ, nextJ])
        }
      }
      break
    }
    case 'Torus Knot': {
      const segments = 64
      const p = 2, q = 3
      const radius = s * 0.5
      vertices = []
      for (let i = 0; i < segments; i++) {
        const t = (i / segments) * Math.PI * 2
        const r = radius * (2 + Math.cos(q * t))
        const x = r * Math.cos(p * t)
        const y = radius * Math.sin(q * t) * 1.5
        const z = r * Math.sin(p * t)
        vertices.push([x, y, z])
      }
      edges = []
      for (let i = 0; i < segments; i++) {
        edges.push([i, (i + 1) % segments])
      }
      faces = []
      break
    }
    default:
      vertices = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
      ]
      edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ]
      faces = [
        [0, 1, 2], [0, 2, 3],
        [4, 6, 5], [4, 7, 6],
        [0, 4, 5], [0, 5, 1],
        [2, 6, 7], [2, 7, 3],
        [0, 3, 7], [0, 7, 4],
        [1, 5, 6], [1, 6, 2]
      ]
  }

  const result = { vertices, edges, faces }
  cache.set(cacheKey, result)
  return result
}

/**
 * Render 3D geometry layer
 */
export function renderGeometry3D({
  ctx,
  layer,
  audioData,
  centerX,
  centerY,
  geometryCache
}: Geometry3DRenderOptions): void {
  let sum = 0
  for (let i = 0; i < audioData.length; i++) sum += audioData[i]
  const avgAmplitude = audioData.length > 0 ? sum / audioData.length : 0
  const audioRotation = layer.audioReactive ? avgAmplitude * 2 : 0

  ctx.save()
  ctx.translate(centerX + layer.x, centerY + layer.y)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.scale(layer.scale, layer.scale)
  ctx.globalAlpha = layer.opacity
  ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode)

  const { vertices, edges, faces } = getGeometryData(layer.shape, layer.size, geometryCache)

  // Precompute rotation values
  const rotX = ((layer.rotationX + audioRotation * 50) * Math.PI) / 180
  const rotY = ((layer.rotationY + audioRotation * 30) * Math.PI) / 180
  const rotZ = ((layer.rotationZ + audioRotation * 20) * Math.PI) / 180
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ)

  // Transform and project all vertices
  const transformed: [number, number, number][] = []
  const projected: [number, number][] = []
  for (let i = 0; i < vertices.length; i++) {
    const [vx, vy, vz] = vertices[i]
    // Rotate around X
    const y1 = vy * cosX - vz * sinX
    const z1 = vy * sinX + vz * cosX
    // Rotate around Y
    const x2 = vx * cosY + z1 * sinY
    const z2 = -vx * sinY + z1 * cosY
    // Rotate around Z
    const x3 = x2 * cosZ - y1 * sinZ
    const y3 = x2 * sinZ + y1 * cosZ
    transformed[i] = [x3, y3, z2]
    // Perspective projection
    const scale = 400 / (400 + z2)
    projected[i] = [x3 * scale, y3 * scale]
  }

  // Light direction (from top-right-front)
  const lightDir: [number, number, number] = [0.5, -0.7, 0.5]
  const lightLen = Math.sqrt(lightDir[0] * lightDir[0] + lightDir[1] * lightDir[1] + lightDir[2] * lightDir[2])
  lightDir[0] /= lightLen
  lightDir[1] /= lightLen
  lightDir[2] /= lightLen

  // Parse base color
  const [baseR, baseG, baseB] = hexToRgb(layer.color)

  // Solid rendering with faces
  if (!layer.wireframe && faces.length > 0) {
    const faceData: { idx: number; depth: number; normal: [number, number, number] }[] = []

    for (let i = 0; i < faces.length; i++) {
      const [i0, i1, i2] = faces[i]
      const v0 = transformed[i0]
      const v1 = transformed[i1]
      const v2 = transformed[i2]
      if (!v0 || !v1 || !v2) continue

      // Calculate face normal (cross product)
      const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2]
      const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2]
      const nx = ay * bz - az * by
      const ny = az * bx - ax * bz
      const nz = ax * by - ay * bx
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const normal: [number, number, number] = nLen > 0 ? [nx / nLen, ny / nLen, nz / nLen] : [0, 0, 1]

      // Backface culling
      if (normal[2] < 0) continue

      const depth = (v0[2] + v1[2] + v2[2]) / 3
      faceData.push({ idx: i, depth, normal })
    }

    // Sort faces by depth (far to near)
    faceData.sort((a, b) => a.depth - b.depth)

    // Render faces
    for (const face of faceData) {
      const [i0, i1, i2] = faces[face.idx]
      const p0 = projected[i0]
      const p1 = projected[i1]
      const p2 = projected[i2]
      if (!p0 || !p1 || !p2) continue

      // Calculate lighting
      let intensity = 0.3
      const [nx, ny, nz] = face.normal
      const diffuse = Math.max(0, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2])

      switch (layer.material) {
        case 'Basic':
          intensity = 1
          break
        case 'Lambert':
          intensity = 0.3 + diffuse * 0.7
          break
        case 'Phong':
        case 'Standard': {
          const spec = Math.pow(Math.max(0, nz), 32)
          intensity = 0.3 + diffuse * 0.5 + spec * 0.4
          break
        }
        case 'Normal':
          ctx.fillStyle = `rgb(${Math.floor((nx + 1) * 127.5)}, ${Math.floor((ny + 1) * 127.5)}, ${Math.floor((nz + 1) * 127.5)})`
          break
        default:
          intensity = 0.3 + diffuse * 0.7
      }

      if (layer.shading === 'Smooth') {
        intensity = Math.min(1, intensity * 1.1)
      }

      if (layer.material !== 'Normal') {
        const r = Math.min(255, Math.floor(baseR * intensity))
        const g = Math.min(255, Math.floor(baseG * intensity))
        const b = Math.min(255, Math.floor(baseB * intensity))
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      }

      ctx.beginPath()
      ctx.moveTo(p0[0], p0[1])
      ctx.lineTo(p1[0], p1[1])
      ctx.lineTo(p2[0], p2[1])
      ctx.closePath()
      ctx.fill()

      if (layer.edges) {
        ctx.strokeStyle = layer.edgeColor
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  } else {
    // Wireframe mode
    ctx.strokeStyle = layer.color
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < edges.length; i++) {
      const [i1, i2] = edges[i]
      const p1 = projected[i1]
      const p2 = projected[i2]
      if (p1 && p2) {
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
      }
    }
    ctx.stroke()
  }

  ctx.restore()
}

export default renderGeometry3D
