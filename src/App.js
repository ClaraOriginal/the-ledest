import { useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// ─── Segment definitions (order matches WLED wiring) ───
const SEGMENTS = [
  // Outer triangle
  { from: [-17.4, 10, 0], to: [-8.7, -5, 0], count: 57 },
  { from: [-8.7, -5, 0], to: [0, -20, 0], count: 57 },
  { from: [0, -20, 0], to: [8.7, -5, 0], count: 57 },
  { from: [8.7, -5, 0], to: [17.4, 10, 0], count: 57 },
  { from: [17.4, 10, 0], to: [0, 10, 0], count: 57 },
  { from: [0, 10, 0], to: [-17.4, 10, 0], count: 57 },
  // Inner triangle
  { from: [-8.7, -5, 0], to: [0, 10, 0], count: 57 },
  { from: [0, 10, 0], to: [8.7, -5, 0], count: 57 },
  { from: [8.7, -5, 0], to: [-8.7, -5, 0], count: 57 },
]

const SCALE = 0.9
const GAP = 0.3
const CENTER = [0, 10, 0]
const TOTAL_PIXELS = SEGMENTS.reduce((sum, s) => sum + s.count, 0) // 513

// ─── Precompute all LED positions once ───
function precomputePositions() {
  const positions = []
  for (const seg of SEGMENTS) {
    const { from, to, count } = seg
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const length = Math.sqrt(dx * dx + dy * dy)
    const step = length / count
    for (let i = 0; i < count; i++) {
      const dist = i * step + step / 2
      let t = dist / length
      t = 0.5 + (t - 0.5) * SCALE
      const x = from[0] + (to[0] - from[0]) * t
      const y = from[1] + (to[1] - from[1]) * t
      const z = from[2] + (to[2] - from[2]) * t
      positions.push([x, y, z])
    }
  }
  return positions
}

const LED_POSITIONS = precomputePositions()

// ─── Compute color for one LED (same logic as the shader) ───
function computeColor(pos, time) {
  const vx = pos[0] - CENTER[0]
  const vy = pos[1] - CENTER[1]
  const vz = pos[2] - CENTER[2]
  const dist = Math.sqrt(vx * vx + vy * vy + vz * vz)

  let s = Math.sin(dist * dist * 0.1 - time * 10)
  s *= 10
  s = Math.max(-1, Math.min(1, s))
  s = (s + 1) / 2

  const r = 1
  const g = 1 - s
  const b = 0

  return [
    Math.min(255, Math.max(0, Math.round(r * 255))),
    Math.min(255, Math.max(0, Math.round(g * 255))),
    Math.min(255, Math.max(0, Math.round(b * 255))),
  ]
}

// ─── WebSocket singleton ───
let ws = null
let wsReady = false

function connectWS() {
  if (ws) return
  ws = new WebSocket('ws://localhost:9001')
  ws.binaryType = 'arraybuffer'
  ws.onopen = () => {
    wsReady = true
    console.log('Connected to WLED bridge')
  }
  ws.onclose = () => {
    wsReady = false
    ws = null
    console.log('Bridge disconnected, reconnecting in 2s...')
    setTimeout(connectWS, 2000)
  }
  ws.onerror = () => {
    ws.close()
  }
}

// ─── Component that pushes LED data every frame ───
function WLEDPusher({ fps = 30 }) {
  const lastSend = useRef(0)
  const buffer = useRef(new Uint8Array(TOTAL_PIXELS * 3))

  useEffect(() => {
    connectWS()
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const now = performance.now()

    // Throttle to target FPS
    if (now - lastSend.current < 1000 / fps) return
    lastSend.current = now

    // Fill buffer
    const buf = buffer.current
    for (let i = 0; i < TOTAL_PIXELS; i++) {
      const [r, g, b] = computeColor(LED_POSITIONS[i], time)
      buf[i * 3] = r
      buf[i * 3 + 1] = g
      buf[i * 3 + 2] = b
    }

    // Send
    if (wsReady && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(buf.buffer)
    }
  })

  return null
}

// ─── Visual box (unchanged) ───
function Box({ position, rotation, length }) {
  const materialRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const vx = position[0] - CENTER[0]
    const vy = position[1] - CENTER[1]
    const vz = position[2] - CENTER[2]
    const dist = Math.sqrt(vx * vx + vy * vy + vz * vz)

    let s = Math.sin(dist * dist * 0.1 - time * 10)
    s *= 10
    s = Math.max(-1, Math.min(1, s))
    s = (s + 1) / 2

    materialRef.current.color.setRGB(1, 1 - s, 0)
  })

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.3, 0.3]} />
      <meshStandardMaterial ref={materialRef} />
    </mesh>
  )
}

function Segment({ from, to, count = 57 }) {
  const boxes = []
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)
  const step = length / count
  const boxLength = (length / count) * (1 - GAP)

  for (let i = 0; i < count; i++) {
    const dist = i * step + step / 2
    let t = dist / length
    t = 0.5 + (t - 0.5) * SCALE
    const pos = [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    ]
    boxes.push(
      <Box key={i} position={pos} rotation={[0, 0, angle]} length={boxLength} />
    )
  }
  return <>{boxes}</>
}

export default function App() {
  return (
    <Canvas>
      <color attach="background" args={['black']} />
      <ambientLight intensity={3} />

      {SEGMENTS.map((seg, i) => (
        <Segment key={i} from={seg.from} to={seg.to} count={seg.count} />
      ))}

      {/* This invisible component pushes colors to WLED */}
      <WLEDPusher fps={30} />

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
      </EffectComposer>
      <OrbitControls />
    </Canvas>
  )
}