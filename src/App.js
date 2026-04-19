import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

function Box({ position, rotation, length, segmentId, index, total }) {
  const materialRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    const dist = Math.sqrt(position[0] * position[0] + position[1] * position[1] + position[2] * position[2])

    var s = Math.sin(dist * dist * 0.1 - time * 10)
    s *= 10
    s = Math.max(-1, Math.min(1, s))
    s = (s + 1) / 2

    const r = 1
    const g = 1 - s
    const b = 0

    materialRef.current.color.setRGB(r, g, b)
  })

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.3, 0.3]} />
      <meshStandardMaterial ref={materialRef} />
    </mesh>
  )
}

function Segment({ from = [0, 0, 0], to = [1, 0, 0], count = 57, scale = 1, gap = 0.3, segmentId = 0 }) {
  const boxes = []
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const length = Math.sqrt(dx * dx + dy * dy)

  const angle = Math.atan2(dy, dx)

  const baseLength = length / count
  const boxLength = baseLength * (1 - gap)

  const step = length / count

  for (let i = 0; i < count; i++) {
    const dist = i * step + step / 2
    let t = dist / length

    t = 0.5 + (t - 0.5) * scale

    const pos = lerp(from, to, t)

    boxes.push(<Box key={i} position={pos} rotation={[0, 0, angle]} length={boxLength} segmentId={segmentId} index={i} total={count} />)
  }

  return <>{boxes}</>
}

export default function App() {
  return (
    <Canvas>
      <color attach="background" args={['black']} />
      <ambientLight intensity={3} />

      <Segment from={[-8.7, -5, 0]} to={[8.7, -5, 0]} scale={0.9} />
      <Segment from={[-8.7, -5, 0]} to={[0, 10, 0]} scale={0.9} />
      <Segment from={[8.7, -5, 0]} to={[0, 10, 0]} scale={0.9} />

      <Segment from={[-8.7, -5, 0]} to={[-17.4, 10, 0]} scale={0.9} />
      <Segment from={[-17.4, 10, 0]} to={[0, 10, 0]} scale={0.9} />

      <Segment from={[0, 10, 0]} to={[17.4, 10, 0]} scale={0.9} />
      <Segment from={[17.4, 10, 0]} to={[8.7, -5, 0]} scale={0.9} />

      <Segment from={[8.7, -5, 0]} to={[0, -20, 0]} scale={0.9} />
      <Segment from={[0, -20, 0]} to={[-8.7, -5, 0]} scale={0.9} />

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
      </EffectComposer>

      <OrbitControls />
    </Canvas>
  )
}
