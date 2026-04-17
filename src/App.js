import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Box({ position }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

function Segment({ count = 30, start = [0, 0, 0], direction = [1, 0, 0], gap = 0.6 }) {
  const boxes = []
  for (let i = 0; i < count; i++) {
    boxes.push(
      <Box key={i} position={[start[0] + direction[0] * i * gap, start[1] + direction[1] * i * gap, start[2] + direction[2] * i * gap]} />
    )
  }
  return <>{boxes}</>
}

export default function App() {
  return (
    <Canvas>
      <color attach="background" args={['black']} />

      <ambientLight intensity={0.8} />

      {/* unten horizontal */}
      <Segment count={30} start={[-8.7, -5, 0]} direction={[1, 0, 0]} />

      {/* links schräg */}
      <Segment count={30} start={[-8.7, -5, 0]} direction={[0.5, 0.866, 0]} />

      {/* rechts schräg */}
      <Segment count={30} start={[8.7, -5, 0]} direction={[-0.5, 0.866, 0]} />
      <OrbitControls />
    </Canvas>
  )
}
