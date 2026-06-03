import { useEffect, useState, useRef, useCallback } from 'react'

export interface UseShakeDetectionReturn {
  isSupported: boolean
  needsPermission: boolean
  permissionState: 'granted' | 'denied' | 'prompt' | 'unsupported'
  requestPermission: () => Promise<void>
  isListening: boolean
}

interface UseShakeDetectionOptions {
  threshold?: number
  cooldown?: number
}

export function useShakeDetection(
  onShake: () => void,
  options: UseShakeDetectionOptions = {}
): UseShakeDetectionReturn {
  const { threshold = 15, cooldown = 1000 } = options

  const [permissionState, setPermissionState] = useState<
    'granted' | 'denied' | 'prompt' | 'unsupported'
  >('prompt')
  const [isListening, setIsListening] = useState(false)
  const lastShakeTime = useRef(0)

  // Check if device supports motion events
  const isSupported = typeof DeviceMotionEvent !== 'undefined'

  // Check if iOS permission is needed
  const needsPermission =
    isSupported &&
    typeof (DeviceMotionEvent as any).requestPermission === 'function'

  // Request permission (iOS only)
  const requestPermission = useCallback(async () => {
    if (!needsPermission) {
      setPermissionState('granted')
      return
    }

    try {
      const permission = await (DeviceMotionEvent as any).requestPermission()
      setPermissionState(permission === 'granted' ? 'granted' : 'denied')
      if (permission === 'granted') {
        setIsListening(true)
      }
    } catch (error) {
      console.error('Permission request failed:', error)
      setPermissionState('denied')
    }
  }, [needsPermission])

  // Set initial state for non-iOS devices
  useEffect(() => {
    if (isSupported && !needsPermission) {
      setPermissionState('granted')
    } else if (!isSupported) {
      setPermissionState('unsupported')
    }
  }, [isSupported, needsPermission])

  // Motion event handler
  useEffect(() => {
    if (!isSupported || permissionState !== 'granted') {
      setIsListening(false)
      return
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
        return
      }

      const magnitude = Math.sqrt(
        acceleration.x * acceleration.x +
          acceleration.y * acceleration.y +
          acceleration.z * acceleration.z
      )

      const now = Date.now()

      if (magnitude > threshold && now - lastShakeTime.current > cooldown) {
        lastShakeTime.current = now
        onShake()
      }
    }

    window.addEventListener('devicemotion', handleMotion)
    setIsListening(true)

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      setIsListening(false)
    }
  }, [isSupported, permissionState, onShake, threshold, cooldown])

  return {
    isSupported,
    needsPermission,
    permissionState,
    requestPermission,
    isListening,
  }
}
