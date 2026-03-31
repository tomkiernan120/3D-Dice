import { useMemo, useRef } from 'react'
import {
  Group,
  BoxGeometry,
  Vector3,
  BufferGeometry,
  PlaneGeometry,
  DoubleSide,
} from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

interface DiceGeometryParams {
  segments: number
  edgeRadius: number
  notchRadius: number
  notchDepth: number
}

function createBoxGeometry(params: DiceGeometryParams) {
  const boxGeometry = new BoxGeometry(
    1,
    1,
    1,
    params.segments,
    params.segments,
    params.segments,
  )

  const positionAttr = boxGeometry.attributes.position
  const subCubeHalfSize = 0.5 - params.edgeRadius

  for (let i = 0; i < positionAttr.count; i++) {
    let position = new Vector3().fromBufferAttribute(positionAttr, i)

    const subCube = new Vector3(
      Math.sign(position.x),
      Math.sign(position.y),
      Math.sign(position.z),
    ).multiplyScalar(subCubeHalfSize)
    const addition = new Vector3().subVectors(position, subCube)

    if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.normalize().multiplyScalar(params.edgeRadius)
      position = subCube.add(addition)
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize
    ) {
      addition.z = 0
      addition.normalize().multiplyScalar(params.edgeRadius)
      position.x = subCube.x + addition.x
      position.y = subCube.y + addition.y
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.y = 0
      addition.normalize().multiplyScalar(params.edgeRadius)
      position.x = subCube.x + addition.x
      position.z = subCube.z + addition.z
    } else if (
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      addition.x = 0
      addition.normalize().multiplyScalar(params.edgeRadius)
      position.y = subCube.y + addition.y
      position.z = subCube.z + addition.z
    }

    const notchWave = (v: number) => {
      v = (1 / params.notchRadius) * v
      v = Math.PI * Math.max(-1, Math.min(1, v))
      return params.notchDepth * (Math.cos(v) + 1)
    }
    const notch = (pos: [number, number]) => notchWave(pos[0]) * notchWave(pos[1])

    const offset = 0.23

    if (position.y === 0.5) {
      position.y -= notch([position.x, position.z])
    } else if (position.x === 0.5) {
      position.x -= notch([position.y + offset, position.z + offset])
      position.x -= notch([position.y - offset, position.z - offset])
    } else if (position.z === 0.5) {
      position.z -= notch([position.x - offset, position.y + offset])
      position.z -= notch([position.x, position.y])
      position.z -= notch([position.x + offset, position.y - offset])
    } else if (position.z === -0.5) {
      position.z += notch([position.x + offset, position.y + offset])
      position.z += notch([position.x + offset, position.y - offset])
      position.z += notch([position.x - offset, position.y + offset])
      position.z += notch([position.x - offset, position.y - offset])
    } else if (position.x === -0.5) {
      position.x += notch([position.y + offset, position.z + offset])
      position.x += notch([position.y + offset, position.z - offset])
      position.x += notch([position.y, position.z])
      position.x += notch([position.y - offset, position.z + offset])
      position.x += notch([position.y - offset, position.z - offset])
    } else if (position.y === -0.5) {
      position.y += notch([position.x + offset, position.z + offset])
      position.y += notch([position.x + offset, position.z])
      position.y += notch([position.x + offset, position.z - offset])
      position.y += notch([position.x - offset, position.z + offset])
      position.y += notch([position.x - offset, position.z])
      position.y += notch([position.x - offset, position.z - offset])
    }

    positionAttr.setXYZ(i, position.x, position.y, position.z)
  }

  boxGeometry.deleteAttribute('normal')
  boxGeometry.deleteAttribute('uv')
  const mergedGeometry = mergeVertices(boxGeometry)
  mergedGeometry.computeVertexNormals()

  return mergedGeometry
}

function createInnerGeometry(edgeRadius: number) {
  const baseGeometry = new PlaneGeometry(1 - 2 * edgeRadius, 1 - 2 * edgeRadius)
  const offset = 0.48

  const inner = mergeGeometries(
    [
      baseGeometry.clone().translate(0, 0, offset),
      baseGeometry.clone().translate(0, 0, -offset),
      baseGeometry.clone().rotateX(0.5 * Math.PI).translate(0, -offset, 0),
      baseGeometry.clone().rotateX(0.5 * Math.PI).translate(0, offset, 0),
      baseGeometry.clone().rotateY(0.5 * Math.PI).translate(-offset, 0, 0),
      baseGeometry.clone().rotateY(0.5 * Math.PI).translate(offset, 0, 0),
    ],
    false,
  )

  if (!inner) {
    throw new Error('Failed to build inner dice geometry')
  }

  return inner
}

interface DiceProps {
  segments?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  outerColor?: string
  innerColor?: string
  edgeRadius?: number
  notchRadius?: number
  notchDepth?: number
  onModifyGeometry?: (geometry: BufferGeometry) => void
}

export function Dice({
  segments = 50,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  outerColor = '#eeeeee',
  innerColor = '#000000',
  edgeRadius = 0.07,
  notchRadius = 0.12,
  notchDepth = 0.1,
  onModifyGeometry,
}: DiceProps) {
  const groupRef = useRef<Group>(null)

  const { outerGeometry, innerGeometry } = useMemo(() => {
    const outer = createBoxGeometry({
      segments,
      edgeRadius,
      notchRadius,
      notchDepth,
    })
    const inner = createInnerGeometry(edgeRadius)

    if (onModifyGeometry) {
      onModifyGeometry(outer)
    }

    return {
      outerGeometry: outer,
      innerGeometry: inner,
    }
  }, [segments, edgeRadius, notchRadius, notchDepth, onModifyGeometry])

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh geometry={innerGeometry}>
        <meshStandardMaterial
          color={innerColor}
          roughness={0}
          metalness={1}
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={outerGeometry} castShadow>
        <meshStandardMaterial color={outerColor} />
      </mesh>
    </group>
  )
}
