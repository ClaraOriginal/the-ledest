import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Box({ position, rotation, length }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.3, 0.3]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

function Segment({ from = [0, 0, 0], to = [1, 0, 0], count = 30, scale = 1, gap = 0.3 }) {
  const boxes = []

  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const length = Math.sqrt(dx * dx + dy * dy)

  const angle = Math.atan2(dy, dx)

  const baseLength = 0.6
  const boxLength = baseLength * (1 - gap)

  const step = length / count

  for (let i = 0; i < count; i++) {
    const dist = i * step + step / 2
    let t = dist / length

    // scale um die Mitte anwenden
    t = 0.5 + (t - 0.5) * scale

    const pos = lerp(from, to, t)

    boxes.push(<Box key={i} position={pos} rotation={[0, 0, angle]} length={boxLength} />)
  }

  return <>{boxes}</>
}

export default function App() {
  return (
    <Canvas>
      <color attach="background" args={['black']} />
      <ambientLight intensity={0.8} />

      <Segment from={[-8.7, -5, 0]} to={[8.7, -5, 0]} scale={0.9} />
      <Segment from={[-8.7, -5, 0]} to={[0, 10, 0]} scale={0.9} />
      <Segment from={[8.7, -5, 0]} to={[0, 10, 0]} scale={0.9} />

      <Segment from={[-8.7, -5, 0]} to={[-17.4, 10, 0]} scale={0.9} />
      <Segment from={[-17.4, 10, 0]} to={[0, 10, 0]} scale={0.9} />

      <Segment from={[0, 10, 0]} to={[17.4, 10, 0]} scale={0.9} />
      <Segment from={[17.4, 10, 0]} to={[8.7, -5, 0]} scale={0.9} />

      <Segment from={[8.7, -5, 0]} to={[0, -20, 0]} scale={0.9} />
      <Segment from={[0, -20, 0]} to={[-8.7, -5, 0]} scale={0.9} />
      <OrbitControls />
    </Canvas>
  )
}
