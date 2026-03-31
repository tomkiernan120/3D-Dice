import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Physics, useBox, usePlane } from '@react-three/cannon'
import { useEffect, useRef, useState } from 'react'
import { Quaternion, Vector3 } from 'three'
import { Dice } from './components/dice'
import './App.css'

type Vec3 = [number, number, number]
type Quat = [number, number, number, number]

const linearThreshold = 0.08
const angularThreshold = 0.12
const settleFramesRequired = 24
const worldUp = new Vector3(0, 1, 0)

const faceMap = [
  { normal: new Vector3(0, 1, 0), value: 1 },
  { normal: new Vector3(0, -1, 0), value: 6 },
  { normal: new Vector3(1, 0, 0), value: 2 },
  { normal: new Vector3(-1, 0, 0), value: 5 },
  { normal: new Vector3(0, 0, 1), value: 3 },
  { normal: new Vector3(0, 0, -1), value: 4 },
]

function magnitude(vec: Vec3) {
  return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2])
}

function getTopFaceValue(quaternion: Quaternion) {
  let bestValue = 1
  let bestDot = -Infinity

  for (const face of faceMap) {
    const worldNormal = face.normal.clone().applyQuaternion(quaternion)
    const dot = worldNormal.dot(worldUp)
    if (dot > bestDot) {
      bestDot = dot
      bestValue = face.value
    }
  }

  return bestValue
}

function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -1.4, 0],
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[5000, 5000]} />
      <meshStandardMaterial color="#2b2e4a" roughness={0} metalness={0} />
    </mesh>
  )
}

function InvisibleWall({ position, size }: { position: Vec3; size: Vec3 }) {
  const [ref] = useBox(() => ({
    type: 'Static',
    args: size,
    position,
  }))

  return (
    <mesh ref={ref} visible={false}>
      <boxGeometry args={size} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

function Bounds() {
  return (
    <>
      <InvisibleWall position={[-2.25, 0.9, -0.4]} size={[0.2, 5, 7]} />
      <InvisibleWall position={[2.25, 0.9, -0.4]} size={[0.2, 5, 7]} />
      <InvisibleWall position={[0, 0.9, -3.7]} size={[5, 5, 0.2]} />
      <InvisibleWall position={[0, 0.9, 2.2]} size={[5, 5, 0.2]} />
    </>
  )
}

function PhysicsDice({
  throwSeed,
  index,
  onSettled,
}: {
  throwSeed: number
  index: number
  onSettled?: (index: number, topValue: number) => void
}) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    args: [1, 1, 1],
    position: [0, 2, 0],
    linearDamping: 0.25,
    angularDamping: 0.2,
  }))

  const linearVelocity = useRef<Vec3>([0, 0, 0])
  const angularVelocity = useRef<Vec3>([0, 0, 0])
  const bodyQuaternion = useRef<Quat>([0, 0, 0, 1])
  const stableFrames = useRef(0)
  const hasSettled = useRef(false)

  useEffect(() => {
    const unsubscribeLinear = api.velocity.subscribe((v) => {
      linearVelocity.current = v
    })
    const unsubscribeAngular = api.angularVelocity.subscribe((v) => {
      angularVelocity.current = v
    })
    const unsubscribeQuaternion = api.quaternion.subscribe((q) => {
      bodyQuaternion.current = q
    })

    return () => {
      unsubscribeLinear()
      unsubscribeAngular()
      unsubscribeQuaternion()
    }
  }, [api])

  useEffect(() => {
    hasSettled.current = false
    stableFrames.current = 0

    const laneOffset = index === 0 ? -0.45 : 0.45
    const randomX = laneOffset + (Math.random() - 0.5) * 0.35
    const randomZ = 1.35 + Math.random() * 0.5

    api.position.set(randomX, 2.4, randomZ)
    api.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    )

    api.velocity.set(
      (Math.random() - 0.5) * 1.1,
      5.5 + Math.random() * 2,
      -(4.2 + Math.random() * 1.8),
    )
    api.angularVelocity.set(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
    )
  }, [throwSeed, index, api])

  useFrame(() => {
    if (hasSettled.current) {
      return
    }

    const linearSpeed = magnitude(linearVelocity.current)
    const angularSpeed = magnitude(angularVelocity.current)

    if (linearSpeed < linearThreshold && angularSpeed < angularThreshold) {
      stableFrames.current += 1
      if (stableFrames.current >= settleFramesRequired) {
        hasSettled.current = true
        const [x, y, z, w] = bodyQuaternion.current
        const topValue = getTopFaceValue(new Quaternion(x, y, z, w))
        onSettled?.(index, topValue)
      }
      return
    }

    stableFrames.current = 0
  })

  return (
    <group ref={ref}>
      <Dice segments={50} outerColor="#eeeeee" innerColor="#111111" />
    </group>
  )
}

function Scene({
  throwSeed,
  onDiceSettled,
}: {
  throwSeed: number
  onDiceSettled: (index: number, topValue: number) => void
}) {
  return (
    <Canvas shadows>
      <PerspectiveCamera
        makeDefault
        position={[6, 4.5, 6]}
        onUpdate={(camera) => camera.lookAt(0, -1.4, 0)}
      />
      <OrbitControls enableZoom enablePan />

      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 7, 5]} intensity={1.1} castShadow />
      <pointLight position={[-5, 5, 5]} intensity={0.5} />

      {/* Objects */}
      <Physics gravity={[0, -9.81, 0]}>
        <Ground />
        <Bounds />
        <PhysicsDice throwSeed={throwSeed} index={0} onSettled={onDiceSettled} />
        <PhysicsDice throwSeed={throwSeed} index={1} onSettled={onDiceSettled} />
      </Physics>

      {/* Background */}
      <color attach="background" args={['#1a1a2e']} />
    </Canvas>
  )
}

export default function App() {
  const [throwSeed, setThrowSeed] = useState(0)
  const [settledDice, setSettledDice] = useState<Record<number, boolean>>({})
  const [topFaceValues, setTopFaceValues] = useState<Record<number, number>>({})

  const handleThrow = () => {
    setSettledDice({})
    setTopFaceValues({})
    setThrowSeed((seed) => seed + 1)
  }

  const handleDiceSettled = (index: number, topValue: number) => {
    setSettledDice((prev) => ({ ...prev, [index]: true }))
    setTopFaceValues((prev) => ({ ...prev, [index]: topValue }))
  }

  const allSettled = settledDice[0] && settledDice[1]
  const hasBothValues = topFaceValues[0] !== undefined && topFaceValues[1] !== undefined
  const total = hasBothValues ? topFaceValues[0] + topFaceValues[1] : 0

  return (
    <div className="app-container">
      <Scene throwSeed={throwSeed} onDiceSettled={handleDiceSettled} />
      <div className="controls-panel">
        <button className="throw-button" onClick={handleThrow}>
          Throw Dice
        </button>
        <div>

          <p>{allSettled ? '' : 'Rolling...'}</p>
          {hasBothValues && (
            <p>
              Top faces: {topFaceValues[0]} + {topFaceValues[1]} = {total}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
