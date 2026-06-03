import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei'
import { Physics, useBox, usePlane } from '@react-three/cannon'
import { useEffect, useRef, useState } from 'react'
import { Quaternion, Vector3 } from 'three'
import { Dice } from './components/dice'
import { useShakeDetection } from './hooks/useShakeDetection'
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
      <meshStandardMaterial color="#9a9aae" roughness={0} metalness={0} />
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
      <InvisibleWall position={[-2.25, 0.9, -0.4]} size={[0.2, 8, 8]} />
      <InvisibleWall position={[2.25, 0.9, -0.4]} size={[0.2, 8, 8]} />
      <InvisibleWall position={[0, 0.9, -3.7]} size={[5, 8, 0.2]} />
      <InvisibleWall position={[0, 0.9, 2.2]} size={[5, 8, 0.2]} />
      <InvisibleWall position={[0, 3.5, -0.4]} size={[5, 0.2, 8]} />
    </>
  )
}

function DebugCamera({
  onCameraUpdate,
}: {
  onCameraUpdate: (pos: Vec3, rotation: Vec3) => void
}) {
  useFrame(({ camera }) => {
    onCameraUpdate(
      [camera.position.x, camera.position.y, camera.position.z],
      [camera.rotation.x, camera.rotation.y, camera.rotation.z]
    )
  })
  return null
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
  debugMode,
  onCameraUpdate,
}: {
  throwSeed: number
  onDiceSettled: (index: number, topValue: number) => void
  debugMode: boolean
  onCameraUpdate: (pos: Vec3, rotation: Vec3) => void
}) {
  return (
    <Canvas shadows>
      <PerspectiveCamera
        makeDefault
        fov={90}
        position={[1.25, 5.97, 1.16]}
        rotation={[-1.379, 0.203, 0.805]}
      />
      <OrbitControls
        enableZoom
        enablePan
        minDistance={4}
        maxDistance={6}
      />

      {debugMode && <DebugCamera onCameraUpdate={onCameraUpdate} />}
      {debugMode && <Stats />}

      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[50, 70, 50]} intensity={1.1} castShadow />
      <pointLight position={[-50, 50, 50]} intensity={0.5} />

      {/* Objects */}
      <Physics gravity={[0, -9.81, 0]}>
        <Ground />
        <Bounds />
        <PhysicsDice throwSeed={throwSeed} index={0} onSettled={onDiceSettled} />
        <PhysicsDice throwSeed={throwSeed} index={1} onSettled={onDiceSettled} />
      </Physics>

      {/* Background */}
      <color attach="background" args={['#7a7a8e']} />
    </Canvas>
  )
}

export default function App() {
  const [throwSeed, setThrowSeed] = useState(0)
  const [settledDice, setSettledDice] = useState<Record<number, boolean>>({})
  const [topFaceValues, setTopFaceValues] = useState<Record<number, number>>({})
  const [debugMode, setDebugMode] = useState(false)
  const [cameraPos, setCameraPos] = useState<Vec3>([0, 0, 0])
  const [cameraRot, setCameraRot] = useState<Vec3>([0, 0, 0])

  useEffect(() => {
    const isDebug = window.location.hash === '#debug'
    setDebugMode(isDebug)
  }, [])

  const handleThrow = () => {
    setSettledDice({})
    setTopFaceValues({})
    setThrowSeed((seed) => seed + 1)
  }

  const shake = useShakeDetection(handleThrow, {
    threshold: 15,
    cooldown: 1000,
  })

  const handleDiceSettled = (index: number, topValue: number) => {
    setSettledDice((prev) => ({ ...prev, [index]: true }))
    setTopFaceValues((prev) => ({ ...prev, [index]: topValue }))
  }

  const handleCameraUpdate = (pos: Vec3, rot: Vec3) => {
    setCameraPos(pos)
    setCameraRot(rot)
  }

  const allSettled = settledDice[0] && settledDice[1]
  const hasBothValues = topFaceValues[0] !== undefined && topFaceValues[1] !== undefined
  const total = hasBothValues ? topFaceValues[0] + topFaceValues[1] : 0

  return (
    <div className="app-container">
      <Scene
        throwSeed={throwSeed}
        onDiceSettled={handleDiceSettled}
        debugMode={debugMode}
        onCameraUpdate={handleCameraUpdate}
      />
      {shake.needsPermission && shake.permissionState === 'prompt' && (
        <div className="permission-banner">
          <p>Enable shake to roll dice</p>
          <button
            className="permission-button"
            onClick={shake.requestPermission}
          >
            Enable Shake
          </button>
        </div>
      )}
      {shake.isListening && shake.permissionState === 'granted' && (
        <div className="shake-status">
          Shake device to roll
        </div>
      )}
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
      {debugMode && (
        <div className="debug-panel">
          <div className="debug-title">Debug Info</div>
          <div className="debug-info">
            <div>
              <strong>Camera Position:</strong>
              <br />
              X: {cameraPos[0].toFixed(2)}
              <br />
              Y: {cameraPos[1].toFixed(2)}
              <br />Z: {cameraPos[2].toFixed(2)}
            </div>
            <div style={{ marginTop: '12px' }}>
              <strong>Camera Rotation:</strong>
              <br />
              X: {cameraRot[0].toFixed(3)}
              <br />
              Y: {cameraRot[1].toFixed(3)}
              <br />Z: {cameraRot[2].toFixed(3)}
            </div>
          </div>
          <button
            className="debug-copy-button"
            onClick={() => {
              const config = `position={[${cameraPos[0].toFixed(2)}, ${cameraPos[1].toFixed(2)}, ${cameraPos[2].toFixed(2)}]}`;
              navigator.clipboard.writeText(config);
            }}
          >
            Copy Position
          </button>
        </div>
      )}
    </div>
  )
}
